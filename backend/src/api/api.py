from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.analytics.top_holders_analysis import TopHolder, get_top_holders_with_wallet_info
from src.db.selects import SelectsClient
from src.models.responses import (
    EventResponse,
    HealthResponse,
    MarketSearchResponse,
    MessageResponse,
)
from src.models.search import SearchResponse
from src.models.trade import Trade
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_graphs import PolyClientGraphs
from src.utils.logging_config import get_logger

logger = get_logger(__name__)
app = FastAPI()

# Allow cross-origin requests from anywhere in dev; restrict in prod via env later if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

selects = SelectsClient()
poly_client = PolyClient()
poly_client_graphs = PolyClientGraphs()


@app.get("/", response_model=MessageResponse)
def home() -> MessageResponse:
    return MessageResponse(message=datetime.now().isoformat())


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/markets/search-slug", response_model=MarketSearchResponse)
async def search_markets_slug(slug: str = Query(min_length=1)) -> MarketSearchResponse:
    """
    Get a market by its slug from Polymarket Gamma API.

    Official docs: https://docs.polymarket.com/api-reference/markets/get-market-by-slug
    """
    result = await poly_client.get_market_by_slug(slug)
    if result is None:
        raise HTTPException(status_code=404, detail="Market not found")

    return MarketSearchResponse(market=result)


@app.get("/markets/trades", response_model=list[Trade])
async def get_market_trades(condition_id: str = Query(min_length=1)) -> list[Trade]:
    trades = await poly_client.get_market_trades([condition_id])

    if trades is not None and len(trades) > 0:
        return trades
    else:
        raise HTTPException(status_code=404, detail="Trades not found")


@app.get("/markets/search", response_model=SearchResponse)
async def search_markets(q: str = Query(min_length=1)) -> SearchResponse:
    """
    Search for markets using Polymarket Gamma API.
    Returns events with their markets, filtered to only active markets.
    """
    return await poly_client.search_markets(q)


@app.get("/markets/top-holders", response_model=list[TopHolder])
async def get_top_holders_with_wallet_info_endpoint(
    condition_id: str = Query(min_length=1),
    token1: str = Query(min_length=1),
    token2: str = Query(min_length=1),
) -> list[TopHolder]:
    holders = await get_top_holders_with_wallet_info(condition_id, [token1, token2])

    if not holders:
        raise HTTPException(status_code=404, detail="Top holders not found")

    return holders


@app.get("/events/{event_id}", response_model=EventResponse)
async def get_event_by_id(event_id: str) -> EventResponse:
    """
    Get an event by its ID from Polymarket Gamma API.

    Official docs: https://docs.polymarket.com/api-reference/events/get-event-by-id
    """
    result = await poly_client.get_event_by_id(event_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return EventResponse(event=result)
