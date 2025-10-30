import asyncio

from src.db.inserts import InsertsClient
from src.db.selects import SelectsClient
from src.polymarket.poly_client import PolyClient
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


async def main() -> None:
    poly_client = PolyClient()
    inserts = InsertsClient()
    selects = SelectsClient()

    # Gather distinct wallets from trades
    wallets = await selects.get_distinct_trade_wallets()
    logger.info("Found %d unique wallets from trades", len(wallets))

    total_wallets = 0
    total_positions_fetched = 0
    total_positions_inserted = 0

    for wallet in wallets:
        positions = await poly_client.get_user_positions_top(wallet, count=100)
        fetched = len(positions)
        total_positions_fetched += fetched

        inserted = 0
        if fetched:
            inserted = await inserts.insert_user_positions(positions)
            total_positions_inserted += inserted

        total_wallets += 1
        logger.info(
            "Processed wallet %d/%d | positions fetched: %d | inserted: %d",
            total_wallets,
            len(wallets),
            fetched,
            inserted,
        )

        await asyncio.sleep(0.2)

    logger.info(
        "Done. Wallets processed: %d, Positions fetched: %d, Positions inserted: %d",
        total_wallets,
        total_positions_fetched,
        total_positions_inserted,
    )


if __name__ == "__main__":
    asyncio.run(main())
