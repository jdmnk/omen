import json
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Market(Base):
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


# Pydantic Model for validation and type safety
class MarketSchema(BaseModel):
    condition_id: str
    question: str
    icon: str
    outcomes: str
    outcomePrices: str
    slug: str
    token1: str
    token2: str
    description: str
    liquidity: Decimal = Field(ge=0)
    volume: Decimal = Field(ge=0)
    volume24hr: Decimal = Field(ge=0)
    volume1wk: Decimal = Field(ge=0)
    volume1mo: Decimal = Field(ge=0)
    volume1yr: Decimal = Field(ge=0)
    negRisk: bool
    bestBid: Decimal = Field(ge=0)
    bestAsk: Decimal = Field(ge=0)

    class Config:
        from_attributes = True


def parse_market_from_api(market_dict: dict) -> MarketSchema | None:
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
        outcomes = ", ".join(json.loads(market_dict.get("outcomes", "[]")))
        outcomePrices = ", ".join(json.loads(market_dict.get("outcomePrices", "[]")))

        # Get numeric fields with defaults
        liquidity = Decimal(str(market_dict.get("liquidityNum") or 0))
        volume = Decimal(str(market_dict.get("volumeNum") or market_dict.get("volume") or 0))
        volume24hr = Decimal(str(market_dict.get("volume24hr", 0)))
        volume1wk = Decimal(str(market_dict.get("volume1wk", 0)))
        volume1mo = Decimal(str(market_dict.get("volume1mo", 0)))
        volume1yr = Decimal(str(market_dict.get("volume1yr", 0)))

        negRisk = market_dict.get("negRisk", False)

        bestBid = Decimal(str(market_dict.get("bestBid", 0)))
        bestAsk = Decimal(str(market_dict.get("bestAsk", 0)))

        return MarketSchema(
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
        )
    except (ValueError, KeyError, TypeError):
        # Log error but don't crash - just skip this item
        return None
