from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class UserPositionDB(Base):
    """SQLAlchemy ORM model for user_positions table."""

    __tablename__ = "user_positions"

    # Composite primary key: one row per (wallet, asset)
    proxyWallet: Mapped[str] = mapped_column(String, primary_key=True)
    asset: Mapped[str] = mapped_column(String, primary_key=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    conditionId: Mapped[str] = mapped_column(String, nullable=False, index=True)
    size: Mapped[float] = mapped_column(Numeric, nullable=False)
    avgPrice: Mapped[float] = mapped_column(Numeric, nullable=False)
    initialValue: Mapped[float] = mapped_column(Numeric, nullable=False)
    currentValue: Mapped[float] = mapped_column(Numeric, nullable=False)
    cashPnl: Mapped[float] = mapped_column(Numeric, nullable=False)
    percentPnl: Mapped[float] = mapped_column(Numeric, nullable=False)
    totalBought: Mapped[float] = mapped_column(Numeric, nullable=False)
    realizedPnl: Mapped[float] = mapped_column(Numeric, nullable=False)
    percentRealizedPnl: Mapped[float] = mapped_column(Numeric, nullable=False)
    curPrice: Mapped[float] = mapped_column(Numeric, nullable=False)
    redeemable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    mergeable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=True)
    slug: Mapped[str] = mapped_column(String, nullable=True, index=True)
    icon: Mapped[str] = mapped_column(String, nullable=True)
    eventSlug: Mapped[str] = mapped_column(String, nullable=True)
    outcome: Mapped[str] = mapped_column(String, nullable=True)
    outcomeIndex: Mapped[int] = mapped_column(Integer, nullable=True)
    oppositeOutcome: Mapped[str] = mapped_column(String, nullable=True)
    oppositeAsset: Mapped[str] = mapped_column(String, nullable=True)
    endDate: Mapped[str] = mapped_column(String, nullable=True)
    negativeRisk: Mapped[bool] = mapped_column(Boolean, nullable=False)


class UserPosition(BaseModel):
    proxyWallet: str
    asset: str
    conditionId: str
    size: float
    avgPrice: float
    initialValue: float
    currentValue: float
    cashPnl: float
    percentPnl: float
    totalBought: float
    realizedPnl: float
    percentRealizedPnl: float
    curPrice: float
    redeemable: bool
    mergeable: bool
    title: str | None = None
    slug: str | None = None
    icon: str | None = None
    eventSlug: str | None = None
    outcome: str | None = None
    outcomeIndex: int | None = None
    oppositeOutcome: str | None = None
    oppositeAsset: str | None = None
    endDate: str | None = None
    negativeRisk: bool

    class Config:
        from_attributes = True


def parse_user_position_from_api(pos: dict) -> UserPosition | None:
    try:
        proxy_wallet = str(pos.get("user") or pos.get("proxyWallet") or "")
        if not proxy_wallet:
            return None
        asset = str(pos.get("asset") or "")
        if not asset:
            return None

        return UserPosition(
            proxyWallet=proxy_wallet,
            asset=asset,
            conditionId=str(pos.get("conditionId") or ""),
            size=float(pos.get("size") or 0),
            avgPrice=float(pos.get("avgPrice") or 0),
            initialValue=float(pos.get("initialValue") or 0),
            currentValue=float(pos.get("currentValue") or 0),
            cashPnl=float(pos.get("cashPnl") or 0),
            percentPnl=float(pos.get("percentPnl") or 0),
            totalBought=float(pos.get("totalBought") or 0),
            realizedPnl=float(pos.get("realizedPnl") or 0),
            percentRealizedPnl=float(pos.get("percentRealizedPnl") or 0),
            curPrice=float(pos.get("curPrice") or 0),
            redeemable=bool(pos.get("redeemable", False)),
            mergeable=bool(pos.get("mergeable", False)),
            title=str(pos.get("title") or ""),
            slug=str(pos.get("slug") or ""),
            icon=str(pos.get("icon") or ""),
            eventSlug=str(pos.get("eventSlug") or ""),
            outcome=str(pos.get("outcome") or ""),
            outcomeIndex=int(pos.get("outcomeIndex"))
            if pos.get("outcomeIndex") is not None
            else None,
            oppositeOutcome=str(pos.get("oppositeOutcome") or ""),
            oppositeAsset=str(pos.get("oppositeAsset") or ""),
            endDate=str(pos.get("endDate") or ""),
            negativeRisk=bool(pos.get("negativeRisk", False)),
        )
    except Exception:
        return None
