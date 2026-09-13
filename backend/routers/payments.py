"""Stripe Checkout + webhook endpoints.

- POST /payments/create-checkout-session: builds a Stripe Checkout Session
  from booking details and returns the hosted-payment URL.
- POST /webhooks/stripe: raw-body endpoint. Verifies the Stripe-Signature
  header against STRIPE_WEBHOOK_SECRET, then flips the matching booking
  from "pending" to "paid" on checkout.session.completed.

Security notes:
- The webhook reads RAW bytes (no Pydantic body parsing) — Stripe's signature
  is computed over the exact raw payload; any middleware that re-encodes the
  body would break verification.
- Amounts are recomputed server-side from the DB — never trusted from the
  client. Auth is OPTIONAL on session-create (guests may pay); when a JWT is
  present the booking is linked to that account.
- stripe >= 8 removed the `stripe.error` namespace — error classes live at the
  package top level (stripe.SignatureVerificationError, stripe.StripeError).
"""
import logging
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any
from urllib.parse import quote

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from dependencies import get_optional_user
from models import Booking, BookingStatus, BookingType, Destination, User

logger = logging.getLogger("travel.payments")

settings = get_settings()
router = APIRouter(tags=["payments"])

_bookings_router = APIRouter(prefix="/payments", tags=["payments"])
_webhook_router = APIRouter(prefix="/webhooks", tags=["payments-webhooks"])


class CheckoutRequest(BaseModel):
    tenant_id: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    destination_id: uuid.UUID
    email: EmailStr
    travelers: int = Field(default=1, ge=1, le=20)
    start_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: str | None = Field(default=None, max_length=2000)


class CheckoutResponse(BaseModel):
    url: str
    session_id: str
    booking_id: str
    amount: float
    currency: str


def _init_stripe() -> None:
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payments are not configured on this server.",
        )
    stripe.api_key = settings.stripe_secret_key


@_bookings_router.post(
    "/create-checkout-session", response_model=CheckoutResponse
)
async def create_checkout_session(
    payload: CheckoutRequest,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a Stripe Checkout Session for a destination booking.

    Optional auth: guests can pay (the booking form is public), but when a
    valid JWT is attached the booking links to that account.
    """
    _init_stripe()

    # Authenticated users may only book within their own tenant.
    if user is not None and user.tenant_id != payload.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only book within your own tenant.",
        )

    # ---- Server-side price lookup: NEVER trust client-sent amounts ----
    result = await db.execute(
        select(Destination).where(
            Destination.id == payload.destination_id,
            Destination.tenant_id == payload.tenant_id,
            Destination.is_active == True,  # noqa: E712
        )
    )
    destination = result.scalar_one_or_none()
    if destination is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found.",
        )
    if destination.price is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This destination is priced on request — contact your travel designer.",
        )

    # Convert date strings to Python date objects for asyncpg compatibility
    start_date_obj = (
        datetime.strptime(payload.start_date, "%Y-%m-%d").date()
        if payload.start_date
        else None
    )

    # Create the pending booking FIRST so the webhook can flip it to paid.
    booking = Booking(
        tenant_id=payload.tenant_id,
        user_id=user.id if user is not None else None,
        full_name=user.full_name if user is not None else payload.email.split("@")[0],
        email=str(payload.email),
        booking_type=BookingType.experience,
        status=BookingStatus.pending,
        destination=destination.title,
        start_date=start_date_obj,  # date object — asyncpg rejects raw strings
        travelers=payload.travelers,
        budget=destination.price,
        currency=destination.currency,
        notes=payload.notes,
    )
    db.add(booking)
    await db.flush()

    total_cents = int(
        (Decimal(str(destination.price)) * payload.travelers * 100).quantize(Decimal("1"))
    )
    if total_cents <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid computed total.",
        )

    base = settings.app_base_url.rstrip("/")
    success_url = f"{base}/{quote(payload.tenant_id)}/booking/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{base}/{quote(payload.tenant_id)}/booking/cancel?session_id={{CHECKOUT_SESSION_ID}}"

    try:
        # Async call — does not block the event loop while waiting on Stripe.
        session = await stripe.checkout.Session.create_async(
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=str(payload.email),
            client_reference_id=str(booking.id),
            metadata={
                "booking_id": str(booking.id),
                "tenant_id": payload.tenant_id,
                "destination_id": str(destination.id),
                "travelers": str(payload.travelers),
            },
            line_items=[
                {
                    "price_data": {
                        "currency": destination.currency.lower(),
                        "product_data": {
                            "name": f"{destination.title} — {payload.travelers} traveler(s)",
                        },
                        "unit_amount": int(
                            Decimal(str(destination.price)).quantize(Decimal("0.01")) * 100
                        ),
                    },
                    "quantity": payload.travelers,
                }
            ],
        )
    except stripe.StripeError as exc:
        logger.error("Stripe session creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment provider error — please try again.",
        )

    return CheckoutResponse(
        url=session.url,
        session_id=session.id,
        booking_id=str(booking.id),
        amount=total_cents / 100,
        currency=destination.currency,
    )


@_webhook_router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Stripe webhook receiver — RAW BODY required for signature verification.

    No Pydantic model on the body: the signature is computed over the exact
    bytes Stripe sent, so the body must be read raw and passed unmodified.
    """
    if not settings.stripe_webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook.")
        return {"received": False, "error": "Webhook not configured."}

    body = await request.body()  # raw bytes — do NOT re-encode
    if not body:
        return {"received": False, "error": "Empty payload."}

    try:
        event = stripe.Webhook.construct_event(
            payload=body,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except stripe.SignatureVerificationError:
        logger.warning("Stripe webhook signature verification FAILED.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature."
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Stripe webhook parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload."
        )

    if event["type"] == "checkout.session.completed":
        data_obj = event["data"]["object"]
        # stripe >= 8 returns StripeObject subclasses here, NOT plain dicts —
        # .get() would raise AttributeError. Convert defensively so both the
        # old (dict) and new (StripeObject) SDK shapes work.
        session_obj = data_obj.to_dict() if hasattr(data_obj, "to_dict") else data_obj
        metadata = session_obj.get("metadata") or {}
        # Metadata is primary; client_reference_id is the belt-and-braces fallback
        booking_id = metadata.get("booking_id") or session_obj.get("client_reference_id")
        if not booking_id:
            logger.warning(
                "checkout.session.completed without booking_id metadata: %s",
                session_obj.get("id"),
            )
            return {"received": True}

        # Only trust the event if payment actually succeeded.
        if session_obj.get("payment_status") != "paid":
            logger.info(
                "Ignoring checkout.session.completed with payment_status=%s (booking %s)",
                session_obj.get("payment_status"),
                booking_id,
            )
            return {"received": True}

        try:
            booking_uuid = uuid.UUID(booking_id)
        except ValueError:
            logger.warning("Webhook booking_id not a UUID: %s", booking_id)
            return {"received": True}

        result = await db.execute(
            select(Booking).where(Booking.id == booking_uuid)
        )
        booking = result.scalar_one_or_none()
        if booking is None:
            logger.warning("Webhook referenced unknown booking %s", booking_id)
            return {"received": True}

        if booking.status == BookingStatus.paid:
            logger.info("Booking %s already paid — idempotent skip.", booking_id)
            return {"received": True}

        booking.status = BookingStatus.paid
        await db.flush()
        logger.info("✅ Booking %s marked PAID via webhook.", booking_id)

    return {"received": True}


# Expose both sub-routers for main.py wiring
router.include_router(_bookings_router)
router.include_router(_webhook_router)
