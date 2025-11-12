"""API response wrapper models."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str


class AncillaryDataUpdate(BaseModel):
    """Ancillary data update from UMA CTF Adapter."""

    timestamp: int
    text: str  # decoded UTF-8 text from hex string
