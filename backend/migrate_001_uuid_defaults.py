"""One-time migration: add server-side DEFAULT gen_random_uuid() to id columns.

Why: backend/models.py defined id with a PYTHON-side default (default=uuid4).
That only works via the ORM — raw SQL inserts (e.g. the Next.js API route)
got NULL and violated the NOT NULL constraint. This script fixes the live
tables AND is idempotent.

Run (from backend/): python migrate_001_uuid_defaults.py
"""
import asyncio
import logging
import sys

from sqlalchemy import text

from config import get_settings
from database import dispose_engine, get_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("migrate_001")

# table -> pk column name
TARGETS = {
    "bookings": "id",
    "users": "id",
    "leads": "id",
}


async def column_has_default(conn, table: str, column: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT column_default FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    )
    row = result.fetchone()
    return row is not None and row[0] is not None


async def table_exists(conn, table: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name = :t"
        ),
        {"t": table},
    )
    return result.fetchone() is not None


async def main() -> None:
    settings = get_settings()
    if not settings.database_url:
        logger.error("DATABASE_URL is empty in backend/.env")
        raise SystemExit(1)

    engine = get_engine()
    async with engine.begin() as conn:
        # pgcrypto provides gen_random_uuid() (also on PG13+ natively, but be explicit)
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))

        for table, column in TARGETS.items():
            if not await table_exists(conn, table):
                logger.warning("Table %s does not exist yet — skipping (run create_tables.py first)", table)
                continue
            if await column_has_default(conn, table, column):
                logger.info("SKIP %s.%s — default already present", table, column)
                continue
            await conn.execute(
                text(f'ALTER TABLE "{table}" ALTER COLUMN "{column}" SET DEFAULT gen_random_uuid()')
            )
            # Backfill any NULL ids (defensive; should be none)
            await conn.execute(
                text(
                    f'UPDATE "{table}" SET "{column}" = gen_random_uuid() '
                    f'WHERE "{column}" IS NULL'
                )
            )
            logger.info("OK  %s.%s -> DEFAULT gen_random_uuid()", table, column)

        # --- Column defaults that must exist server-side for raw SQL inserts ---
        # bookings.currency (models.py had ORM-side default only)
        await conn.execute(
            text("ALTER TABLE bookings ALTER COLUMN currency SET DEFAULT 'USD'")
        )
        # enums/text columns with ORM-side defaults used by raw inserts
        await conn.execute(
            text("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending'")
        )
        await conn.execute(
            text("ALTER TABLE leads ALTER COLUMN source SET DEFAULT 'newsletter'")
        )
        logger.info("OK  currency/status/source server-side defaults set")

    logger.info("✅ Migration 001 complete.")
    await dispose_engine()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # noqa: BLE001
        logger.error("Migration failed: %s", exc)
        sys.exit(1)
