import asyncio

from src.db.inserts import InsertsClient
from src.models.event import EventSchema, parse_event_from_api
from src.models.market import MarketSchema, parse_market_from_api
from src.polymarket.poly_client import PolyClient
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


async def main() -> None:
    poly_client = PolyClient()
    inserts = InsertsClient()

    # Fetch all active events (includes markets per event)
    events = await poly_client.get_active_events()
    logger.info("Fetched %d events from API", len(events))

    # Upsert markets present in those events (parse to schemas first)
    market_dicts = [m for ev in events for m in (ev.get("markets", []) or [])]
    market_schemas: list[MarketSchema] = []
    for md in market_dicts:
        pm = parse_market_from_api(md)
        if pm:
            market_schemas.append(pm)
    inserted_markets = await inserts.insert_markets(market_schemas)
    logger.info("Inserted/updated %d markets from events", inserted_markets)

    # Upsert events with raw payload
    event_schemas: list[EventSchema] = []
    for ev in events:
        pe = parse_event_from_api(ev)
        if pe:
            event_schemas.append(pe)
    inserted_events = await inserts.insert_events(event_schemas)
    logger.info("Inserted/updated %d events", inserted_events)

    # Create/refresh links between events and markets
    upserted_links = await inserts.insert_event_markets_from_events(event_schemas)
    logger.info("Inserted/updated %d event->market links", upserted_links)


if __name__ == "__main__":
    asyncio.run(main())
