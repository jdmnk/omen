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

    # Step 5: Use DB query to find eligible markets by thresholds
    eligible_condition_ids = await db_client.get_markets_by_volume_and_liquidity(
        min_volume=100_000, min_liquidity=10_000
    )
    print(f"Eligible markets for trades fetch: {len(eligible_condition_ids)}")

    # Chunk IDs to respect URL length and rate limits
    BATCH_SIZE = 2
    MIN_TRADE_USD = 1000
    all_trades = []
    for i in range(0, len(eligible_condition_ids), BATCH_SIZE):
        batch_ids = eligible_condition_ids[i : i + BATCH_SIZE]
        trades_batch = await poly_client.get_market_trades(batch_ids, min_amount=MIN_TRADE_USD)
        all_trades.extend([t.model_dump() for t in trades_batch])

    inserted_trades = await db_client.insert_trades(all_trades)
    print(f"Inserted/updated {inserted_trades} trades")


if __name__ == "__main__":
    asyncio.run(main())
