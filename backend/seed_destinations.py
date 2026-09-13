"""Seed the destinations table with a curated portfolio for the "demo" tenant.

Idempotent by default: skips any destination whose (tenant_id, title)
already exists, so re-running never duplicates rows.

Use --reset to first delete ALL existing "demo"-tenant destinations and
re-insert the curated set (clean slate for a fresh demo state).

Run (from backend/):
    venv\\Scripts\\python.exe seed_destinations.py            # add missing only
    venv\\Scripts\\python.exe seed_destinations.py --reset    # wipe + reseed demo
"""
import argparse
import asyncio
import logging
from decimal import Decimal

from sqlalchemy import delete, select

from database import dispose_engine, get_session_factory
from models import Destination

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("seed_destinations")

TENANT_ID = "demo"

# Curated portfolio — all image URLs verified live (HTTP 200).
SEED: list[dict] = [
    {
        "title": "Maldives Luxury Escape",
        "description": (
            "Wake to turquoise lagoons in an overwater villa suspended above a private "
            "house reef. Days unfold between coral gardens, dolphin cruises, and candlelit "
            "dinners on the sand. This is barefoot luxury at its most serene."
        ),
        "price": Decimal("8400"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
        "order": 1,
    },
    {
        "title": "Parisian Romance",
        "description": (
            "Paris rewards the slow traveler: sunrise walks along the Seine, croissants in "
            "hidden courtyards, and masterpieces waiting in the Louvre's golden halls. "
            "Evenings end with a glass of Bordeaux as the Eiffel Tower shimmers above the rooftops."
        ),
        "price": Decimal("2900"),
        "currency": "EUR",
        "image_url": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
        "order": 2,
    },
    {
        "title": "Tokyo Tech & Culture",
        "description": (
            "Tokyo layers neon-lit futurism over centuries of ritual — robot restaurants on "
            "one block, silent shrines on the next. Cross the world's busiest crossing at "
            "Shibuya, then find stillness in the Meiji forest. Every district feels like a different city."
        ),
        "price": Decimal("4800"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80",
        "order": 3,
    },
    {
        "title": "Swiss Alps Adventure",
        "description": (
            "Cogwheel trains climb through wildflower meadows into a world of granite peaks "
            "and glacier-blue lakes. Hike the Eiger Trail in summer or carve powder above the "
            "clouds in winter. Precision, chocolate, and jaw-dropping views at every turn."
        ),
        "price": Decimal("3600"),
        "currency": "EUR",
        "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
        "order": 4,
    },
    {
        "title": "Bali Tropical Retreat",
        "description": (
            "Rice-terrace mornings, temple ceremonies at dusk, and surf sessions in between — "
            "Bali moves at its own rhythm. Restore in Ubud's jungle spas and cliffside infinity "
            "pools overlooking the Indian Ocean. The Island of the Gods earns its name daily."
        ),
        "price": Decimal("2600"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
        "order": 5,
    },
    {
        "title": "Dubai Desert Safari",
        "description": (
            "Dune-bash across golden sands by 4x4, then watch the sun sink behind an endless "
            "sea of red. Evenings bring Bedouin camps, falconry displays, and dining beneath a "
            "canopy of desert stars. Contrast it all with the world's tallest skyline."
        ),
        "price": Decimal("3200"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
        "order": 6,
    },
    {
        "title": "Santorini Aegean Dream",
        "description": (
            "Whitewashed villages cling to volcanic cliffs a thousand feet above the caldera. "
            "Sail to hidden hot springs, sip Assyrtiko at sunset wineries, and watch Oia's "
            "rooftops glow pink at dusk. The most photographed sunset on Earth, and it never repeats."
        ),
        "price": Decimal("2500"),
        "currency": "EUR",
        "image_url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
        "order": 7,
    },
    {
        "title": "Bora Bora Overwater Sanctuary",
        "description": (
            "A turquoise lagoon ringed by coral and crowned by Mount Otemanu — Bora Bora is "
            "the South Pacific's crown jewel. Swim with rays at dawn, kayak between motus, "
            "and step from your villa deck straight into the sea."
        ),
        "price": Decimal("9200"),
        "currency": "USD",
        "image_url": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
        "order": 8,
    },
]


async def seed(reset: bool) -> None:
    factory = get_session_factory()
    async with factory() as session:
        # --reset: wipe the demo tenant first (clean demo state)
        if reset:
            result = await session.execute(
                delete(Destination).where(Destination.tenant_id == TENANT_ID)
            )
            await session.flush()  # autoflush=False — make the delete visible below
            logger.info("RESET: removed %d existing row(s) for tenant '%s'", result.rowcount, TENANT_ID)

        # Idempotency check: which titles already exist for this tenant?
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

        # Final report: what does the tenant now have?
        rows_result = await session.execute(
            select(Destination)
            .where(Destination.tenant_id == TENANT_ID)
            .order_by(Destination.order, Destination.created_at)
        )
        rows = rows_result.scalars().all()
        logger.info(
            "✅ Seed complete — %d added, %d total for tenant '%s'",
            added,
            len(rows),
            TENANT_ID,
        )
        for r in rows:
            price = f"{r.currency} {r.price:,.0f}" if r.price is not None else "n/a"
            logger.info("   [%s] %s — %s", r.order, r.title, price)

    await dispose_engine()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed curated demo destinations (idempotent).",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete ALL existing destinations for the demo tenant first, "
        "then insert the curated set (clean demo state).",
    )
    args = parser.parse_args()

    try:
        asyncio.run(seed(reset=args.reset))
    except Exception as exc:  # noqa: BLE001
        logger.error("❌ Seed failed: %s", exc)
        raise SystemExit(1)

    logger.info("🔌 Done.")


if __name__ == "__main__":
    main()
