from __future__ import annotations

from typing import Any, TypedDict

import httpx

from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_prices import PolyClientPrices, PriceHistoryPoint
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class UserPnlAndTradesResponse(TypedDict):
    start_ts: int
    end_ts: int
    pnl_points: list[PriceHistoryPoint]
    trades: list[dict[str, Any]]


async def fetch_user_pnl_and_trades_basic(
    user_address: str,
    *,
    interval: str = "1m",
    max_trades: int = 5000,
) -> UserPnlAndTradesResponse:
    """
    Fetch 1) user's PnL time series for given interval and 2) a bounded set of user trades.
    Returns basic data needed for subsequent attribution steps.
    """
    prices_client = PolyClientPrices()
    pnl_points = await prices_client.get_user_pnl_points(user_address, interval=interval)
    if not pnl_points:
        return {
            "start_ts": 0,
            "end_ts": 0,
            "pnl_points": [],
            "trades": [],
        }

    start_ts = pnl_points[0]["t"]
    end_ts = pnl_points[-1]["t"]

    def _compute_dynamic_min_amount(points: list[PriceHistoryPoint]) -> float:
        if not points:
            return 10.0
        pnl_values = [float(p["p"]) for p in points]
        pnl_range = max(pnl_values) - min(pnl_values)
        latest_abs = abs(pnl_values[-1])
        avg_abs = sum(abs(v) for v in pnl_values) / max(1, len(pnl_values))
        scale = max(pnl_range * 0.01, latest_abs * 0.02, avg_abs * 0.01)
        return float(min(2000.0, max(10.0, scale)))

    min_trade_amount = _compute_dynamic_min_amount(pnl_points)
    logger.info(
        "Dynamic trade min_amount=%s for user=%s interval=%s",
        min_trade_amount,
        user_address,
        interval,
    )

    # Fetch trades filtered by user; leave markets unspecified to include all
    poly_client = PolyClient()
    try:
        raw_trades = await poly_client.get_user_activity_trades(
            user_address,
            min_amount=min_trade_amount,
            count=max_trades,
        )
    except httpx.ReadTimeout:
        logger.warning(
            "Timeout fetching activity trades for user=%s interval=%s; continuing without trades",
            user_address,
            interval,
        )
        raw_trades = []
    except httpx.HTTPError as exc:
        logger.error(
            "HTTP error fetching activity trades for user=%s interval=%s: %s",
            user_address,
            interval,
            exc,
        )
        raw_trades = []

    # Filter to PnL window (defensive if API returns out-of-window)
    trades_window = [t for t in raw_trades if start_ts <= t.timestamp <= end_ts]

    # Convert to dicts for a simple payload downstream; consumers can map into schemas as needed
    trades_payload: list[dict[str, Any]] = [t.model_dump() for t in trades_window]

    return {
        "start_ts": start_ts,
        "end_ts": end_ts,
        "pnl_points": pnl_points,
        "trades": trades_payload,
    }
