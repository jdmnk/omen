import asyncio

from src.db.inserts import InsertsClient
from src.models.price_history import PriceHistory
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_prices import PolyClientPrices
from src.utils.logging_config import get_logger, quiet_httpx_logging

logger = get_logger(__name__)
quiet_httpx_logging()


async def main() -> None:
    poly_client = PolyClient()
    poly_client_prices = PolyClientPrices()
    inserts = InsertsClient()

    # Find eligible markets (by DB query)
    markets = await poly_client.get_active_markets_by_events()
    logger.info("Eligible markets for price history fetch: %d", len(markets))

    markets_sorted_by_volume = sorted(markets, key=lambda x: x.volume1mo, reverse=True)
    filtered_markets = [m for m in markets_sorted_by_volume if m.volume1mo > 1000]
    logger.info("Filtered markets for price history fetch: %d", len(filtered_markets))

    price_histories: list[PriceHistory] = []
    count = 0
    for market in filtered_markets:
        price_history = await poly_client_prices.get_price_history_for_token(market.token1)
        logger.info(
            "Fetched %d price history points for market %s (%d of %d)",
            len(price_history["history"]),
            market.question[:40],
            count,
            len(filtered_markets),
        )
        price_histories.append(
            PriceHistory(clob_token_id=market.token1, points=price_history["history"])
        )
        count += 1

        # 10req/s is max allowed by API, this should be safe if we assume requests take >30ms (and not much longer)
        await asyncio.sleep(0.07)

    inserted_price_histories = await inserts.insert_price_histories(price_histories)
    logger.info("Inserted/updated %d price histories", inserted_price_histories)


if __name__ == "__main__":
    asyncio.run(main())
