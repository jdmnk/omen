"""API response wrapper models."""

from __future__ import annotations

from pydantic import BaseModel

from src.models.event import Event
from src.models.market import Market


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str


class MarketSearchResponse(BaseModel):
    """Wrapper response for single market."""

    market: Market


class EventResponse(BaseModel):
    """Wrapper response for single event."""

    event: Event
