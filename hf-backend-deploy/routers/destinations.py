"""Destinations CRUD.

- GET    /destinations        (public, tenant-scoped)
- POST   /destinations        (JWT required, same tenant)
- DELETE /destinations/{id}   (JWT required, same tenant, owner of record)
"""
import uuid
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_current_user
from database import get_db
from models import Destination, User

router = APIRouter(prefix="/destinations", tags=["destinations"])


class DestinationCreate(BaseModel):
    tenant_id: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal | None = Field(default=None, ge=0, le=10_000_000)
    currency: str = Field(default="USD", min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")
    image_url: str | None = Field(default=None, max_length=1000)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if not (v.startswith("https://") or v.startswith("http://")):
            raise ValueError("Image URL must start with http:// or https://")
        return v


class DestinationOut(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: str | None
    price: float | None
    currency: str
    image_url: str | None
    is_active: bool
    order: int

    model_config = {"from_attributes": True}


def _to_out(dest: Destination) -> DestinationOut:
    return DestinationOut(
        id=str(dest.id),
        tenant_id=dest.tenant_id,
        title=dest.title,
        description=dest.description,
        price=float(dest.price) if dest.price is not None else None,
        currency=dest.currency,
        image_url=dest.image_url,
        is_active=dest.is_active,
        order=dest.order,
    )


@router.get("", response_model=list[DestinationOut])
async def list_destinations(
    tenant_id: str = Query(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Public: all active destinations for a tenant, ordered."""
    result = await db.execute(
        select(Destination)
        .where(Destination.tenant_id == tenant_id, Destination.is_active == True)  # noqa: E712
        .order_by(Destination.order, Destination.created_at)
    )
    destinations = result.scalars().all()
    return [_to_out(d) for d in destinations]


@router.post("", response_model=DestinationOut, status_code=status.HTTP_201_CREATED)
async def create_destination(
    payload: DestinationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Protected: JWT required; caller must belong to the target tenant."""
    if user.tenant_id != payload.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add destinations to your own tenant.",
        )

    dest = Destination(
        tenant_id=payload.tenant_id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        price=payload.price,
        currency=payload.currency,
        image_url=str(payload.image_url) if payload.image_url else None,
    )
    db.add(dest)
    await db.flush()
    return _to_out(dest)


@router.delete("/{destination_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_destination(
    destination_id: uuid.UUID,
    tenant_id: str = Query(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Protected: JWT required; record must belong to caller's tenant."""
    if user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete destinations in your own tenant.",
        )

    result = await db.execute(
        select(Destination).where(
            Destination.id == destination_id, Destination.tenant_id == tenant_id
        )
    )
    dest = result.scalar_one_or_none()
    if dest is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination not found.")

    await db.execute(
        delete(Destination).where(Destination.id == destination_id, Destination.tenant_id == tenant_id)
    )
