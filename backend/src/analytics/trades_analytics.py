from __future__ import annotations

from collections import defaultdict

from pydantic import BaseModel, Field

from src.models.trade import TradeSchema


class UserConditionStats(BaseModel):
    """Aggregated stats for a single market (condition) for a specific user."""

    conditionId: str
    slug: str | None = None
    title: str | None = None
    icon: str | None = None

    # Sum of absolute trade sizes (buys and sells added together)
    volume: float = 0.0
    # Sum of absolute notional (|size| * price)
    notional: float = 0.0

    # Net holdings by outcome (BUY adds, SELL subtracts)
    netHoldingsByOutcome: dict[str, float] = Field(default_factory=dict)
    # Sum of positive outcome holdings (what the user actually holds currently)
    totalHoldings: float = 0.0


class UserHoldingsSummary(BaseModel):
    """Aggregated stats across all markets for a specific user (wallet)."""

    proxyWallet: str
    name: str | None = None
    pseudonym: str | None = None
    profileImage: str | None = None
    totalVolume: float
    totalNotional: float
    totalHoldings: float
    markets: list[UserConditionStats]


def _outcome_key(trade: TradeSchema) -> str:
    # Prefer outcome string, fall back to outcomeIndex or asset
    if trade.outcome:
        return str(trade.outcome)
    if trade.outcomeIndex is not None:
        return str(trade.outcomeIndex)
    return str(trade.asset)


def aggregate_trades_by_user(trades: list[TradeSchema]) -> list[UserHoldingsSummary]:
    """Group trades by user, aggregate volume and current holdings, order by holdings.

    - Volume per user: sum of absolute sizes across BUY and SELL for the same user and condition
    - Current holdings: net BUY-SELL by outcome; per-condition holdings is sum of positive outcome nets
    - Users ordered by total current holdings descending
    """

    # user -> conditionId -> aggregator dict
    user_to_conditions: dict[str, dict[str, dict]] = {}
    # user -> metadata (name/pseudonym/profile)
    user_meta: dict[str, dict[str, str | None]] = {}

    for trade in trades:
        wallet = trade.proxyWallet
        condition_id = trade.conditionId
        if not wallet or not condition_id:
            continue

        side = (trade.side or "").upper()
        size = float(trade.size or 0.0)
        price = float(trade.price or 0.0)
        outcome = _outcome_key(trade)

        if wallet not in user_to_conditions:
            user_to_conditions[wallet] = {}
            user_meta[wallet] = {
                "name": trade.name or None,
                "pseudonym": trade.pseudonym or None,
                "profileImage": trade.profileImage or None,
            }
        else:
            # fill missing meta from this trade if available
            meta = user_meta[wallet]
            if (not meta.get("name")) and trade.name:
                meta["name"] = trade.name
            if (not meta.get("pseudonym")) and trade.pseudonym:
                meta["pseudonym"] = trade.pseudonym
            if (not meta.get("profileImage")) and trade.profileImage:
                meta["profileImage"] = trade.profileImage
        if condition_id not in user_to_conditions[wallet]:
            user_to_conditions[wallet][condition_id] = {
                "slug": trade.slug,
                "title": trade.title,
                "icon": trade.icon,
                "volume": 0.0,
                "notional": 0.0,
                "holdings": defaultdict(float),  # type: DefaultDict[str, float]
            }

        agg = user_to_conditions[wallet][condition_id]
        agg["volume"] += abs(size)
        agg["notional"] += abs(size) * price

        delta = size if side == "BUY" else -size if side == "SELL" else 0.0
        if delta:
            agg["holdings"][outcome] += delta

    summaries: list[UserHoldingsSummary] = []

    for wallet, conds in user_to_conditions.items():
        market_stats: list[UserConditionStats] = []
        total_volume = 0.0
        total_notional = 0.0
        total_holdings = 0.0

        for condition_id, agg in conds.items():
            holdings_by_outcome: dict[str, float] = dict(agg["holdings"])  # freeze
            positive_sum = sum(v for v in holdings_by_outcome.values() if v > 0)

            market_stat = UserConditionStats(
                conditionId=condition_id,
                slug=agg["slug"],
                title=agg["title"],
                icon=agg["icon"],
                volume=agg["volume"],
                notional=agg["notional"],
                netHoldingsByOutcome=holdings_by_outcome,
                totalHoldings=positive_sum,
            )

            market_stats.append(market_stat)
            total_volume += market_stat.volume
            total_notional += market_stat.notional
            total_holdings += market_stat.totalHoldings

        # Order a user's markets by holdings descending for convenience
        market_stats.sort(key=lambda m: m.totalHoldings, reverse=True)

        meta = user_meta.get(wallet, {})
        summaries.append(
            UserHoldingsSummary(
                proxyWallet=wallet,
                name=meta.get("name"),
                pseudonym=meta.get("pseudonym"),
                profileImage=meta.get("profileImage"),
                totalVolume=total_volume,
                totalNotional=total_notional,
                totalHoldings=total_holdings,
                markets=market_stats,
            )
        )

    # Order users by total current holdings
    summaries.sort(key=lambda s: s.totalHoldings, reverse=True)
    return summaries


