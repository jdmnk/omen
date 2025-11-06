from datetime import datetime
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from py_clob_client.clob_types import OrderBookSummary

from src.analytics.insider_finder import find_insiders
from src.analytics.top_holders_analysis import TopHolderSchema, get_top_holders_with_wallet_info
from src.analytics.trades_analytics import (
    UserTradesGroup,
    group_trades_by_user_detailed,
)
from src.db.selects import SelectsClient
from src.models.position import PositionSchema
from src.models.public import (
    HealthResponse,
    MarketAutocompleteItem,
    MarketSearchResponse,
    MessageResponse,
    SearchResponse,
)
from src.models.trade import TradeSchema
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


@app.get("/markets/autocomplete", response_model=list[MarketAutocompleteItem])
async def autocomplete_markets(
    q: str = Query(min_length=1), limit: int = 10
) -> list[MarketAutocompleteItem]:
    # hard cap to avoid excessive payloads
    limit = max(1, min(limit, 25))
    return await selects.autocomplete_markets(q, limit=limit)


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


@app.get("/markets/order-book", response_model=OrderBookSummary | None)
def get_market_order_book(token_id: str = Query(min_length=1)) -> OrderBookSummary | None:
    order_book = poly_client.get_market_order_book(token_id)
    if order_book is not None:
        return order_book
    else:
        raise HTTPException(status_code=404, detail="Order book not found")


@app.get("/markets/trades", response_model=list[TradeSchema])
async def get_market_trades(condition_id: str = Query(min_length=1)) -> list[TradeSchema]:
    trades = await poly_client.get_market_trades([condition_id])

    if trades is not None and len(trades) > 0:
        return trades
    else:
        raise HTTPException(status_code=404, detail="Trades not found")


@app.get("/markets/positions", response_model=list[PositionSchema])
async def get_market_positions(clob_tokens: Annotated[list[str], Query()]) -> list[PositionSchema]:
    positions = await poly_client_graphs.get_market_positions(clob_tokens, min_amount=100)

    if positions is not None and len(positions) > 0:
        return positions
    else:
        raise HTTPException(status_code=404, detail="Positions not found")


@app.get("/markets/trades/analytics", response_model=list[UserTradesGroup])
async def get_market_trades_analytics(
    condition_id: str = Query(min_length=1),
) -> list[UserTradesGroup]:
    trades = await poly_client.get_market_trades([condition_id])
    if trades is None or len(trades) == 0:
        raise HTTPException(status_code=404, detail="Trades not found")
    return group_trades_by_user_detailed(trades)


@app.get("/markets/search", response_model=SearchResponse)
async def search_markets(q: str = Query(min_length=1)) -> SearchResponse:
    """
    Search for markets using Polymarket Gamma API.
    Returns events with their markets, filtered to only active markets.
    """
    return await poly_client.search_markets(q)


@app.get("/markets/top-holders", response_model=list[TopHolderSchema])
async def get_top_holders_with_wallet_info_endpoint(
    condition_id: str = Query(min_length=1),
    token1: str = Query(min_length=1),
    token2: str = Query(min_length=1),
) -> list[TopHolderSchema]:
    holders = await get_top_holders_with_wallet_info(condition_id, [token1, token2])

    if not holders:
        raise HTTPException(status_code=404, detail="Top holders not found")

    return holders
