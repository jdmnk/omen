import asyncio

from src.db.database_client import DatabaseClient
from src.polymarket.poly_client import PolyClient
from src.utils.logging_config import get_logger


logger = get_logger(__name__)


async def main() -> None:
    poly_client = PolyClient()
    db_client = DatabaseClient()

    # Fetch all active events (includes markets per event)
    events = await poly_client.get_active_events()
    logger.info("Fetched %d events from API", len(events))

    # Upsert markets present in those events
    markets = [m for ev in events for m in (ev.get("markets", []) or [])]
    inserted_markets = await db_client.insert_markets(markets)
    logger.info("Inserted/updated %d markets from events", inserted_markets)

    # Upsert events with raw payload
    inserted_events = await db_client.insert_events(events)
    logger.info("Inserted/updated %d events", inserted_events)

    # Create/refresh links between events and markets
    upserted_links = await db_client.insert_event_markets(events)
    logger.info("Inserted/updated %d event->market links", upserted_links)


if __name__ == "__main__":
    asyncio.run(main())
