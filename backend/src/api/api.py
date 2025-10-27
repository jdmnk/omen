from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List, Dict
from src.db.database_client import DatabaseClient
from py_clob_client.clob_types import OrderBookSummary
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


@app.get("/markets/search")
async def search_markets(query: str = Query(min_length=1)) -> Dict:
    result = await db.search_markets(query=query)

    if result is None:
        raise HTTPException(status_code=404, detail="Market not found")
    return result

@app.get("/markets/autocomplete")
async def autocomplete_markets(q: str = Query(min_length=1), limit: int = 10) -> List[Dict]:
    # hard cap to avoid excessive payloads
    limit = max(1, min(limit, 25))
    rows = await db.autocomplete_markets(q, limit=limit)
    return rows

@app.get("/markets/search-slug")
async def search_markets_slug(slug: str = Query(min_length=1)) -> Dict:
    result = await db.get_market_by_slug(slug=slug)
    if result is None:
        raise HTTPException(status_code=404, detail="Market not found")

    positions = await poly_client.get_market_positions([result.token1, result.token2], min_amount=100)
    return {
        "market": result.to_dict(),
        "positions": positions
    }

@app.get("/markets/order-book", response_model=OrderBookSummary | None)
def get_market_order_book(token_id: str = Query(min_length=1)) -> OrderBookSummary | None:
    order_book = poly_client.get_market_order_book(token_id)
    if order_book is not None:
        return order_book
    else:
        raise HTTPException(status_code=404, detail="Order book not found")

@app.get("/markets/trades", response_model=List[Dict])
async def get_market_trades(condition_id: str = Query(min_length=1)) -> List[Dict]:
    trades = await poly_client.get_market_trades([condition_id])

    if trades is not None and len(trades) > 0:
        return trades
    else:
        raise HTTPException(status_code=404, detail="Trades not found")

@app.get("/markets/positions", response_model=List[Dict])
async def get_market_positions(clob_tokens: List[str] = Query(min_length=1)) -> List[Dict]:
    positions = await poly_client.get_market_positions(clob_tokens, min_amount=100)

    if positions is not None and len(positions) > 0:
        return positions
    else:
        raise HTTPException(status_code=404, detail="Positions not found")