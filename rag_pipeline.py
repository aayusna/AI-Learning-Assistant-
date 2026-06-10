import os
import pickle
import re
from pathlib import Path
from typing import List, Optional

import pdfplumber
import docx
import faiss
import numpy as np

from src.core.ai_helpers import chat_with_fallback
from src.core.constants import CHUNK_SIZE, CHUNK_OVERLAP, EMBEDDING_MODEL, MAX_TOKENS
from src.services import ai_fallbacks

VECTOR_STORE_DIR = Path("data/vector_stores")
VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    import io
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    import io
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return chunks


def _local_text_embedding(text: str, dimension: int = 512) -> np.ndarray:
    vector = np.zeros(dimension, dtype="float32")
    tokens = re.findall(r"\w+", text.lower())
    for token in tokens:
        idx = hash(token) % dimension
        vector[idx] += 1.0
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector /= norm
    return vector


async def _get_local_embeddings(texts: List[str]) -> np.ndarray:
    return np.vstack([_local_text_embedding(text) for text in texts])


async def get_embeddings(texts: List[str]) -> np.ndarray:
    """Generate embeddings using local fallback method."""
    return await _get_local_embeddings(texts)


async def build_vector_store(user_id: str, text: str) -> str:
    chunks = chunk_text(text)
    embeddings = await get_embeddings(chunks)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    store_path = VECTOR_STORE_DIR / user_id
    store_path.mkdir(exist_ok=True)

    faiss.write_index(index, str(store_path / "index.faiss"))
    with open(store_path / "chunks.pkl", "wb") as f:
        pickle.dump(chunks, f)

    return str(store_path)


async def query_vector_store(user_id: str, query: str, top_k: int = 4) -> List[str]:
    store_path = VECTOR_STORE_DIR / user_id
    if not store_path.exists():
        return []

    index = faiss.read_index(str(store_path / "index.faiss"))
    with open(store_path / "chunks.pkl", "rb") as f:
        chunks = pickle.load(f)

    query_embedding = await get_embeddings([query])
    _, indices = index.search(query_embedding, top_k)
    return [chunks[i] for i in indices[0] if i < len(chunks)]


async def answer_question(user_id: str, question: str, mode: str = "study") -> dict:
    context_chunks = await query_vector_store(user_id, question)

    system_prompts = {
        "study": "You are a helpful study assistant. Answer questions clearly using the provided context. If unsure, say so.",
        "career": "You are a career counselor. Provide actionable career advice based on the context provided.",
        "interview": "You are an interview coach. Generate thoughtful answers and follow-up questions based on the context.",
    }

    system_prompt = system_prompts.get(mode, system_prompts["study"])
    context = "\n\n".join(context_chunks) if context_chunks else "No document context available."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
    ]

    content, used_fallback = await chat_with_fallback(
        messages=messages,
        max_tokens=MAX_TOKENS,
        fallback=lambda: ai_fallbacks.fallback_chat_reply(question, mode),
    )

    return {
        "reply": content,
        "sources": context_chunks[:2],
        "ai_powered": not used_fallback,
    }


async def summarize_text(text: str, length: str = "medium") -> dict:
    length_map = {
        "short": "2-3 sentences",
        "medium": "1 paragraph",
        "detailed": "3-4 paragraphs with key sections",
    }
    instruction = length_map.get(length, length_map["medium"])

    import json

    content, used_fallback = await chat_with_fallback(
        messages=[
            {"role": "system", "content": "You are an expert summarizer. Respond with JSON: {summary, key_points: []}. Return only valid JSON and do not repeat the original text."},
            {"role": "user", "content": f"Summarize in {instruction}:\n\n{text[:4000]}"},
        ],
        max_tokens=MAX_TOKENS,
        json_mode=True,
        temperature=0.2,
        fallback=lambda: json.dumps(ai_fallbacks.fallback_summarize(text, length)),
    )

    try:
        result = json.loads(content) if isinstance(content, str) else content
    except (json.JSONDecodeError, TypeError):
        result = ai_fallbacks.fallback_summarize(text, length)
        used_fallback = True

    if not isinstance(result, dict):
        result = ai_fallbacks.fallback_summarize(text, length)
        used_fallback = True

    summary = result.get("summary", "")
    if summary.strip() == text.strip() or len(summary.split()) > len(text.split()) * 0.9:
        result = ai_fallbacks.fallback_summarize(text, length)
        summary = result["summary"]
        used_fallback = True

    return {
        "summary": summary,
        "key_points": result.get("key_points", []),
        "word_count": len(text.split()),
        "ai_powered": not used_fallback,
    }


async def generate_quiz(topic: str, num_questions: int = 5, difficulty: str = "medium") -> dict:
    import json

    content, used_fallback = await chat_with_fallback(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a quiz generator. Return valid JSON only: "
                    "{questions: [{question, options: [4 choices], correct_index, explanation}]}"
                ),
            },
            {
                "role": "user",
                "content": f"Generate {num_questions} {difficulty} MCQ questions on: {topic}",
            },
        ],
        max_tokens=MAX_TOKENS * 2,
        json_mode=True,
        temperature=0.2,
        fallback=lambda: json.dumps(
            ai_fallbacks.fallback_quiz(topic, num_questions, difficulty)
        ),
    )

    try:
        result = json.loads(content) if isinstance(content, str) else content
    except (json.JSONDecodeError, TypeError):
        result = ai_fallbacks.fallback_quiz(topic, num_questions, difficulty)
        used_fallback = True

    if not isinstance(result, dict) or "questions" not in result:
        result = ai_fallbacks.fallback_quiz(topic, num_questions, difficulty)
        used_fallback = True

    return {
        "topic": topic,
        "questions": result.get("questions", []),
        "ai_powered": not used_fallback,
    }
