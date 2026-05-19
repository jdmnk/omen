"""API response wrapper models."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str


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
