"""API response wrapper models."""

from typing import Literal

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str


class PnlPoint(BaseModel):
    """Single PnL point for user PnL chart."""

    t: int  # unix seconds
    p: float


class PnlMarker(BaseModel):
    """Marker aligned to PnL chart timestamps."""

    t: int
    kind: Literal["swing", "trade_cluster"]
    # optional swing fields
    delta: float | None = None
    direction: Literal["up", "down"] | None = None
    severity: Literal["large", "extreme"] | None = None
    # optional trade cluster fields
    tradesCount: int | None = None
    notional: float | None = None
    markets: list["MarkerMarketInfo"] | None = None
    trades: list["MarkerTradeInfo"] | None = None


class MarkerMarketInfo(BaseModel):
    title: str | None = None
    outcome: str | None = None
    tradesCount: int | None = None
    totalSize: float | None = None
    avgPrice: float | None = None
    notional: float | None = None
    side: str | None = None


class MarkerTradeInfo(BaseModel):
    hash: str | None = None
    title: str | None = None
    outcome: str | None = None
    side: str | None = None
    size: float | None = None
    price: float | None = None
    notional: float | None = None
    timestamp: int | None = None


class PnlWithMarkersResponse(BaseModel):
    points: list[PnlPoint]
    markers: list[PnlMarker]


class TopMover(BaseModel):
    """Market with price movement data."""

    clob_token_id: str
    question: str
    slug: str
    icon: str
    last_price: float | None
    price_delta: float | None
    fetched_at: str  # ISO timestamp


class TopMoversResponse(BaseModel):
    """Response for top movers endpoint."""

    movers: list[TopMover]
    fetched_at: str  # ISO timestamp of when data was last updated
