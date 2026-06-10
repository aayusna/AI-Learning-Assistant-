import pytest


@pytest.fixture
def test_user():
    return {
        "name": "Test Student",
        "email": "test@student.com",
        "password": "testpass123",
    }


@pytest.mark.asyncio
async def test_register_new_user(client, test_user):
    response = await client.post("/api/auth/register", json=test_user)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_user["email"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_user):
    await client.post("/api/auth/register", json=test_user)
    response = await client.post("/api/auth/register", json=test_user)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_valid_credentials(client, test_user):
    await client.post("/api/auth/register", json=test_user)
    response = await client.post(
        "/api/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client, test_user):
    await client.post("/api/auth/register", json=test_user)
    response = await client.post(
        "/api/auth/login",
        json={"email": test_user["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_with_valid_token(client, test_user):
    reg = await client.post("/api/auth/register", json=test_user)
    token = reg.json()["access_token"]
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == test_user["email"]


@pytest.mark.asyncio
async def test_get_me_without_token(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
