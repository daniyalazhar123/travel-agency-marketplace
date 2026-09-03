"""JWT authentication dependency for protected endpoints.

Extracts Bearer token, decodes + validates it, loads the user (active +
verified), and enforces the tenant scope claim.
"""
import uuid
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import TOKEN_TYPE_ACCESS, decode_token
from database import get_db
from models import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        claims = decode_token(credentials.credentials, expected_type=TOKEN_TYPE_ACCESS)
    except Exception:  # noqa: BLE001 - expired/invalid/tampered all map to 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token subject.")

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active or not user.is_email_verified:
        raise HTTPException(status_code=401, detail="Account not found, deactivated, or unverified.")

    return user


async def require_tenant_access(
    user: User = Depends(get_current_user),
    tenant_id: str = "",
) -> User:
    """Enforce that the authenticated user belongs to the requested tenant."""
    if tenant_id and user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this tenant's resources.",
        )
    return user


def require_role(*roles: UserRole):
    """Role gate factory for admin-level endpoints."""

    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
        return user

    return checker


def user_claims(user: User) -> dict[str, Any]:
    """Sanitized claims for API responses (never leak password hash)."""
    return {
        "user_id": str(user.id),
        "email": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role.value,
    }
