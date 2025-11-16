from __future__ import annotations

from typing import Any, Literal, TypedDict

from src.analytics.user_pnl_fetch import fetch_user_pnl_and_trades_basic
from src.models.trade import Trade
from src.polymarket.poly_client_prices import PriceHistoryPoint
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class PnlMarker(TypedDict, total=False):
    t: int
    kind: Literal["swing", "trade_cluster"]
    # swing fields
    delta: float
    direction: Literal["up", "down"]
    severity: Literal["large", "extreme"]
    # trade cluster fields
    tradesCount: int
    notional: float


def _quantile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    v = sorted(values)
    pos = q * (len(v) - 1)
    lower = int(pos)
    upper = min(lower + 1, len(v) - 1)
    if upper == lower:
        return float(v[lower])
    weight = pos - lower
    return float(v[lower] * (1 - weight) + v[upper] * weight)


def _median(values: list[int]) -> float:
    return _quantile([float(x) for x in values], 0.5)


def _compute_swing_markers(points: list[PriceHistoryPoint]) -> list[PnlMarker]:
    if len(points) < 2:
        return []
    deltas: list[float] = []
    times: list[int] = []
    for i in range(1, len(points)):
        dp = float(points[i]["p"]) - float(points[i - 1]["p"])
        deltas.append(dp)
        times.append(int(points[i]["t"]))

    abs_deltas = [abs(d) for d in deltas]
    q90 = _quantile(abs_deltas, 0.90)
    q98 = _quantile(abs_deltas, 0.98)

    candidates: list[PnlMarker] = []
    for i, dp in enumerate(deltas):
        abs_dp = abs(dp)
        if abs_dp < q90:
            continue
        severity: Literal["large", "extreme"] = "extreme" if abs_dp >= q98 else "large"
        candidates.append(
            {
                "t": times[i],
                "kind": "swing",
                "delta": dp,
                "direction": "up" if dp >= 0 else "down",
                "severity": severity,
            }
        )

    # Cap the number of markers to avoid clutter: keep the largest deltas
    max_markers = min(20, max(5, len(points) // 20))
    candidates.sort(key=lambda m: abs(float(m.get("delta", 0))), reverse=True)
    return candidates[:max_markers]


def _aggregate_trade_clusters(
    trades: list[Trade],
    grid_times: list[int],
) -> list[PnlMarker]:
    if not trades or len(grid_times) < 2:
        return []

    # Determine grid step (seconds)
    dts = [grid_times[i] - grid_times[i - 1] for i in range(1, len(grid_times))]
    step = max(1, int(_median(dts)))
    half = step // 2

    # Aggregate trades into nearest grid time (within half step)
    agg: dict[int, dict[str, float | int]] = {t: {"count": 0, "notional": 0.0} for t in grid_times}
    for tr in trades:
        tt = int(tr.timestamp)
        # Binary search could be used; linear is fine given bounded trades
        # Snap to closest grid time within half step
        # Find insertion index
        # Simple two-pointer walk is not necessary; use manual nearest check
        # Since we don't expect huge arrays here, linear scan is acceptable
        nearest_t = None
        min_diff = 1_000_000_000
        for gt in grid_times:
            diff = abs(gt - tt)
            if diff < min_diff:
                min_diff = diff
                nearest_t = gt
            elif gt > tt and diff > min_diff:
                # Early break after passing the closest point
                break
        if nearest_t is None or min_diff > half:
            continue
        # Approximate notional
        notional = float(tr.size) * float(tr.price)
        agg[nearest_t]["count"] = int(agg[nearest_t]["count"]) + 1
        agg[nearest_t]["notional"] = float(agg[nearest_t]["notional"]) + notional

    counts = [int(v["count"]) for v in agg.values()]
    notionals = [float(v["notional"]) for v in agg.values()]
    count_q90 = _quantile([float(c) for c in counts if c > 0], 0.90) if any(counts) else 0.0
    notional_q90 = _quantile([n for n in notionals if n > 0], 0.90) if any(notionals) else 0.0

    markers: list[PnlMarker] = []
    for t in grid_times:
        cnt = int(agg[t]["count"])
        nto = float(agg[t]["notional"])
        if cnt == 0:
            continue
        # Consider a cluster if either dimension exceeds its 90th percentile
        if (count_q90 and cnt >= count_q90) or (notional_q90 and nto >= notional_q90):
            markers.append({"t": t, "kind": "trade_cluster", "tradesCount": cnt, "notional": nto})

    # Limit to avoid clutter: top by notional then by count
    markers.sort(key=lambda m: (float(m.get("notional", 0.0)), int(m.get("tradesCount", 0))), reverse=True)
    return markers[:20]


class UserPnlWithMarkers(TypedDict):
    points: list[PriceHistoryPoint]
    markers: list[PnlMarker]


async def build_user_pnl_and_markers(
    user_address: str,
    *,
    interval: str = "1m",
    max_trades: int = 10_000,
) -> UserPnlWithMarkers:
    """
    High-level helper that returns user PnL points and chart-aligned markers.
    - Swing markers: large/extreme per-step PnL changes
    - Trade clusters: timestamps with unusually high trade activity (count/notional)
    """
    base = await fetch_user_pnl_and_trades_basic(
        user_address=user_address,
        interval=interval,
        max_trades=max_trades,
    )
    points = base["pnl_points"]
    if not points:
        return {"points": [], "markers": []}

    swing_markers = _compute_swing_markers(points)
    # Convert trade payload back to Trade objects if needed, else compute directly from dicts
    # We fetched trades as dicts; build lightweight Trade instances for typing reuse
    trades: list[Trade] = []
    for td in base["trades"]:
        try:
            trades.append(Trade(**td))
        except Exception:
            # Skip malformed
            continue

    grid_times = [int(p["t"]) for p in points]
    trade_markers = _aggregate_trade_clusters(trades, grid_times)

    # Merge and sort markers by time; keep both kinds
    markers = sorted([*swing_markers, *trade_markers], key=lambda m: int(m["t"]))
    return {"points": points, "markers": markers}


