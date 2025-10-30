from __future__ import annotations

from pydantic import BaseModel

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
