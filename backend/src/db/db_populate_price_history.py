import asyncio
import os
import time

from src.db.inserts import InsertsClient
from src.db.selects import SelectsClient
from src.models.price_history import PriceHistory
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_prices import PolyClientPrices
from src.utils.logging_config import get_logger, quiet_httpx_logging
from src.utils.notifications import notify_ops

logger = get_logger(__name__)
quiet_httpx_logging()


def _get_latest_price(points: list[dict]) -> float | None:
    """Extract the latest price from price history points."""
    if not points:
        return None
    # Points are sorted by timestamp, get the last one
    sorted_points = sorted(points, key=lambda p: p.get("t", 0))
    return float(sorted_points[-1].get("p", 0)) if sorted_points else None


def _market_fetch_timeout_seconds() -> float:
    try:
        return max(30.0, float(os.getenv("MARKETS_FETCH_TIMEOUT_SECONDS", "180")))
    except ValueError:
        return 180.0


async def refresh_price_histories() -> None:
    start_time = time.time()
    poly_client = PolyClient()
    poly_client_prices = PolyClientPrices()
    inserts = InsertsClient()
    selects = SelectsClient()

    # Find eligible markets (by DB query)
    inserted_markets = 0
    try:
        markets = await asyncio.wait_for(
            poly_client.get_active_markets_by_events(),
            timeout=_market_fetch_timeout_seconds(),
        )
        logger.info("Eligible markets for price history fetch: %d", len(markets))
        # Insert/update all markets in DB
        inserted_markets = await inserts.insert_markets(markets)
    except Exception as exc:
        logger.warning(
            "Failed to fetch markets from API, falling back to stored markets: %s",
            exc,
        )
        notify_ops(
            f":rotating_light: Market fetch failed for price history refresh "
            f"({exc.__class__.__name__}: {exc})"
        )
        markets = await selects.get_all_markets()
        logger.info("Using %d stored markets for price history fetch", len(markets))
    logger.info("Inserted/updated %d markets", inserted_markets)

    markets_sorted_by_volume = sorted(markets, key=lambda x: x.volume1mo, reverse=True)
    filtered_markets = [m for m in markets_sorted_by_volume if m.volume1mo > 1000]
    logger.info("Filtered markets for price history fetch: %d", len(filtered_markets))

    # Fetch existing price histories to calculate deltas
    token_ids = [m.token1 for m in filtered_markets]
    existing_histories = await selects.get_price_histories_by_token_ids(token_ids)
    logger.info("Found %d existing price histories for delta calculation", len(existing_histories))

    batch_size = 100  # Insert to DB every N markets to avoid losing progress on crash
    price_histories: list[PriceHistory] = []
    failed_fetches = 0
    total_inserted = 0
    total_markets = len(filtered_markets)

    for idx, market in enumerate(filtered_markets, start=1):
        try:
            price_history = await poly_client_prices.get_price_history_for_token(market.token1)
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
            points = price_history["history"]
            last_price = _get_latest_price(points)

            # Calculate delta from previous refresh
            previous = existing_histories.get(market.token1)
            previous_price = previous.last_price if previous else None
            price_delta = None
            if last_price is not None and previous_price is not None:
                price_delta = last_price - previous_price

            logger.info(
                "Fetched %d price history points for market %s (%d of %d) - price: %.4f, delta: %s",
                len(points),
                market.question[:40],
                idx,
                total_markets,
                last_price or 0,
                f"{price_delta:+.4f}" if price_delta is not None else "N/A",
            )
            price_histories.append(
                PriceHistory(
                    clob_token_id=market.token1,
                    points=points,
                    last_price=last_price,
                    price_delta=price_delta,
                )
            )

            # Insert batch to DB periodically to avoid losing progress on crash
            if len(price_histories) >= batch_size:
                inserted = await inserts.insert_price_histories(price_histories)
                total_inserted += inserted
                logger.info(
                    "Batch inserted %d price histories (total: %d)", inserted, total_inserted
                )
                price_histories = []

        finally:
            # 10req/s is max allowed by API, this should be safe if we assume requests take >30ms (and not much longer)
            await asyncio.sleep(0.07)

    # Insert any remaining price histories
    if price_histories:
        inserted = await inserts.insert_price_histories(price_histories)
        total_inserted += inserted

    logger.info("Inserted/updated %d price histories total", total_inserted)
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
            f":rotating_light: Price history population failed ({exc.__class__.__name__}: {exc})"
        )
        raise


if __name__ == "__main__":
    asyncio.run(main())
