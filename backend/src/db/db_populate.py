import asyncio

from src.db.database_client import DatabaseClient
from src.polymarket.poly_client import PolyClient


async def main():
    poly_client = PolyClient()
    db_client = DatabaseClient()

    # Step 1: Fetch all active events (includes markets array per event)
    events = await poly_client.get_active_events()

    # Step 2: Upsert markets present in those events
    markets = [m for ev in events for m in (ev.get("markets", []) or [])]
    inserted_markets = await db_client.insert_markets(markets)
    print(f"Inserted/updated {inserted_markets} markets from events")

    # Step 3: Upsert events with raw payload
    inserted_events = await db_client.insert_events(events)
    print(f"Inserted/updated {inserted_events} events")

    # Step 4: Create/refresh links between events and markets
    upserted_links = await db_client.insert_event_markets(events)
    print(f"Inserted/updated {upserted_links} event->market links")


if __name__ == "__main__":
    asyncio.run(main())
