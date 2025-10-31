import asyncio

from src.db.inserts import InsertsClient
from src.db.selects import SelectsClient
from src.models.market import MarketSchema
from src.polymarket.poly_client import PolyClient
from src.utils.logging_config import get_logger

logger = get_logger(__name__)

MIN_VOLUME = 20_000
MIN_LIQUIDITY = 10_000
BATCH_SIZE = 4
GLOBAL_MIN_TRADE_USD = 1000

ABS_MIN = 250  # never flag below this
LIQ_PCT = 0.08  # 8 % of total liquidity
VOL24_PCT = 0.03  # 3 % of 24 h volume


def min_alert_size(market: MarketSchema) -> int:
    """USD notional that a single trade must exceed
    before we run heavy insider checks."""
    liq_cut = LIQ_PCT * market.liquidity
    vol_cut = VOL24_PCT * market.volume24hr
    return int(max(ABS_MIN, liq_cut, vol_cut))


async def main() -> None:
    poly_client = PolyClient()
    inserts = InsertsClient()
    selects = SelectsClient()

    # Find eligible markets (by DB query)
    markets = await selects.get_markets_by_volume_and_liquidity(
        min_volume=MIN_VOLUME, min_liquidity=MIN_LIQUIDITY
    )
    logger.info("Eligible markets for trades fetch: %d", len(markets))

    total_markets_processed = 0
    total_trades_fetched = 0
    total_trades_inserted = 0

    for i in range(0, len(markets), BATCH_SIZE):
        batch_markets = markets[i : i + BATCH_SIZE]

        # Fetch trades for this batch
        trades_batch = await poly_client.get_market_trades(
            [m.condition_id for m in batch_markets], min_amount=GLOBAL_MIN_TRADE_USD
        )
        fetched_count = len(trades_batch)
        total_trades_fetched += fetched_count

        # Upsert trades for this batch immediately (save-as-you-go)
        inserted = 0
        if fetched_count:
            # filter trades by min alert size
            # trades_batch = [t for t in trades_batch if (t.size * t.price) >= min_alert_size(batch_markets[0])]

            inserted = await inserts.insert_trades(trades_batch)
            total_trades_inserted += inserted

        total_markets_processed += len(batch_markets)
        logger.info(
            "Processed markets: +%d (total %d) | fetched trades: +%d (total %d) | inserted: +%d (total %d)",
            len(batch_markets),
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
