import asyncio

from src.db.database_client import DatabaseClient
from src.polymarket.poly_client import PolyClient
from src.utils.logging_config import get_logger


logger = get_logger(__name__)


async def main() -> None:
    poly_client = PolyClient()
    db_client = DatabaseClient()

    MIN_VOLUME = 100_000
    MIN_LIQUIDITY = 10_000
    MIN_TRADE_USD = 1_000
    BATCH_SIZE = 4

    # Find eligible markets (by DB query)
    condition_ids = await db_client.get_markets_by_volume_and_liquidity(
        min_volume=MIN_VOLUME, min_liquidity=MIN_LIQUIDITY
    )
    logger.info("Eligible markets for trades fetch: %d", len(condition_ids))

    total_markets_processed = 0
    total_trades_fetched = 0
    total_trades_inserted = 0

    for i in range(0, len(condition_ids), BATCH_SIZE):
        batch_ids = condition_ids[i : i + BATCH_SIZE]

        # Fetch trades for this batch
        trades_batch = await poly_client.get_market_trades(batch_ids, min_amount=MIN_TRADE_USD)
        fetched_count = len(trades_batch)
        total_trades_fetched += fetched_count

        # Upsert trades for this batch immediately (save-as-you-go)
        inserted = 0
        if fetched_count:
            inserted = await db_client.insert_trades([t.model_dump() for t in trades_batch])
            total_trades_inserted += inserted

        total_markets_processed += len(batch_ids)
        logger.info(
            "Processed markets: +%d (total %d) | fetched trades: +%d (total %d) | inserted: +%d (total %d)",
            len(batch_ids),
            total_markets_processed,
            fetched_count,
            total_trades_fetched,
            inserted,
            total_trades_inserted,
        )

    logger.info(
        "Done. Markets processed: %d, Trades fetched: %d, Trades inserted: %d",
        total_markets_processed,
        total_trades_fetched,
        total_trades_inserted,
    )


if __name__ == "__main__":
    asyncio.run(main())
