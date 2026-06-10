from fastapi import APIRouter, Depends
from src.models.schemas import SummaryRequest, SummaryResponse, QuizRequest, QuizResponse
from src.services import rag_pipeline
from src.services import auth_service
from src.core.security import get_current_user
from src.core.ai_helpers import chat_with_fallback
from src.services import ai_fallbacks

router = APIRouter(prefix="/api/study", tags=["Study Assistant"])


@router.post("/summarize", response_model=SummaryResponse, summary="Summarize any text or topic")
async def summarize(
    request: SummaryRequest,
    current_user: dict = Depends(get_current_user),
):
    return await rag_pipeline.summarize_text(
        text=request.text,
        length=request.length,
    )


@router.post("/generate-quiz", response_model=QuizResponse, summary="Generate MCQ quiz on any topic")
async def generate_quiz(
    request: QuizRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await rag_pipeline.generate_quiz(
        topic=request.topic,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
    )
    await auth_service.increment_user_counter(current_user["user_id"], "quizzes_taken")
    return result


@router.post("/generate-notes", summary="Generate structured study notes on a topic")
async def generate_notes(
    topic: str,
    current_user: dict = Depends(get_current_user),
):
    content, used_fallback = await chat_with_fallback(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a study notes generator. Create clear, structured notes "
                    "with headings, bullet points, and key terms highlighted."
                ),
            },
            {"role": "user", "content": f"Generate detailed study notes on: {topic}"},
        ],
        max_tokens=1024,
        fallback=lambda: ai_fallbacks.fallback_notes(topic)["notes"],
    )

    return {
        "topic": topic,
        "notes": content,
        "ai_powered": not used_fallback,
    }
