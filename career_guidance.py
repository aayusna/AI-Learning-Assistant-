import json
from typing import List, Dict

from src.core.ai_helpers import chat_with_fallback
from src.core.constants import CAREER_PATHS
from src.core.sqlite_database import get_sqlite_connection
from src.services import ai_fallbacks


def match_career_path(user_skills: List[str]) -> str:
    user_skills_lower = [s.lower() for s in user_skills]
    best_path = "backend_engineer"
    best_score = 0

    for path, required_skills in CAREER_PATHS.items():
        matched = sum(1 for skill in required_skills if skill.lower() in user_skills_lower)
        score = matched / len(required_skills)
        if score > best_score:
            best_score = score
            best_path = path

    return best_path.replace("_", " ").title()


def find_skill_gaps(user_skills: List[str], career_path: str) -> List[str]:
    path_key = career_path.lower().replace(" ", "_")
    required = CAREER_PATHS.get(path_key, [])
    user_lower = [s.lower() for s in user_skills]
    return [skill for skill in required if skill.lower() not in user_lower]


async def generate_career_roadmap(
    skills: List[str],
    interests: str,
    experience_years: int,
) -> dict:
    recommended_path = match_career_path(skills)
    skill_gaps = find_skill_gaps(skills, recommended_path)

    prompt = f"""
    Student profile:
    - Current Skills: {", ".join(skills)}
    - Interests: {interests or "Not specified"}
    - Experience: {experience_years} years
    - Recommended Career Path: {recommended_path}
    - Skill Gaps: {", ".join(skill_gaps)}

    Generate a personalized career roadmap as JSON with this exact structure:
    {{
        "learning_roadmap": [
            {{"week": "Week 1-2", "topic": "...", "resource": "..."}},
            ...
        ],
        "certifications": ["cert1", "cert2", ...],
        "estimated_weeks": <number>
    }}
    Provide 6-8 roadmap steps. Keep resources practical (YouTube, Coursera, docs).
    """

    content, used_fallback = await chat_with_fallback(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert career counselor for tech students. "
                    "Respond ONLY with valid JSON, no extra text."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=1024,
        json_mode=True,
        fallback=lambda: json.dumps(
            ai_fallbacks.fallback_career_roadmap(skills, recommended_path, skill_gaps)
        ),
    )

    result = json.loads(content)

    return {
        "recommended_path": recommended_path,
        "skill_gaps": skill_gaps,
        "learning_roadmap": result.get("learning_roadmap", []),
        "certifications": result.get("certifications", []),
        "estimated_weeks": result.get("estimated_weeks", 12),
        "ai_powered": not used_fallback,
    }


async def generate_interview_questions(
    role: str,
    skills: List[str],
    difficulty: str = "medium",
) -> tuple[List[Dict[str, str]], bool]:
    content, used_fallback = await chat_with_fallback(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an interview coach. Generate interview questions as JSON: "
                    '{"questions": [{"question": "...", "type": "technical|behavioral", "hint": "..."}]}'
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Generate 8 {difficulty} interview questions for a {role} role. "
                    f"Relevant skills: {', '.join(skills)}."
                ),
            },
        ],
        max_tokens=1024,
        json_mode=True,
        fallback=lambda: json.dumps({
            "questions": ai_fallbacks.fallback_interview_questions(role, skills, difficulty)
        }),
    )

    result = json.loads(content)
    return result.get("questions", []), not used_fallback


async def get_placement_tips(career_path: str, skill_gaps: List[str]) -> tuple[List[str], bool]:
    content, used_fallback = await chat_with_fallback(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a placement counselor. Give actionable tips as JSON: "
                    '{"tips": ["tip1", "tip2", ...]}'
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Give 5 placement preparation tips for a student targeting {career_path}. "
                    f"They still need to learn: {', '.join(skill_gaps[:5])}."
                ),
            },
        ],
        max_tokens=512,
        json_mode=True,
        fallback=lambda: json.dumps({
            "tips": ai_fallbacks.fallback_placement_tips(career_path, skill_gaps)
        }),
    )

    result = json.loads(content)
    return result.get("tips", []), not used_fallback


def save_quiz_result(user_id: int, topic: str, score: float, total: int):
    conn = get_sqlite_connection()
    conn.execute(
        "INSERT INTO quiz_results (user_id, topic, score, total) VALUES (?, ?, ?, ?)",
        (user_id, topic, score, total),
    )
    conn.commit()
    conn.close()


def get_quiz_history(user_id: int) -> list:
    conn = get_sqlite_connection()
    rows = conn.execute(
        "SELECT topic, score, total, taken_at FROM quiz_results WHERE user_id = ? ORDER BY taken_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
