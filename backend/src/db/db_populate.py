import asyncio

from src.db.database_client import DatabaseClient
from src.polymarket.poly_client import PolyClient


async def main():
    poly_client = PolyClient()
    db_client = DatabaseClient()

    # Step 1: Fetch and insert all active markets
    active_markets = await poly_client.get_active_markets_by_events()
    inserted_count = await db_client.insert_markets(active_markets)
    print(f"Inserted {inserted_count} active markets")


if __name__ == "__main__":
    asyncio.run(main())
