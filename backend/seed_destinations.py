"""Seed the destinations table with starter content for the demo tenant.

Idempotent: skips any destination whose (tenant_id, title) already exists.

Run (from backend/): python seed_destinations.py
"""
import asyncio
import logging
from decimal import Decimal

from sqlalchemy import select

from database import dispose_engine, get_session_factory
from models import Destination

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("seed_destinations")

TENANT_ID = "demo"

SEED = [
    {
        "title": "Amalfi Coast",
        "description": "Cliffside villages cascading into azure Mediterranean waters — Italy's most enchanting coastline.",
        "price": Decimal("4500"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    },
    {
        "title": "Kyoto",
        "description": "Ancient temples and serene gardens in Japan's timeless cultural heart.",
        "price": Decimal("6200"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    },
    {
        "title": "Santorini",
        "description": "Iconic white architecture and legendary sunsets over the Aegean caldera.",
        "price": Decimal("3800"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80",
    },
    {
        "title": "Bora Bora",
        "description": "Overwater bungalows above crystal-clear lagoons — ultimate French Polynesian luxury.",
        "price": Decimal("8900"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80",
    },
    {
        "title": "Maldives",
        "description": "Pristine atolls with world-class marine life in an Indian Ocean sanctuary.",
        "price": Decimal("7200"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80",
    },
    {
        "title": "Marrakech",
        "description": "Vibrant souks and palatial riads in Morocco's Red City.",
        "price": Decimal("3200"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=1200&q=80",
    },
]


async def main() -> None:
    factory = get_session_factory()
    async with factory() as session:
        existing = await session.execute(
            select(Destination.title).where(Destination.tenant_id == TENANT_ID)
        )
        existing_titles = {row[0] for row in existing.fetchall()}

        added = 0
        for item in SEED:
            if item["title"] in existing_titles:
                logger.info("SKIP (exists): %s", item["title"])
                continue
            session.add(Destination(tenant_id=TENANT_ID, **item))
            added += 1
            logger.info("ADD  %s", item["title"])

        await session.commit()

        result = await session.execute(
            select(Destination).where(Destination.tenant_id == TENANT_ID).order_by(Destination.order)
        )
        rows = result.scalars().all()
        logger.info("✅ Seed complete — %d added, %d total for tenant '%s'", added, len(rows), TENANT_ID)
        for r in rows:
            price = f"{r.currency} {r.price:,.0f}" if r.price is not None else "n/a"
            logger.info("   - %s (%s)", r.title, price)

    await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
