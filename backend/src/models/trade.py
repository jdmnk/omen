from __future__ import annotations

from pydantic import BaseModel

from src.utils.parse_utils import to_float, to_int


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


def parse_trade_from_api(trade_dict: dict) -> TradeSchema | None:
    try:
        return TradeSchema(
            proxyWallet=str(trade_dict.get("proxyWallet", "")),
            side=str(trade_dict.get("side", "")),
            asset=str(trade_dict.get("asset", "")),
            conditionId=str(trade_dict.get("conditionId", "")),
            size=to_float(trade_dict.get("size")),
            price=to_float(trade_dict.get("price")),
            timestamp=to_int(trade_dict.get("timestamp")),
            title=str(trade_dict.get("title", "")),
            slug=str(trade_dict.get("slug", "")),
            icon=str(trade_dict.get("icon", "")),
            eventSlug=str(trade_dict.get("eventSlug", "")),
            outcome=str(trade_dict.get("outcome", "")),
            outcomeIndex=to_int(trade_dict.get("outcomeIndex")),
            name=str(trade_dict.get("name", "")),
            pseudonym=str(trade_dict.get("pseudonym", "")),
            bio=str(trade_dict.get("bio", "")),
            profileImage=str(trade_dict.get("profileImage", "")),
            profileImageOptimized=str(trade_dict.get("profileImageOptimized", "")),
            transactionHash=str(trade_dict.get("transactionHash", "")),
        )
    except Exception:
        return None
