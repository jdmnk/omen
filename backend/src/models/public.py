"""
DEPRECATED: This file is kept for backward compatibility during migration.
Import from specific model files instead:
- responses: src.models.responses
- search: src.models.search
- polymarket: src.models.polymarket
"""

# Re-export for backward compatibility
from src.models.polymarket import PolymarketHolder, PolymarketHoldersResponse
from src.models.responses import (
    EventResponse,
    HealthResponse,
    MarketAutocompleteItem,
    MarketSearchResponse,
    MessageResponse,
)
from src.models.search import SearchEventItem, SearchMarketItem, SearchResponse

__all__ = [
    "MessageResponse",
    "HealthResponse",
    "MarketAutocompleteItem",
    "MarketSearchResponse",
    "EventResponse",
    "SearchMarketItem",
    "SearchEventItem",
    "SearchResponse",
    "PolymarketHolder",
    "PolymarketHoldersResponse",
]
