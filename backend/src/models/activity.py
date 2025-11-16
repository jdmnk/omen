from __future__ import annotations

from pydantic import BaseModel

from src.models.trade import Trade
from src.utils.parse_utils import to_float, to_int


class ActivityTrade(BaseModel):
    """Schema representing a trade entry returned by the user activity endpoint."""

    proxyWallet: str
    timestamp: int
    conditionId: str
    type: str
    size: float
    usdcSize: float
    transactionHash: str
    price: float
    asset: str
    side: str
    outcomeIndex: int
    title: str
    slug: str
    icon: str
    eventSlug: str
    outcome: str
    name: str
    pseudonym: str
    bio: str
    profileImage: str
    profileImageOptimized: str

    class Config:
        from_attributes = True


def parse_activity_trade(entry: dict) -> Trade | None:
    """
    Convert a Polymarket activity response entry into our Trade schema.
    The activity response already flattens the required trade fields.
    """
    if not entry or str(entry.get("type", "")).upper() != "TRADE":
        return None

    activity = ActivityTrade(
        proxyWallet=str(entry.get("proxyWallet") or ""),
        timestamp=to_int(entry.get("timestamp"), 0),
        conditionId=str(entry.get("conditionId") or ""),
        type=str(entry.get("type") or ""),
        size=to_float(entry.get("size"), 0.0),
        usdcSize=to_float(entry.get("usdcSize"), 0.0),
        transactionHash=str(entry.get("transactionHash") or ""),
        price=to_float(entry.get("price"), 0.0),
        asset=str(entry.get("asset") or ""),
        side=str(entry.get("side") or ""),
        outcomeIndex=to_int(entry.get("outcomeIndex"), 0),
        title=str(entry.get("title") or ""),
        slug=str(entry.get("slug") or ""),
        icon=str(entry.get("icon") or ""),
        eventSlug=str(entry.get("eventSlug") or ""),
        outcome=str(entry.get("outcome") or ""),
        name=str(entry.get("name") or ""),
        pseudonym=str(entry.get("pseudonym") or ""),
        bio=str(entry.get("bio") or ""),
        profileImage=str(entry.get("profileImage") or ""),
        profileImageOptimized=str(entry.get("profileImageOptimized") or ""),
    )

    if not activity.timestamp or not activity.size or not activity.price:
        return None

    return Trade(
        proxyWallet=activity.proxyWallet,
        side=activity.side,
        asset=activity.asset,
        conditionId=activity.conditionId,
        size=activity.size,
        price=activity.price,
        timestamp=activity.timestamp,
        title=activity.title,
        slug=activity.slug,
        icon=activity.icon,
        eventSlug=activity.eventSlug,
        outcome=activity.outcome,
        outcomeIndex=activity.outcomeIndex,
        name=activity.name,
        pseudonym=activity.pseudonym,
        bio=activity.bio,
        profileImage=activity.profileImage,
        profileImageOptimized=activity.profileImageOptimized,
        transactionHash=activity.transactionHash,
    )
