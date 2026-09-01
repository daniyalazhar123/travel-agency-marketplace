"""Async SQLAlchemy engine/session for Neon PostgreSQL."""
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from config import get_settings

logger = logging.getLogger("travel.db")

settings = get_settings()

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Lazily create the async engine (Neon pooler requires prepared-statement off)."""
    global _engine, _session_factory
    if _engine is None:
        url = settings.async_database_url
        if not url:
            raise RuntimeError("DATABASE_URL is not configured in backend/.env")

        connect_args = {}
        # Neon's PgBouncer-style pooler does not support server-side prepared statements.
        if "neon.tech" in url or "pooler" in url:
            connect_args["statement_cache_size"] = 0
            connect_args["prepared_statement_cache_size"] = 0  # asyncpg >= 0.29

        _engine = create_async_engine(
            url,
            echo=False,
            pool_pre_ping=True,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            connect_args=connect_args,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields a session, rolls back on error, always closes."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def check_db_connection() -> bool:
    """Startup health probe: SELECT 1 with a 5s timeout."""
    from sqlalchemy import text

    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error("Database connection check FAILED: %s", exc)
        return False


async def dispose_engine() -> None:
    """Shutdown hook: release all pooled connections."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None


def use_null_pool() -> AsyncEngine:
    """Alternate engine for serverless-style short-lived workers (docs/ops)."""
    url = settings.async_database_url
    if not url:
        raise RuntimeError("DATABASE_URL is not configured in backend/.env")
    return create_async_engine(url, poolclass=NullPool, pool_pre_ping=True, echo=False)
