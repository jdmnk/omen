from pydantic import BaseModel


class AncillaryDataUpdate(BaseModel):
    """Ancillary data update from UMA CTF Adapter."""

    timestamp: int
    text: str  # decoded UTF-8 text from hex string
