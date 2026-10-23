"""FastAPI application entrypoint.

Run (from backend/):
    venv/Scripts/activate  (Windows) or source venv/bin/activate (Unix)
    uvicorn main:app --reload --port 8000
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from database import check_db_connection, dispose_engine
from mailer import send_email as _noop_check  # noqa: F401 — import sanity at startup
from routers.auth import router as auth_router
from routers.chat import router as chat_router
from routers.destinations import router as destinations_router
from routers.payments import router as payments_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("travel.main")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup verification: fail fast if DB or Groq is misconfigured."""
    # --- Database check ---
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("✅ Database connection OK")
    else:
        logger.error(
            "❌ Database connection FAILED — check DATABASE_URL in backend/.env "
            "(Neon URL must include ?sslmode=require)"
        )
        if settings.is_production:
            raise RuntimeError("Database is required in production")

    # --- Resend email check ---
    if settings.resend_api_key:
        logger.info("✅ RESEND_API_KEY configured — email verification active")
    else:
        logger.warning("⚠️  RESEND_API_KEY not set — verification emails are dev no-ops")

    # --- Groq API key presence check (no network call, just config sanity) ---
    if settings.groq_api_key:
        logger.info("✅ GROQ_API_KEY configured (len=%d)", len(settings.groq_api_key))
    else:
        logger.warning("⚠️  GROQ_API_KEY not set — AI features disabled until configured")

    # --- Stripe check ---
    if settings.stripe_secret_key:
        logger.info("✅ STRIPE_SECRET_KEY configured — Stripe checkout active")
        if not settings.stripe_webhook_secret:
            logger.warning("⚠️  STRIPE_WEBHOOK_SECRET not set — webhooks cannot be verified (dev only)")
    else:
        logger.warning("⚠️  STRIPE_SECRET_KEY not set — payment endpoints return 503")

    if settings.is_production and settings.jwt_secret == "change-me-in-production":
        logger.error("❌ JWT_SECRET is still the default — refusing to run in production")
        raise RuntimeError("Set a strong JWT_SECRET before running in production")

    logger.info("🚀 %s environment startup complete", settings.environment)
    yield
    # --- Shutdown ---
    await dispose_engine()
    logger.info("🔌 Engine disposed, shutdown complete")


app = FastAPI(
    title="Travel Agency Marketplace API",
    version="1.0.0",
    description="Production API for the multi-tenant travel agency platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)


app.include_router(auth_router)
app.include_router(destinations_router)
app.include_router(payments_router)
app.include_router(chat_router)


@app.get("/health", tags=["system"])
async def health():
    """Liveness probe (no auth)."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": "1.0.0",
    }


@app.get("/health/ready", tags=["system"])
async def readiness():
    """Readiness probe: verifies DB connectivity."""
    db_ok = await check_db_connection()
    if not db_ok:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "down"},
        )
    return {"status": "healthy", "database": "up"}


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
