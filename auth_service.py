from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from src.core.sqlite_database import get_sqlite_connection
from src.core.security import hash_password, verify_password, create_access_token
from src.models.schemas import UserRegister, UserLogin


def _row_to_user(row) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "email": row["email"],
        "created_at": row["created_at"],
        "documents_uploaded": row["documents_uploaded"] or 0,
        "quizzes_taken": row["quizzes_taken"] or 0,
        "resume_score": row["resume_score"],
        "last_active": row["last_active"],
    }


async def register_user(data: UserRegister) -> dict:
    conn = get_sqlite_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (data.email,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        now = datetime.now(timezone.utc).isoformat()
        cursor = conn.execute(
            """
            INSERT INTO users (name, email, password, created_at, last_active)
            VALUES (?, ?, ?, ?, ?)
            """,
            (data.name, data.email, hash_password(data.password), now, now),
        )
        conn.commit()
        user_id = str(cursor.lastrowid)
    finally:
        conn.close()

    token = create_access_token({"sub": user_id, "email": data.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email,
        },
    }


async def login_user(data: UserLogin) -> dict:
    conn = get_sqlite_connection()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (data.email,)
        ).fetchone()
        if not row or not verify_password(data.password, row["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "UPDATE users SET last_active = ? WHERE id = ?",
            (now, row["id"]),
        )
        conn.commit()
        user = _row_to_user(row)
    finally:
        conn.close()

    token = create_access_token({"sub": user["id"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
    }


async def get_user_by_id(user_id: str) -> Optional[dict]:
    conn = get_sqlite_connection()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (int(user_id),)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return _row_to_user(row)
    finally:
        conn.close()


async def update_user_stats(user_id: str, field: str, value) -> None:
    allowed = {"documents_uploaded", "quizzes_taken", "resume_score", "last_active"}
    if field not in allowed:
        raise ValueError(f"Unsupported user stat field: {field}")

    conn = get_sqlite_connection()
    try:
        conn.execute(
            f"UPDATE users SET {field} = ?, last_active = ? WHERE id = ?",
            (value, datetime.now(timezone.utc).isoformat(), int(user_id)),
        )
        conn.commit()
    finally:
        conn.close()


async def increment_user_counter(user_id: str, field: str) -> None:
    allowed = {"documents_uploaded", "quizzes_taken"}
    if field not in allowed:
        raise ValueError(f"Unsupported counter field: {field}")

    conn = get_sqlite_connection()
    try:
        conn.execute(
            f"""
            UPDATE users
            SET {field} = COALESCE({field}, 0) + 1,
                last_active = ?
            WHERE id = ?
            """,
            (datetime.now(timezone.utc).isoformat(), int(user_id)),
        )
        conn.commit()
    finally:
        conn.close()
