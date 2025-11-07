from __future__ import annotations

from pydantic import BaseModel

from src.models.event import EventSchema
from src.models.market import MarketSchema


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str


class MarketAutocompleteItem(BaseModel):
    slug: str
    question: str


class MarketSearchResponse(BaseModel):
    market: MarketSchema


class EventResponse(BaseModel):
    event: EventSchema


class SearchMarketItem(BaseModel):
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
    events: list[SearchEventItem] | None = None
    markets: list[SearchMarketItem] | None = None
    tags: list[dict] | None = None
    profiles: list[dict] | None = None
    pagination: dict | None = None


class PolymarketHolder(BaseModel):
    """Schema for a single holder from Polymarket Data API."""

    proxyWallet: str
    bio: str | None = None
    asset: str
    pseudonym: str | None = None
    amount: float
    displayUsernamePublic: bool
    outcomeIndex: int
    name: str | None = None
    profileImage: str | None = None
    profileImageOptimized: str | None = None


class PolymarketHoldersResponse(BaseModel):
    """Schema for holders response from Polymarket Data API."""

    token: str
    holders: list[PolymarketHolder]
