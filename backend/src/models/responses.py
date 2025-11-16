"""API response wrapper models."""

from pydantic import BaseModel
from typing import Literal


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


class PnlWithMarkersResponse(BaseModel):
    points: list[PnlPoint]
    markers: list[PnlMarker]
