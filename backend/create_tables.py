"""One-time schema initializer: creates all tables in the Neon DB.

Run ONCE (from backend/, with venv activated):
    python create_tables.py

Safe to re-run: uses checkfirst=True (skips existing tables).
"""
import asyncio
import logging

from sqlalchemy import text

from config import get_settings
from database import get_engine, dispose_engine
from models import Base, Booking, Lead, User  # noqa: F401 — ensure models are registered

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("create_tables")


async def main() -> None:
    settings = get_settings()
    if not settings.database_url:
        logger.error("DATABASE_URL is empty in backend/.env — nothing to do.")
        raise SystemExit(1)

    engine = get_engine()

    # --- Enable required extensions (idempotent) ---
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))

    # --- Create tables (checkfirst = skip existing) ---
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)

    # --- Report ---
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        )
        tables = [row[0] for row in result.fetchall()]

    logger.info("Tables now in DB: %s", sorted(tables))
    required = {"users", "bookings", "leads"}
    missing = required - set(tables)
    if missing:
        logger.error("MISSING TABLES: %s", missing)
        raise SystemExit(1)

    logger.info("✅ Schema initialization complete.")
    await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
