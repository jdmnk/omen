import asyncio
import time

from src.db.inserts import InsertsClient
from src.models.price_history import PriceHistory
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_prices import PolyClientPrices
from src.utils.logging_config import get_logger, quiet_httpx_logging
from src.utils.notifications import notify_ops

logger = get_logger(__name__)
quiet_httpx_logging()


async def refresh_price_histories() -> None:
    start_time = time.time()
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
    failed_fetches = 0
    total_markets = len(filtered_markets)

    for idx, market in enumerate(filtered_markets, start=1):
        try:
            price_history = await poly_client_prices.get_price_history_for_token(
                market.token1
            )
        except Exception as exc:
            failed_fetches += 1
            logger.warning(
                "Failed to fetch price history for market %s (%s): %s",
                market.token1,
                market.question[:40],
                exc,
            )
            notify_ops(
                f":rotating_light: Price history fetch failed for "
                f"{market.question[:60]} ({market.token1}) "
                f"({exc.__class__.__name__}: {exc})"
            )
        else:
            logger.info(
                "Fetched %d price history points for market %s (%d of %d)",
                len(price_history["history"]),
                market.question[:40],
                idx,
                total_markets,
            )
            price_histories.append(
                PriceHistory(clob_token_id=market.token1, points=price_history["history"])
            )
        finally:
            # 10req/s is max allowed by API, this should be safe if we assume requests take >30ms (and not much longer)
            await asyncio.sleep(0.07)

    inserted_price_histories = await inserts.insert_price_histories(price_histories)
    logger.info("Inserted/updated %d price histories", inserted_price_histories)
    if failed_fetches:
        logger.info("Price history fetch failures: %d", failed_fetches)

    duration = time.time() - start_time
    logger.info("Total execution time: %.2f seconds", duration)


async def main() -> None:
    try:
        await refresh_price_histories()
    except Exception as exc:
        logger.exception("Price history population failed")
        notify_ops(
            f":rotating_light: Price history population failed "
            f"({exc.__class__.__name__}: {exc})"
        )
        raise


if __name__ == "__main__":
    asyncio.run(main())
