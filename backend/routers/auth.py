"""Authentication routes: register, login, email verification, resend-verification.

Email verification is REQUIRED by default (REQUIRE_EMAIL_VERIFICATION=true):
- register -> user created (is_email_verified=False) + verification email sent
- login -> JWTs issued ONLY if is_email_verified=True, otherwise 403 with resend hint
- verify   -> marks user verified, redirect to frontend success page
"""
import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    create_access_token,
    create_email_verification_token,
    create_refresh_token,
    decode_email_verification_token,
    hash_password,
    validate_password,
    verify_password,
)
from config import get_settings
from database import get_db
from mailer import is_valid_email, send_verification_email
from models import User, UserRole

logger = logging.getLogger("travel.auth_router")
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])

GENERIC_CREDENTIALS_MSG = "Invalid email or password."


class RegisterRequest(BaseModel):
    tenant_id: str = Field(min_length=1, max_length=64)
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1, max_length=128)  # policy enforced below


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str


class MessageResponse(BaseModel):
    message: str


def _verification_url(token: str) -> str:
    return f"{settings.app_base_url.rstrip('/')}/verify-email?token={token}"


async def _dispatch_verification_email(db: AsyncSession, user: User) -> tuple[bool, str]:
    token = create_email_verification_token(user.id, user.tenant_id)
    sent, detail = await send_verification_email(
        to=user.email,
        user_name=user.full_name,
        verify_url=_verification_url(token),
        expires_minutes=settings.email_verification_expire_minutes,
    )
    if not sent:
        logger.warning("Verification email not delivered for user %s: %s", user.id, detail)
    return sent, detail


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> Any:
    # Enforce the server-side password policy
    policy_errors = validate_password(payload.password)
    if policy_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Password does not meet the security policy.", "errors": policy_errors},
        )
    if not is_valid_email(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email address.")

    # Duplicate check (same tenant)
    result = await db.execute(
        select(User).where(User.tenant_id == payload.tenant_id, User.email == payload.email.lower())
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    user = User(
        tenant_id=payload.tenant_id,
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        role=UserRole.customer,
        is_email_verified=not settings.require_email_verification,  # False unless verification disabled
    )
    db.add(user)
    await db.flush()

    if settings.require_email_verification:
        sent, _ = await _dispatch_verification_email(db, user)
        if sent:
            return {"message": "Account created. Check your email to verify your address."}
        return {"message": "Account created, but the verification email could not be sent. Request a new one via /auth/resend-verification."}
    return {"message": "Account created and active."}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(
        select(User).where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()

    # Constant-ish failure: same error whether email or password is wrong
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_CREDENTIALS_MSG)
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    # --- requireEmailVerification enforcement ---
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox, or request a new link via /auth/resend-verification.",
        )

    user.last_login_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    await db.flush()

    return TokenResponse(
        access_token=create_access_token(user.id, user.tenant_id, user.role),
        refresh_token=create_refresh_token(user.id, user.tenant_id),
        user_id=str(user.id),
        email=user.email,
        role=user.role.value,
    )


@router.get("/verify-email")
async def verify_email(
    token: str = Query(min_length=20),
    db: AsyncSession = Depends(get_db),
) -> Response:
    from auth import JWTError

    try:
        claims = decode_email_verification_token(token)
    except JWTError:
        return RedirectResponse(
            url=f"{settings.app_base_url.rstrip('/')}/verify-email?status=invalid",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    user_id = claims.get("sub")
    tenant_id = claims.get("tenant_id")
    if not user_id or not tenant_id:
        return RedirectResponse(
            url=f"{settings.app_base_url.rstrip('/')}/verify-email?status=invalid",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or user.tenant_id != tenant_id:
        # Do not reveal whether the account exists
        return RedirectResponse(
            url=f"{settings.app_base_url.rstrip('/')}/verify-email?status=invalid",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    if user.is_email_verified:
        return RedirectResponse(
            url=f"{settings.app_base_url.rstrip('/')}/verify-email?status=already-verified",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    user.is_email_verified = True
    await db.flush()

    return RedirectResponse(
        url=f"{settings.app_base_url.rstrip('/')}/verify-email?status=success",
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    email: EmailStr,
    tenant_id: str = Query(min_length=1, max_length=64),
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(User).where(User.tenant_id == tenant_id, User.email == email.lower())
    )
    user = result.scalar_one_or_none()

    # Anti-enumeration: identical response whether or not the account exists
    generic = {"message": "If an unverified account exists for this email, a new verification link has been sent."}
    if user is None or user.is_email_verified:
        return generic

    sent, _ = await _dispatch_verification_email(db, user)
    return generic
