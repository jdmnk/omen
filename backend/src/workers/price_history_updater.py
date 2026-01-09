from __future__ import annotations

import asyncio
import os
import time

from src.db.db_populate_price_history import refresh_price_histories
from src.utils.logging_config import get_logger, quiet_httpx_logging

logger = get_logger(__name__)
quiet_httpx_logging()


def _refresh_interval_seconds() -> int:
    try:
        return max(60, int(os.getenv("PRICE_HISTORY_REFRESH_SECONDS", "600")))
    except ValueError:
        return 600


async def _run_cycle() -> None:
    logger.info("Starting price history refresh cycle")
    await refresh_price_histories()
    logger.info("Completed price history refresh cycle")


async def worker() -> None:
    interval = _refresh_interval_seconds()
    logger.info("Price history worker running every %s seconds", interval)
    while True:
        started = time.perf_counter()
        try:
            await _run_cycle()
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Price history refresh failed: %s", exc, exc_info=True)
        elapsed = time.perf_counter() - started
        wait_seconds = max(30.0, interval - elapsed)
        logger.info("Sleeping %.0f seconds before next refresh", wait_seconds)
        await asyncio.sleep(wait_seconds)


if __name__ == "__main__":
    asyncio.run(worker())
