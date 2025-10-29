from datetime import datetime
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from py_clob_client.clob_types import OrderBookSummary

from src.analytics.trades_analytics import (
    UserTradesGroup,
    group_trades_by_user_detailed,
)
from src.db.database_client import DatabaseClient
from src.models.position import PositionSchema
from src.models.trade import TradeSchema
from src.polymarket.poly_client import PolyClient
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

db = DatabaseClient()
poly_client = PolyClient()


@app.get("/")
def home():
    return {"message": datetime.now().isoformat()}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/markets/autocomplete")
async def autocomplete_markets(q: str = Query(min_length=1), limit: int = 10) -> list[dict]:
    # hard cap to avoid excessive payloads
    limit = max(1, min(limit, 25))
    rows = await db.autocomplete_markets(q, limit=limit)
    return rows


@app.get("/markets/search-slug")
async def search_markets_slug(slug: str = Query(min_length=1)) -> dict:
    result = await db.get_market_by_slug(slug=slug)
    if result is None:
        raise HTTPException(status_code=404, detail="Market not found")

    return {"market": result.to_dict()}


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
    positions = await poly_client.get_market_positions(clob_tokens, min_amount=100)

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
