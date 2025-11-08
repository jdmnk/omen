import json
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class ClobReward(BaseModel):
    """Schema for a single CLOB reward configuration."""

    id: str
    conditionId: str
    assetAddress: str
    rewardsAmount: float
    rewardsDailyRate: float
    startDate: str
    endDate: str


class MarketDB(Base):
    """SQLAlchemy ORM model for markets table."""

    __tablename__ = "markets"

    condition_id: Mapped[str] = mapped_column(String, primary_key=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    question: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, nullable=False)
    outcomes: Mapped[str] = mapped_column(String, nullable=False)
    outcomePrices: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False, index=True)
    token1: Mapped[str] = mapped_column(String, nullable=False)
    token2: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    liquidity: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    volume: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    volume24hr: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    volume1wk: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    volume1mo: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    volume1yr: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    negRisk: Mapped[bool] = mapped_column(Boolean, nullable=False)
    bestBid: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    bestAsk: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    endDate: Mapped[str] = mapped_column(String, nullable=False)


# Pydantic model for API validation and serialization
class Market(BaseModel):
    condition_id: str
    question: str
    icon: str
    outcomes: str
    outcomePrices: str
    slug: str
    token1: str
    token2: str
    description: str
    liquidity: float = Field(ge=0)
    volume: float = Field(ge=0)
    volume24hr: float = Field(ge=0)
    volume1wk: float = Field(ge=0)
    volume1mo: float = Field(ge=0)
    volume1yr: float = Field(ge=0)
    negRisk: bool
    bestBid: float = Field(ge=0, le=1)
    bestAsk: float = Field(ge=0, le=1)
    endDate: str
    events: list[dict] | None = None
    # Reward-related fields
    umaReward: float | None = None
    clobRewards: list[ClobReward] | None = None
    rewardsMinSize: float | None = None
    rewardsMaxSpread: float | None = None
    holdingRewardsEnabled: bool | None = None
    feesEnabled: bool | None = None

    class Config:
        from_attributes = True


def parse_market_from_api(market_dict: dict) -> Market | None:
    try:
        condition_id = market_dict.get("conditionId")
        if not condition_id:
            return None

        slug = market_dict.get("slug", "")
        if not slug:
            return None

        # Parse clobTokenIds (format: "[token1,token2]" as string)
        clob_token_ids = market_dict.get("clobTokenIds", "")
        tokens = json.loads(clob_token_ids)
        token1 = tokens[0]
        token2 = tokens[1]
        description = market_dict.get("description")
        question = market_dict.get("question", "")
        icon = market_dict.get("icon", "")
        outcomes = ",".join(json.loads(market_dict.get("outcomes", "[]")))
        outcomePrices = ",".join(json.loads(market_dict.get("outcomePrices", "[]")))

        # Get numeric fields with defaults
        liquidity = float(market_dict.get("liquidityNum") or 0)
        volume = float(market_dict.get("volumeNum") or market_dict.get("volume") or 0)
        volume24hr = float(market_dict.get("volume24hr", 0))
        volume1wk = float(market_dict.get("volume1wk", 0))
        volume1mo = float(market_dict.get("volume1mo", 0))
        volume1yr = float(market_dict.get("volume1yr", 0))

        negRisk = market_dict.get("negRisk", False)

        bestBid = float(market_dict.get("bestBid", 0))
        bestAsk = float(market_dict.get("bestAsk", 0))

        endDate = market_dict.get("endDate", "")
        events = market_dict.get("events", [])

        # Parse reward-related fields
        uma_reward = None
        if market_dict.get("umaReward") is not None:
            uma_reward = float(market_dict.get("umaReward", 0))

        clob_rewards = None
        if market_dict.get("clobRewards"):
            try:
                clob_rewards = [
                    ClobReward(
                        id=str(r.get("id", "")),
                        conditionId=str(r.get("conditionId", "")),
                        assetAddress=str(r.get("assetAddress", "")),
                        rewardsAmount=float(r.get("rewardsAmount", 0)),
                        rewardsDailyRate=float(r.get("rewardsDailyRate", 0)),
                        startDate=str(r.get("startDate", "")),
                        endDate=str(r.get("endDate", "")),
                    )
                    for r in market_dict.get("clobRewards", [])
                ]
            except (ValueError, TypeError, KeyError):
                clob_rewards = None

        rewards_min_size = None
        if market_dict.get("rewardsMinSize") is not None:
            rewards_min_size = float(market_dict.get("rewardsMinSize", 0))

        rewards_max_spread = None
        if market_dict.get("rewardsMaxSpread") is not None:
            rewards_max_spread = float(market_dict.get("rewardsMaxSpread", 0))

        holding_rewards_enabled = market_dict.get("holdingRewardsEnabled")
        fees_enabled = market_dict.get("feesEnabled")

        return Market(
            condition_id=condition_id,
            question=question,
            icon=icon,
            outcomes=outcomes,
            outcomePrices=outcomePrices,
            slug=slug,
            token1=token1,
            token2=token2,
            description=description,
            liquidity=liquidity,
            volume=volume,
            volume24hr=volume24hr,
            volume1wk=volume1wk,
            volume1mo=volume1mo,
            volume1yr=volume1yr,
            negRisk=negRisk,
            bestBid=bestBid,
            bestAsk=bestAsk,
            endDate=endDate,
            events=events,
            umaReward=uma_reward,
            clobRewards=clob_rewards,
            rewardsMinSize=rewards_min_size,
            rewardsMaxSpread=rewards_max_spread,
            holdingRewardsEnabled=holding_rewards_enabled,
            feesEnabled=fees_enabled,
        )
    except (ValueError, KeyError, TypeError):
        # Log error but don't crash - just skip this item
        return None
