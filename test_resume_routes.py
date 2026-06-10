import pytest
from unittest.mock import AsyncMock, patch


async def get_auth_token(client) -> str:
    response = await client.post(
        "/api/auth/register",
        json={"name": "Resume Tester", "email": "resume@test.com", "password": "pass1234"},
    )
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_resume_analyze_missing_file(client):
    token = await get_auth_token(client)
    response = await client.post(
        "/api/resume/analyze",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_resume_analyze_unsupported_type(client):
    token = await get_auth_token(client)
    response = await client.post(
        "/api/resume/analyze",
        files={"file": ("resume.exe", b"fake content", "application/octet-stream")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_resume_analyze_txt_file(client):
    resume_content = b"""
    John Doe | john@example.com | +91 9876543210

    EDUCATION
    B.Tech Computer Science, XYZ University, 2024

    SKILLS
    Python, Machine Learning, FastAPI, MongoDB, SQL, Docker, Git

    EXPERIENCE
    Software Intern, ABC Corp (Jan 2024 - June 2024)
    - Built REST APIs using FastAPI and Python
    - Worked with MongoDB and SQL databases
    """

    token = await get_auth_token(client)
    with patch(
        "src.services.resume_analyzer.get_resume_suggestions",
        new_callable=AsyncMock,
        return_value=(["Add measurable impact to bullet points.", "Include more keywords from the job description."], True),
    ):
        response = await client.post(
            "/api/resume/analyze",
            files={"file": ("resume.txt", resume_content, "text/plain")},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert "ats_score" in data
    assert 0 <= data["ats_score"] <= 100
    assert "matched_keywords" in data
    assert "suggestions" in data
    assert data["has_contact_info"] is True
    assert data["has_education"] is True
    assert data["has_experience"] is True


@pytest.mark.asyncio
async def test_resume_requires_auth(client):
    response = await client.post(
        "/api/resume/analyze",
        files={"file": ("resume.txt", b"some content", "text/plain")},
    )
    assert response.status_code == 401
