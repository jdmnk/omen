import asyncio

from src.db.inserts import InsertsClient
from src.models.price_history import PriceHistory
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_prices import PolyClientPrices
from src.utils.logging_config import get_logger

logger = get_logger(__name__)

MIN_VOLUME = 10_000
MIN_LIQUIDITY = 10_000
BATCH_SIZE = 2
GLOBAL_MIN_TRADE_USD = 250


async def main() -> None:
    poly_client = PolyClient()
    poly_client_prices = PolyClientPrices()
    inserts = InsertsClient()

    # Find eligible markets (by DB query)
    markets = await poly_client.get_active_markets_by_events(count=5)
    logger.info("Eligible markets for price history fetch: %d", len(markets))

    markets_sorted_by_volume = sorted(markets, key=lambda x: x.volume1mo, reverse=True)
    price_histories: list[PriceHistory] = []
    for market in markets_sorted_by_volume:
        price_history = await poly_client_prices.get_price_history_for_token(market.token1)
        logger.info("Price history for market %s: %s", market.conditionId, price_history)
        price_histories.append(
            PriceHistory(clob_token_id=market.token1, points=price_history["history"])
        )

    inserted_price_histories = await inserts.insert_price_histories(price_histories)
    logger.info("Inserted/updated %d price histories", inserted_price_histories)


if __name__ == "__main__":
    asyncio.run(main())
