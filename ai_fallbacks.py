"""Rule-based fallbacks when OpenAI is unavailable."""

import json
import re
from typing import List


def fallback_resume_suggestions(ats_result: dict, target_role: str = "") -> List[str]:
    missing = ats_result.get("missing_keywords", [])[:8]
    score = ats_result.get("ats_score", 0)
    role = target_role or "your target role"
    tips = [
        f"Tailor your resume for {role} by adding role-specific keywords naturally in skills and experience.",
        "Use bullet points with measurable outcomes (e.g. improved performance by 20%).",
    ]
    if score < 60:
        tips.append("ATS score is low — add a clear Skills section with tools from the job description.")
    if missing:
        tips.append(f"Add these keywords where relevant: {', '.join(missing[:5])}.")
    if not ats_result.get("has_contact_info"):
        tips.append("Include email and phone at the top of your resume.")
    if not ats_result.get("has_education"):
        tips.append("Add an Education section with degree, institution, and year.")
    return tips[:6]


def fallback_summarize(text: str, length: str) -> dict:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    n = 1 if length == "short" else 2 if length == "medium" else 3

    if not sentences:
        summary = text.strip()[:180].rstrip() + ("..." if len(text) > 180 else "")
        key_points = [summary]
    else:
        summary_sentences = sentences[:n]
        summary = " ".join(summary_sentences)

        if len(summary.split()) > 80:
            summary = " ".join(summary.split()[:80]) + "..."

        if summary.strip() == text.strip() and len(sentences) > 1:
            summary = " ".join(sentences[:min(n, len(sentences) - 1)])
            if len(summary.split()) > 80:
                summary = " ".join(summary.split()[:80]) + "..."

        key_points = []
        if sentences:
            key_points.append(sentences[0])
        if len(sentences) > 2:
            midpoint = sentences[len(sentences) // 2]
            if midpoint not in key_points:
                key_points.append(midpoint)
        if len(sentences) > 1:
            key_points.append(sentences[-1])

    return {
        "summary": summary,
        "key_points": key_points[:5],
        "word_count": len(text.split()),
    }


def fallback_quiz(topic: str, num_questions: int, difficulty: str) -> dict:
    questions = []
    for i in range(min(num_questions, 5)):
        questions.append({
            "question": f"{difficulty.title()} question {i + 1}: What is a key idea to remember about {topic}?",
            "options": [
                f"A major concept in {topic}",
                f"A less important detail about {topic}",
                f"An unrelated topic",
                "None of the above",
            ],
            "correct_index": 0,
            "explanation": f"The correct answer focuses on the main concept of {topic}.",
        })
    return {"topic": topic, "questions": questions}


def fallback_chat_reply(question: str, mode: str) -> str:
    if mode == "career":
        return (
            "Career mode (offline): List your skills, pick a target role, and use the Career Roadmap module. "
            "Add OpenAI credits for personalized AI answers."
        )
    if mode == "interview":
        return (
            "Interview mode (offline): Use the Career module's interview prep tab. "
            "Add OpenAI credits for AI-generated questions."
        )
    return (
        f"Study assistant (offline): You asked about «{question[:80]}». "
        "Upload a PDF in Document Chat, or add billing to your OpenAI API key for full AI answers."
    )


def fallback_notes(topic: str) -> dict:
    notes = f"""# {topic}

## Overview
Structured notes require OpenAI. Add API billing to generate full notes.

## Suggested study outline
1. Core definitions and terminology
2. Key algorithms / patterns
3. Practical examples and use cases
4. Common interview questions
5. Recommended practice resources (docs, tutorials)

## Next steps
- Use Quiz & Study Tools to test yourself on {topic}
- Upload related material in Document Chat
"""
    return {"topic": topic, "notes": notes}


def fallback_career_roadmap(skills: List[str], recommended_path: str, skill_gaps: List[str]) -> dict:
    gaps = skill_gaps[:5]
    steps = []
    for i, gap in enumerate(gaps or ["fundamentals", "projects", "interviews"]):
        steps.append({
            "week": f"Week {i * 2 + 1}-{i * 2 + 2}",
            "topic": gap.title() if isinstance(gap, str) else str(gap),
            "resource": "Official docs, freeCodeCamp, or Coursera intro course",
        })
    if len(steps) < 4:
        steps.extend([
            {"week": "Week 7-8", "topic": "Portfolio project", "resource": "Build 1 end-to-end project on GitHub"},
            {"week": "Week 9-10", "topic": "Interview prep", "resource": "LeetCode + mock interviews"},
        ])
    return {
        "learning_roadmap": steps[:8],
        "certifications": ["Relevant Coursera/edX certificate for " + recommended_path],
        "estimated_weeks": max(8, len(steps) * 2),
    }


def fallback_interview_questions(role: str, skills: List[str], difficulty: str) -> List[dict]:
    skill_str = ", ".join(skills[:5]) if skills else "your stack"
    return [
        {
            "question": f"Explain your experience with {skill_str} for a {role} role.",
            "type": "technical",
            "hint": "Mention projects, tools, and outcomes.",
        },
        {
            "question": "Describe a challenging bug you fixed and how you debugged it.",
            "type": "behavioral",
            "hint": "Use STAR: Situation, Task, Action, Result.",
        },
        {
            "question": f"What is the difference between two core concepts in {role}?",
            "type": "technical",
            "hint": "Compare trade-offs clearly.",
        },
        {
            "question": "Why do you want this role and what will you contribute in the first 90 days?",
            "type": "behavioral",
            "hint": "Align with team goals.",
        },
    ]


def fallback_placement_tips(career_path: str, skill_gaps: List[str]) -> List[str]:
    tips = [
        f"Focus weekly study on closing gaps for {career_path}.",
        "Build one portfolio project that demonstrates end-to-end skills.",
        "Practice 2 mock interviews per week with peers or mentors.",
        "Tailor your resume keywords to each job description.",
        "Apply to internships and entry roles consistently (5–10 per week).",
    ]
    if skill_gaps:
        tips.insert(1, f"Priority skills to learn: {', '.join(skill_gaps[:5])}.")
    return tips