class UserTradesGroup(BaseModel):
    """Trades-based group per user for a single condition (market)."""

    proxyWallet: str
    name: str | None = None
    pseudonym: str | None = None
    profileImage: str | None = None

    totalVolume: float
    totalNotional: float
    totalUsdVolume: float

    # Not returned in UI, but used for backend ordering
    totalHoldings: float

    # All trades (sorted by size desc)
    trades: list[TradeSchema]


def group_trades_by_user_detailed(trades: list[TradeSchema]) -> list[UserTradesGroup]:
    """Return groups of related trades by user with per-group stats.

    - Group by proxyWallet
    - totalVolume: sum of absolute sizes (shares)
    - totalUsdVolume: sum of absolute size * price (USD). totalNotional kept for compatibility
    - Sort each group's trades by absolute size desc
    - Order groups by totalUsdVolume desc
    """

    user_to_trades: dict[str, list[TradeSchema]] = {}
    user_meta: dict[str, dict[str, str | None]] = {}

    # Partition trades by wallet and capture basic metadata
    for t in trades:
        wallet = t.proxyWallet
        if not wallet:
            continue
        user_to_trades.setdefault(wallet, []).append(t)
        if wallet not in user_meta:
            user_meta[wallet] = {
                "name": t.name or None,
                "pseudonym": t.pseudonym or None,
                "profileImage": t.profileImage or None,
            }
        else:
            meta = user_meta[wallet]
            if (not meta.get("name")) and t.name:
                meta["name"] = t.name
            if (not meta.get("pseudonym")) and t.pseudonym:
                meta["pseudonym"] = t.pseudonym
            if (not meta.get("profileImage")) and t.profileImage:
                meta["profileImage"] = t.profileImage

    groups: list[UserTradesGroup] = []

    for wallet, user_trades in user_to_trades.items():
        # Compute totals
        sizes_abs = [abs(float(tr.size or 0.0)) for tr in user_trades]
        prices = [float(tr.price or 0.0) for tr in user_trades]
        total_volume = sum(sizes_abs)
        total_notional = sum(s * p for s, p in zip(sizes_abs, prices, strict=False))

        # Compute net holdings by outcome (BUY adds, SELL subtracts)
        holdings_by_outcome: dict[str, float] = {}
        for tr in user_trades:
            side = (tr.side or "").upper()
            signed_size = (
                float(tr.size or 0.0)
                if side == "BUY"
                else -float(tr.size or 0.0)
                if side == "SELL"
                else 0.0
            )
            if signed_size:
                outcome_key = _outcome_key(tr)
                holdings_by_outcome[outcome_key] = (
                    holdings_by_outcome.get(outcome_key, 0.0) + signed_size
                )

        total_holdings = sum(v for v in holdings_by_outcome.values() if v > 0)

        # Sort trades in-place by absolute size desc
        user_trades_sorted = sorted(
            user_trades, key=lambda tr: abs(float(tr.size or 0.0)), reverse=True
        )

        meta = user_meta.get(wallet, {})
        groups.append(
            UserTradesGroup(
                proxyWallet=wallet,
                name=meta.get("name"),
                pseudonym=meta.get("pseudonym"),
                profileImage=meta.get("profileImage"),
                totalVolume=total_volume,
                totalNotional=total_notional,
                totalUsdVolume=total_notional,
                totalHoldings=total_holdings,
                trades=user_trades_sorted,
            )
        )

    # Order groups by totalUsdVolume desc
    groups.sort(key=lambda g: g.totalUsdVolume, reverse=True)
    return groups
