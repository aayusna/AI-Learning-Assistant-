import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from openai import RateLimitError, AuthenticationError, APIConnectionError
from src.core.ai_helpers import openai_user_message
from src.models.schemas import ChatRequest, ChatResponse
from src.services import rag_pipeline
from src.services import auth_service
from src.core.security import get_current_user
from src.core.constants import SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_MB
from src.core.sqlite_database import save_chat_message

router = APIRouter(prefix="/api/chat", tags=["Chat & Study Assistant"])


@router.post("/upload-document", summary="Upload a PDF or DOCX to ask questions from")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a study material (PDF, DOCX, TXT).
    The document is processed into a vector store for RAG-based Q&A.
    """
    # Validate file type
    ext = "." + file.filename.split(".")[-1].lower()
    if ext not in SUPPORTED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {SUPPORTED_FILE_TYPES}"
        )

    # Validate file size
    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE_MB}MB"
        )

    # Extract text
    if ext == ".pdf":
        text = rag_pipeline.extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        text = rag_pipeline.extract_text_from_docx(file_bytes)
    elif ext == ".txt":
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from the file.")

    user_id = current_user["user_id"]
    try:
        await rag_pipeline.build_vector_store(user_id, text)
    except (RateLimitError, AuthenticationError, APIConnectionError) as exc:
        raise HTTPException(status_code=503, detail=openai_user_message(exc)) from exc

    # Update stats
    await auth_service.increment_user_counter(user_id, "documents_uploaded")

    return {
        "message": "Document uploaded and indexed successfully.",
        "filename": file.filename,
        "word_count": len(text.split()),
    }


@router.post("/ask", response_model=ChatResponse, summary="Ask a question to the AI chatbot")
async def ask_question(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Send a message to the AI assistant.
    Modes: 'study' (default), 'career', 'interview'
    If a document was uploaded, the answer is grounded in it (RAG).
    """
    session_id = request.session_id or str(uuid.uuid4())
    user_id = current_user["user_id"]

    save_chat_message(int(user_id), "user", request.message, request.mode)

    result = await rag_pipeline.answer_question(
        user_id=user_id,
        question=request.message,
        mode=request.mode,
    )

    save_chat_message(int(user_id), "assistant", result["reply"], request.mode)

    return ChatResponse(
        reply=result["reply"],
        session_id=session_id,
        sources=result.get("sources", []),
        ai_powered=result.get("ai_powered", True),
    )
