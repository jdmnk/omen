from __future__ import annotations

from bisect import bisect_left
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
    # shared optional market details
    markets: list[MarkerMarketInfo]
    trades: list[MarkerTradeInfo]


class MarkerMarketInfo(TypedDict, total=False):
    title: str
    outcome: str | None
    tradesCount: int
    totalSize: float
    avgPrice: float | None
    notional: float
    side: str | None


class MarkerTradeInfo(TypedDict, total=False):
    hash: str
    title: str | None
    outcome: str | None
    side: str | None
    size: float
    price: float
    notional: float
    timestamp: int


class TradeBucketStats(TypedDict, total=False):
    count: int
    notional: float
    markets: list[MarkerMarketInfo]
    trades: list[MarkerTradeInfo]


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


def _build_trade_bucket_stats(
    trades: list[Trade],
    grid_times: list[int],
) -> tuple[dict[int, TradeBucketStats], int]:
    if not trades or len(grid_times) < 2:
        return {}, 60

    dts = [grid_times[i] - grid_times[i - 1] for i in range(1, len(grid_times))]
    step = max(1, int(_median(dts)))
    half = max(1, step // 2)

    bucket_stats: dict[int, dict[str, Any]] = {}
    for tr in trades:
        tt = int(tr.timestamp)
        nearest_t = None
        min_diff = 1_000_000_000
        for gt in grid_times:
            diff = abs(gt - tt)
            if diff < min_diff:
                min_diff = diff
                nearest_t = gt
            elif gt > tt and diff > min_diff:
                break
        if nearest_t is None or min_diff > half:
            continue

        entry = bucket_stats.setdefault(
            nearest_t,
            {"count": 0, "notional": 0.0, "markets": {}, "trades": []},
        )
        entry["count"] += 1
        notional = float(tr.size) * float(tr.price)
        entry["notional"] += notional

        market_key = f"{tr.title}|{tr.outcome}"
        markets_dict: dict[str, dict[str, Any]] = entry["markets"]
        market_entry = markets_dict.setdefault(
            market_key,
            {
                "title": tr.title,
                "outcome": tr.outcome,
                "tradesCount": 0,
                "totalSize": 0.0,
                "weightedPrice": 0.0,
                "notional": 0.0,
                "side": tr.side,
            },
        )
        market_entry["tradesCount"] += 1
        size_float = float(tr.size)
        market_entry["totalSize"] += size_float
        market_entry["weightedPrice"] += float(tr.price) * size_float
        market_entry["notional"] += notional
        if tr.side:
            market_entry["side"] = tr.side

        entry["trades"].append(
            {
                "hash": getattr(tr, "transactionHash", ""),
                "title": tr.title,
                "outcome": tr.outcome,
                "side": tr.side,
                "size": float(tr.size),
                "price": float(tr.price),
                "notional": notional,
                "timestamp": tt,
            }
        )

    stats: dict[int, TradeBucketStats] = {}
    for t, entry in bucket_stats.items():
        markets_info: list[MarkerMarketInfo] = []
        for market in entry["markets"].values():
            total_size = float(market["totalSize"])
            avg_price = float(market["weightedPrice"]) / total_size if total_size > 0 else None
            markets_info.append(
                {
                    "title": market.get("title", ""),
                    "outcome": market.get("outcome"),
                    "tradesCount": int(market.get("tradesCount", 0)),
                    "totalSize": total_size,
                    "avgPrice": avg_price,
                    "notional": float(market.get("notional", 0.0)),
                    "side": market.get("side"),
                }
            )
        markets_info.sort(
            key=lambda m: float(m.get("notional") or 0.0),
            reverse=True,
        )
        trades_info = sorted(
            entry.get("trades", []), key=lambda tr: float(tr.get("notional", 0.0)), reverse=True
        )
        stats[t] = {
            "count": int(entry.get("count", 0)),
            "notional": float(entry.get("notional", 0.0)),
            "markets": markets_info[:3],
            "trades": trades_info[:5],
        }
    return stats, step


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


def _aggregate_trade_clusters(bucket_stats: dict[int, TradeBucketStats]) -> list[PnlMarker]:
    if not bucket_stats:
        return []

    counts = [int(stats.get("count", 0)) for stats in bucket_stats.values()]
    notionals = [float(stats.get("notional", 0.0)) for stats in bucket_stats.values()]
    count_q90 = _quantile([float(c) for c in counts if c > 0], 0.90) if any(counts) else 0.0
    notional_q90 = _quantile([n for n in notionals if n > 0], 0.90) if any(notionals) else 0.0

    markers: list[PnlMarker] = []
    for t in sorted(bucket_stats.keys()):
        stats = bucket_stats.get(t)
        if not stats:
            continue
        cnt = int(stats.get("count", 0))
        nto = float(stats.get("notional", 0.0))
        if cnt == 0:
            continue
        # Consider a cluster if either dimension exceeds its 90th percentile
        if (count_q90 and cnt >= count_q90) or (notional_q90 and nto >= notional_q90):
            marker: PnlMarker = {
                "t": t,
                "kind": "trade_cluster",
                "tradesCount": cnt,
                "notional": nto,
            }
            markets_info = stats.get("markets")
            if markets_info:
                marker["markets"] = markets_info
            trades_info = stats.get("trades")
            if trades_info:
                marker["trades"] = trades_info
            markers.append(marker)

    # Limit to avoid clutter: top by notional then by count
    markers.sort(
        key=lambda m: (float(m.get("notional", 0.0)), int(m.get("tradesCount", 0))),
        reverse=True,
    )
    return markers[:20]


def _find_nearest_bucket_stats(
    target: int,
    trade_times: list[int],
    bucket_stats: dict[int, TradeBucketStats],
    tolerance: int,
) -> TradeBucketStats | None:
    if not trade_times:
        return None
    idx = bisect_left(trade_times, target)
    nearest_candidates: list[int] = []
    if idx < len(trade_times):
        nearest_candidates.append(trade_times[idx])
    if idx > 0:
        nearest_candidates.append(trade_times[idx - 1])
    best_time = None
    best_diff = None
    for cand in nearest_candidates:
        diff = abs(cand - target)
        if diff > tolerance:
            continue
        if best_diff is None or diff < best_diff:
            best_time = cand
            best_diff = diff
    if best_time is None:
        return None
    return bucket_stats.get(best_time)


def _attach_trade_context(
    markers: list[PnlMarker],
    bucket_stats: dict[int, TradeBucketStats],
    bucket_step: int,
) -> None:
    if not markers or not bucket_stats:
        return
    trade_times = sorted(bucket_stats.keys())
    tolerance = max(600, bucket_step * 2)
    for marker in markers:
        if marker.get("markets") and marker.get("trades"):
            continue
        stats = bucket_stats.get(int(marker["t"]))
        if not stats:
            stats = _find_nearest_bucket_stats(
                int(marker["t"]), trade_times, bucket_stats, tolerance
            )
        if not stats:
            continue
        if not marker.get("markets") and stats.get("markets"):
            marker["markets"] = stats["markets"]
        if not marker.get("trades") and stats.get("trades"):
            marker["trades"] = stats["trades"]


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
    bucket_stats, bucket_step = _build_trade_bucket_stats(trades, grid_times)
    trade_markers = _aggregate_trade_clusters(bucket_stats)

    # Merge and sort markers by time; keep both kinds, then attach trade context
    markers = sorted([*swing_markers, *trade_markers], key=lambda m: int(m["t"]))
    _attach_trade_context(markers, bucket_stats, bucket_step)
    markers_with_trades = [m for m in markers if m.get("trades")]
    return {"points": points, "markers": markers_with_trades}
