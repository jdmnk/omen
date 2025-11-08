"""Search models from Polymarket Gamma API public-search endpoint."""

from __future__ import annotations

from pydantic import BaseModel


class SearchMarketItem(BaseModel):
    """Lightweight market data from search API."""

    id: str
    question: str
    conditionId: str
    slug: str
    category: str | None = None
    liquidity: str | None = None
    volume: str | None = None
    outcomePrices: str | None = None
    outcomes: str | None = None
    active: bool
    closed: bool
    icon: str | None = None
    image: str | None = None


class SearchEventItem(BaseModel):
    """Lightweight event data from search API."""

    id: str
    ticker: str
    slug: str
    title: str
    subtitle: str | None = None
    description: str | None = None
    image: str | None = None
    icon: str | None = None
    active: bool
    closed: bool
    liquidity: float | None = None
    volume: float | None = None
    volume24hr: float | None = None
    markets: list[SearchMarketItem] | None = None


class SearchResponse(BaseModel):
    """Response from Polymarket search API."""

    events: list[SearchEventItem] | None = None
    markets: list[SearchMarketItem] | None = None
    tags: list[dict] | None = None
    profiles: list[dict] | None = None
    pagination: dict | None = None
