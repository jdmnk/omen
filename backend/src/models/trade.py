from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class TradeSchema(BaseModel):
    proxyWallet: str
    side: str
    asset: str
    conditionId: str
    size: float
    price: float
    timestamp: int
    title: str
    slug: str
    icon: str
    eventSlug: str
    outcome: str
    outcomeIndex: int
    name: str
    pseudonym: str
    bio: str
    profileImage: str
    profileImageOptimized: str
    transactionHash: str

    class Config:
        from_attributes = True


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_trade_from_api(trade_dict: dict) -> TradeSchema | None:
    try:
        return TradeSchema(
            proxyWallet=str(trade_dict.get("proxyWallet", "")),
            side=str(trade_dict.get("side", "")),
            asset=str(trade_dict.get("asset", "")),
            conditionId=str(trade_dict.get("conditionId", "")),
            size=_to_float(trade_dict.get("size")),
            price=_to_float(trade_dict.get("price")),
            timestamp=_to_int(trade_dict.get("timestamp")),
            title=str(trade_dict.get("title", "")),
            slug=str(trade_dict.get("slug", "")),
            icon=str(trade_dict.get("icon", "")),
            eventSlug=str(trade_dict.get("eventSlug", "")),
            outcome=str(trade_dict.get("outcome", "")),
            outcomeIndex=_to_int(trade_dict.get("outcomeIndex")),
            name=str(trade_dict.get("name", "")),
            pseudonym=str(trade_dict.get("pseudonym", "")),
            bio=str(trade_dict.get("bio", "")),
            profileImage=str(trade_dict.get("profileImage", "")),
            profileImageOptimized=str(trade_dict.get("profileImageOptimized", "")),
            transactionHash=str(trade_dict.get("transactionHash", "")),
        )
    except Exception:
        return None
