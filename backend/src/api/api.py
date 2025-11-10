from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.analytics.top_holders_analysis import TopHolderAnalysis, get_top_holders_analysis
from src.db.selects import SelectsClient
from src.models.event import Event
from src.models.market import Market
from src.models.responses import (
    HealthResponse,
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


@app.get("/markets/search-slug", response_model=Market)
async def get_market_by_slug_endpoint(slug: str = Query(min_length=1)) -> Market:
    """
    Get a market by its slug from Polymarket Gamma API.

    Official docs: https://docs.polymarket.com/api-reference/markets/get-market-by-slug
    """
    result = await poly_client.get_market_by_slug(slug)
    if result is None:
        raise HTTPException(status_code=404, detail="Market not found")

    return result


@app.get("/markets/trades", response_model=list[Trade])
async def get_market_trades_endpoint(condition_id: str = Query(min_length=1)) -> list[Trade]:
    trades = await poly_client.get_market_trades([condition_id])

    if trades is not None and len(trades) > 0:
        return trades
    else:
        raise HTTPException(status_code=404, detail="Trades not found")


@app.get("/markets/search", response_model=SearchResponse)
async def get_search_markets_endpoint(q: str = Query(min_length=1)) -> SearchResponse:
    """
    Search for markets using Polymarket Gamma API.
    Returns events with their markets, filtered to only active markets.
    """
    return await poly_client.search_markets(q)


@app.get("/markets/by-condition-ids", response_model=list[Market])
async def get_markets_by_condition_ids_endpoint(
    condition_ids: list[str] = Query(min_length=1),
) -> list[Market]:
    """
    Get multiple markets by their condition IDs from Polymarket Gamma API.

    Official docs: https://docs.polymarket.com/api-reference/markets/list-markets
    """
    return await poly_client.get_markets_by_condition_ids(condition_ids)


@app.get("/markets/top-holders-analysis", response_model=list[TopHolderAnalysis])
async def get_top_holders_analysis_endpoint(
    condition_id: str = Query(min_length=1),
    token1: str = Query(min_length=1),
    token2: str = Query(min_length=1),
) -> list[TopHolderAnalysis]:
    logger.info(
        f"Top holders analysis request: condition_id={condition_id}, token1={token1}, token2={token2}"
    )

    try:
        holders = await get_top_holders_analysis(condition_id, [token1, token2])

        if not holders:
            logger.warning(
                f"No holders found for condition_id={condition_id}, token1={token1}, token2={token2}"
            )
            raise HTTPException(status_code=404, detail="Top holders not found")

        logger.info(f"Returning {len(holders)} holders")
        return holders
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error in top holders analysis endpoint: {exc!s}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc!s}") from exc


@app.get("/events/{event_id}", response_model=Event)
async def get_event_by_id_endpoint(event_id: str) -> Event:
    """
    Get an event by its ID from Polymarket Gamma API.

    Official docs: https://docs.polymarket.com/api-reference/events/get-event-by-id
    """
    result = await poly_client.get_event_by_id(event_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return result
