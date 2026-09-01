"""Password hashing (bcrypt) and JWT creation/verification (python-jose).

Password policy mirrors frontend/src/lib/auth.ts:
min 12 chars, 1 upper, 1 lower, 1 digit, 1 special.
"""
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import get_settings
from models import UserRole

settings = get_settings()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

PASSWORD_MIN_LENGTH = 12
PASSWORD_MAX_LENGTH = 128
SPECIAL_CHAR_RE = re.compile(r"[!@#$%^&*()_+\-=\[\]{};:,.<>?/|~]")
CONTROL_CHAR_RE = re.compile(r"[\x00-\x1f\x7f]")

BLOCKED_PASSWORDS = {
    "password",
    "password1",
    "password123",
    "qwerty123456",
    "admin123456",
    "letmein12345",
    "welcome12345",
    "travel2026!!",
}


def validate_password(password: str) -> list[str]:
    """Return a list of policy violations; empty list = valid."""
    errors: list[str] = []
    if not password or not isinstance(password, str):
        return ["Password is required."]
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters long.")
    if len(password) > PASSWORD_MAX_LENGTH:
        errors.append(f"Password must be at most {PASSWORD_MAX_LENGTH} characters long.")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", password):
        errors.append("Password must contain at least one number.")
    if not SPECIAL_CHAR_RE.search(password):
        errors.append("Password must contain at least one special character.")
    if CONTROL_CHAR_RE.search(password):
        errors.append("Password contains invalid control characters.")
    if password.lower() in BLOCKED_PASSWORDS:
        errors.append("This password is too common. Choose something unique.")
    return errors


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:  # noqa: BLE001 - never leak hash errors
        return False


# ------------------------- JWT -------------------------

TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"


def _create_token(
    subject: str | uuid.UUID,
    token_type: str,
    expires_delta: timedelta,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(
    user_id: uuid.UUID,
    tenant_id: str,
    role: UserRole,
) -> str:
    return _create_token(
        subject=user_id,
        token_type=TOKEN_TYPE_ACCESS,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        extra_claims={"tenant_id": tenant_id, "role": role.value},
    )


def create_refresh_token(user_id: uuid.UUID, tenant_id: str) -> str:
    return _create_token(
        subject=user_id,
        token_type=TOKEN_TYPE_REFRESH,
        expires_delta=timedelta(days=7),
        extra_claims={"tenant_id": tenant_id},
    )


def decode_token(
    token: str,
    expected_type: Literal["access", "refresh"] | None = None,
) -> dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError on any failure."""
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub", "type"]},
    )
    if expected_type is not None and payload.get("type") != expected_type:
        raise JWTError(f"Invalid token type: expected {expected_type}")
    return payload


__all__ = [
    "validate_password",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "JWTError",
]
