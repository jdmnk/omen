from datetime import datetime
from typing import Annotated

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.analytics.top_holders_analysis import (
    get_top_holders_pnl,
    get_top_holders_wallet_info,
)
from src.analytics.user_pnl_markers import build_user_pnl_and_markers
from src.db.selects import SelectsClient
from src.models.event import Event
from src.models.market import Market
from src.models.onchain.ancillary_data import AncillaryDataUpdate
from src.models.responses import (
    HealthResponse,
    MessageResponse,
    PnlMarker,
    PnlPoint,
    PnlWithMarkersResponse,
)
from src.models.search import SearchResponse
from src.models.top_holders import (
    TopHolderPnl,
    TopHoldersPnlRequest,
    TopHoldersWalletInfoRequest,
    TopHolderWalletInfo,
)
from src.models.trade import Trade
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_graphs import PolyClientGraphs
from src.polymarket.poly_client_onchain import PolyClientOnchain
from src.utils.logging_config import get_logger
from src.utils.redis_client import redis_client

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
poly_client_onchain = PolyClientOnchain()


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
    condition_ids: Annotated[list[str], Query(description="Repeat the query param per ID")],
) -> list[Market]:
    """
    Get multiple markets by their condition IDs from Polymarket Gamma API.

    Official docs: https://docs.polymarket.com/api-reference/markets/list-markets
    """
    return await poly_client.get_markets_by_condition_ids(condition_ids)


@app.post("/markets/by-condition-ids", response_model=list[Market])
async def post_markets_by_condition_ids_endpoint(
    condition_ids: Annotated[
        list[str],
        Body(embed=True, description='JSON body: { "condition_ids": ["id1", ...] }'),
    ],
) -> list[Market]:
    """
    POST variant that accepts condition IDs in the JSON body.
    """
    return await poly_client.get_markets_by_condition_ids(condition_ids)


@app.post("/markets/top-holders-pnl", response_model=list[TopHolderPnl])
async def get_top_holders_pnl_endpoint(request: TopHoldersPnlRequest) -> list[TopHolderPnl]:
    """
    Get PnL data for holders.

    Accepts a list of TopHolder objects and returns them with PnL data (avgPrice, realizedPnl, totalBought).
    """
    logger.info(
        f"Top holders PnL request: {len(request.holders)} holders, token1={request.token1}, token2={request.token2}"
    )

    try:
        pnl_data = await get_top_holders_pnl(request.holders, [request.token1, request.token2])

        logger.info(f"Returning {len(pnl_data)} holders with PnL data")
        return pnl_data
    except Exception as exc:
        logger.error(f"Error in top holders PnL endpoint: {exc!s}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc!s}") from exc


@app.post("/markets/top-holders-wallet-info", response_model=list[TopHolderWalletInfo])
async def get_top_holders_wallet_info_endpoint(
    request: TopHoldersWalletInfoRequest,
) -> list[TopHolderWalletInfo]:
    """
    Get wallet information for holders.

    Accepts a list of TopHolder objects and returns them with wallet info (walletCreatedAt, walletLastTransfer, walletBalance).
    """
    logger.info(f"Top holders wallet info request: {len(request.holders)} holders")

    try:
        wallet_info = await get_top_holders_wallet_info(request.holders)

        logger.info(f"Returning {len(wallet_info)} holders with wallet info")
        return wallet_info
    except Exception as exc:
        logger.error(f"Error in top holders wallet info endpoint: {exc!s}", exc_info=True)
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


@app.get("/markets/clarifications", response_model=list[AncillaryDataUpdate])
async def get_clarifications_endpoint(
    question_id: str = Query(min_length=1, description="Question ID as hex string (bytes32)"),
    owner: str = Query(min_length=1, description="Owner address"),
) -> list[AncillaryDataUpdate]:
    """
    Get all updates for a questionID and owner from the UMA CTF Adapter contract on-chain.

    Calls getUpdates(bytes32 questionID, address owner) on contract 0x6A9D222616C90FcA5754cd1333cFD9b7fb6a4F74.
    Results are cached in Redis for 24 hours.
    """
    # Create cache key from question_id and owner
    cache_key = f"clarifications:{question_id}"

    try:
        # Try to get from cache first
        cached_result = redis_client.get(cache_key)
        if cached_result is not None:
            logger.info(f"Cache hit for clarifications: {cache_key}")
            # Convert dict list back to Pydantic models
            return [AncillaryDataUpdate(**item) for item in cached_result]

        # Cache miss - fetch from on-chain
        logger.info(f"Cache miss for {cache_key}, fetching from chain")
        updates = poly_client_onchain.get_rules_updates(question_id, owner)

        # Cache the result for 24 hours (86400 seconds)
        updates_dict = [update.model_dump() for update in updates]
        redis_client.set(cache_key, updates_dict, expiry_seconds=86400)
        logger.info(f"Cached clarifications for {cache_key}")

        return updates
    except Exception as exc:
        logger.error(f"Error in get_clarifications endpoint: {exc!s}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc!s}") from exc


@app.get("/users/{user_address}/pnl-with-markers", response_model=PnlWithMarkersResponse)
async def get_user_pnl_with_markers(
    user_address: str,
    interval: str = Query("1m"),
) -> PnlWithMarkersResponse:
    """
    Returns user PnL points and chart-aligned markers (swings and trade clusters).
    """
    try:
        cache_key = f"user-pnl-markers:{user_address}:{interval}"
        cached = redis_client.get(cache_key)
        if cached is not None:
            logger.info("Cache hit for %s", cache_key)
            return PnlWithMarkersResponse(**cached)

        result = await build_user_pnl_and_markers(
            user_address=user_address, interval=interval, max_trades=5000
        )
        # Map raw dicts to response models
        points = [PnlPoint(t=int(p["t"]), p=float(p["p"])) for p in result["points"]]
        markers = [
            PnlMarker(
                t=int(m["t"]),
                kind=m["kind"],
                delta=m.get("delta"),
                direction=m.get("direction"),
                severity=m.get("severity"),
                tradesCount=m.get("tradesCount"),
                notional=m.get("notional"),
                markets=m.get("markets"),
                trades=m.get("trades"),
            )
            for m in result["markers"]
        ]
        response = PnlWithMarkersResponse(points=points, markers=markers)
        redis_client.set(cache_key, response.model_dump(), expiry_seconds=300)
        return response
    except Exception as exc:
        logger.error(f"Error in get_user_pnl_with_markers: {exc!s}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc!s}") from exc
