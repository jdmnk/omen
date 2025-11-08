"""API response wrapper models."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
