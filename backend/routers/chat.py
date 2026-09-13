"""RAG travel-concierge chat endpoint (Groq LLM + live catalog grounding).

- POST /chat: tenant-scoped question answering grounded in the tenant's
  LIVE destinations catalog (retrieval = Postgres ILIKE keyword scoring;
  no vector store yet — catalog sizes are small enough that lexical
  retrieval is accurate and dependency-free).

Security:
- GROQ_API_KEY never leaves the server; the browser talks only to this API.
- tenant_id is validated and the retrieval is hard-scoped to that tenant —
  a user of tenant A can never receive tenant B's catalog data.
- Conversation memory is capped (last 8 turns) and answers cite the
  destination names they were grounded in, never raw catalog rows.
- Rate-limit friendly: model call is short (max_tokens) and temperature is
  low to keep answers factual.
"""
import logging
from typing import Any, List

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models import Destination

logger = logging.getLogger("travel.chat")

settings = get_settings()
router = APIRouter(prefix="/chat", tags=["chat"])

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# Preference-ordered fallback chain — first available model wins. Runtime
# probing keeps this resilient if a model id is retired (as happened to
# llama-3.3-70b-versatile in 2026).
GROQ_MODEL_CHAIN = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound-mini",
]
MAX_HISTORY = 8  # turns kept for context
MAX_RETRIEVED = 5  # destinations injected into the prompt


class ChatMessage(BaseModel):
    role: str = Field(pattern=r"^(user|assistant)$")
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    tenant_id: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    message: str = Field(min_length=1, max_length=2000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=MAX_HISTORY)


class ChatResponse(BaseModel):
    reply: str
    grounded_in: List[str] = []  # destination titles used for the answer


def _build_context(dests: List[Destination]) -> str:
    """Render the retrieved catalog rows into a compact grounding block."""
    if not dests:
        return "No destinations are currently published in this agency's catalog."
    blocks = []
    for d in dests:
        price = f"{d.currency} {d.price:,.0f} per person" if d.price is not None else "price on request"
        desc = (d.description or "").strip()
        blocks.append(f"- {d.title} ({price}): {desc}")
    return "\n".join(blocks)


def _score(dest: Destination, query: str) -> int:
    """Cheap lexical relevance score: matched terms in title/description."""
    terms = [t for t in query.lower().split() if len(t) > 3]
    if not terms:
        return 0
    text = f"{dest.title} {dest.description or ''}".lower()
    return sum(1 for t in terms if t in text)


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Answer a travel question grounded in the tenant's live catalog."""
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI concierge is not configured on this server.",
        )

    # --- Retrieval: tenant-scoped, active rows only ---
    result = await db.execute(
        select(Destination).where(
            Destination.tenant_id == payload.tenant_id,
            Destination.is_active == True,  # noqa: E712
        )
    )
    rows = list(result.scalars().all())

    q = payload.message.lower()
    scored = sorted(rows, key=lambda d: _score(d, q), reverse=True)
    retrieved = scored[:MAX_RETRIEVED]

    system_prompt = (
        "You are the AI travel concierge for a luxury travel agency website. "
        "Answer ONLY from the catalog context below. If the answer is not in "
        "the context, say so briefly and suggest the 'Plan a Journey' page for "
        "a custom proposal. Never invent destinations, prices, or availability. "
        "Keep answers under 120 words, warm and concise. Do not discuss payments "
        "or ask for card details — direct users to the destination page's "
        "'Book & Pay' button instead.\n\n"
        f"CATALOG:\n{_build_context(retrieved)}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend({"role": m.role, "content": m.content} for m in payload.history)
    messages.append({"role": "user", "content": payload.message})

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = None
            last_error = ""
            for model in GROQ_MODEL_CHAIN:
                res = await client.post(
                    GROQ_URL,
                    headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.3,
                        "max_tokens": 400,
                    },
                )
                if res.status_code == 200:
                    break
                last_error = f"{res.status_code}: {res.text[:200]}"
                logger.warning("Groq model %s unavailable — trying next. %s", model, last_error)
            else:
                # All models in the chain failed
                logger.error("All Groq models failed. Last: %s", last_error)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="The AI concierge hit an error — please try again shortly.",
                )
    except httpx.HTTPError as exc:
        logger.error("Groq request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI concierge is unreachable — please try again shortly.",
        )

    if res.status_code != 200:
        logger.error("Groq API error %s: %s", res.status_code, res.text[:300])
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI concierge hit an error — please try again shortly.",
        )

    data = res.json()
    reply = ""
    try:
        reply = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError):
        logger.error("Unexpected Groq response shape: %s", str(data)[:300])
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI concierge returned an unexpected response.",
        )

    return ChatResponse(
        reply=reply or "Could you rephrase that?",
        grounded_in=[d.title for d in retrieved],
    )
