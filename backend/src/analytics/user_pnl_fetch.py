from __future__ import annotations

from typing import Any, TypedDict

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

    # Fetch trades filtered by user; leave markets unspecified to include all
    poly_client = PolyClient()
    raw_trades = await poly_client.get_market_trades(
        None,  # all markets
        min_amount=1,
        count=max_trades,
        user=user_address,
    )

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


