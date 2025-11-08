from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import BigInteger, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base
from src.utils.parse_utils import to_float, to_int


class TradeDB(Base):
    """SQLAlchemy ORM model for trades table."""
    __tablename__ = "trades"

    transactionHash: Mapped[str] = mapped_column(String, primary_key=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    proxyWallet: Mapped[str] = mapped_column(String, nullable=False)
    side: Mapped[str] = mapped_column(String, nullable=False)
    asset: Mapped[str] = mapped_column(String, nullable=False)
    conditionId: Mapped[str] = mapped_column(String, nullable=False, index=True)
    size: Mapped[float] = mapped_column(Numeric, nullable=False)
    price: Mapped[float] = mapped_column(Numeric, nullable=False)
    timestamp: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=True)
    slug: Mapped[str] = mapped_column(String, nullable=True)
    icon: Mapped[str] = mapped_column(String, nullable=True)
    eventSlug: Mapped[str] = mapped_column(String, nullable=True)
    outcome: Mapped[str] = mapped_column(String, nullable=True)
    outcomeIndex: Mapped[int] = mapped_column(BigInteger, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    pseudonym: Mapped[str] = mapped_column(String, nullable=True)
    bio: Mapped[str] = mapped_column(String, nullable=True)
    profileImage: Mapped[str] = mapped_column(String, nullable=True)
    profileImageOptimized: Mapped[str] = mapped_column(String, nullable=True)


class Trade(BaseModel):
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


def parse_trade_from_api(trade_dict: dict) -> Trade | None:
    try:
        return Trade(
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
