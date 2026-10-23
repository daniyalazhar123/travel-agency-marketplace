"""Transactional email via Resend HTTP API (uses httpx — no new dependency).

Named mailer.py (NOT email.py) to avoid shadowing Python's stdlib `email` module.

Security: RESEND_API_KEY lives ONLY in backend/.env. Never exposed to any client.
Dev no-op: if RESEND_API_KEY is unset, emails are logged instead of sent.
"""
import logging
from email.utils import parseaddr

import httpx

from config import get_settings

logger = logging.getLogger("travel.email")

settings = get_settings()

RESEND_API_URL = "https://api.resend.com/emails"
TIMEOUT_SECONDS = 10.0


def is_valid_email(address: str) -> bool:
    """Basic RFC-style sanity check (not exhaustive; final arbiter is the DB + verification mail)."""
    if not address or len(address) > 320:
        return False
    _, parsed = parseaddr(address)
    if parsed != address or "@" not in parsed:
        return False
    local, _, domain = parsed.rpartition("@")
    return bool(local) and bool(domain) and "." in domain and not domain.startswith(".") and not domain.endswith(".")


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
    reply_to: str | None = None,
) -> tuple[bool, str]:
    """Send an email via Resend. Returns (success, message)."""
    if not is_valid_email(to):
        return False, f"Invalid recipient address: {to!r}"

    from_addr = settings.email_from
    if not from_addr:
        return False, "EMAIL_FROM is not configured in backend/.env"

    if not settings.resend_api_key:
        # Development no-op: never crash the app, but make it loud.
        logger.warning(
            "[DEV NO-OP] RESEND_API_KEY not set — email NOT sent. To: %s | Subject: %s",
            to,
            subject,
        )
        return False, "Email provider not configured (dev no-op)"

    payload: dict = {
        "from": from_addr,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text
    if reply_to:
        payload["reply_to"] = reply_to

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if response.status_code in (200, 201):
            email_id = response.json().get("id", "unknown-id")
            logger.info("Email sent to %s (id=%s)", to, email_id)
            return True, email_id
        logger.error("Resend error %s: %s", response.status_code, response.text[:500])
        return False, f"Provider error: {response.status_code}"
    except httpx.HTTPError as exc:
        logger.error("Email send failed (network): %s", exc)
        return False, "Network error while sending email"


def verification_email_html(user_name: str, verify_url: str, expires_minutes: int) -> str:
    return f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;
            border:1px solid #e2e8f0;border-radius:12px;">
  <h2 style="margin:0 0 12px;color:#0f172a;">Welcome, {user_name}!</h2>
  <p style="color:#334155;line-height:1.6;">
    Please confirm your email address to activate your account.
  </p>
  <p style="margin:28px 0;">
    <a href="{verify_url}"
       style="background:#d97706;color:#ffffff;text-decoration:none;padding:12px 24px;
              border-radius:8px;font-weight:600;display:inline-block;">
      Verify Email Address
    </a>
  </p>
  <p style="color:#64748b;font-size:13px;line-height:1.6;">
    This link expires in {expires_minutes} minutes.<br/>
    If you did not create an account, you can safely ignore this email.
  </p>
</div>"""


async def send_verification_email(
    to: str, user_name: str, verify_url: str, expires_minutes: int
) -> tuple[bool, str]:
    subject = "Verify your email address"
    html = verification_email_html(user_name, verify_url, expires_minutes)
    return await send_email(to, subject, html, text=f"Verify your email: {verify_url}")
