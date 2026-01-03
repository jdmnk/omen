import asyncio
import json
import traceback

import httpx
from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON
from py_clob_client.exceptions import PolyApiException

from src.models.activity import parse_activity_trade
from src.models.event import Event, parse_event_from_api
from src.models.market import Market, parse_market_from_api
from src.models.search import SearchEventItem, SearchMarketItem, SearchProfileItem, SearchResponse
from src.models.top_holders import TopHolder
from src.models.trade import Trade, parse_trade_from_api
from src.models.user_position import UserPosition, parse_user_position_from_api
from src.models.user_profile import UserPublicProfile
from src.settings import settings
from src.utils.logging_config import get_logger

logger = get_logger(__name__)

CLOB_HOST = "https://clob.polymarket.com"
DATA_API_HOST = "https://data-api.polymarket.com"
GAMMA_API_HOST = "https://gamma-api.polymarket.com"
GOLDSKY_API_HOST = "https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw"
GOLDSKY_API_PNL_SUBGRAPH = "/subgraphs/pnl-subgraph/0.0.14/gn"

BLACKLISTED_MARKET_TAGS = [
    {
        "id": "620",
        "slug": "btc",
    },
    {
        "id": "235",
        "slug": "bitcoin",
    },
    {
        "id": "157",
        "slug": "eth",
    },
    {
        "id": "39",
        "slug": "ethereum",
    },
    {
        "id": "818",
        "slug": "solana",
    },
    {
        "id": "102264",
        "slug": "weekly",
    },
    {
        "id": "1312",
        "slug": "crypto-prices",
    },
]


class PolyClient:
    """
    General rate limiting: 5000req / 10s
    Data API (General)	200 requests / 10s	(Throttle requests over the maximum configured rate)
    """

    def __init__(self):
        # self.clob_client = self.get_clob_client()
        pass

    def get_clob_client(self) -> ClobClient:
        client = ClobClient(CLOB_HOST, key=settings.polymarket_private_key, chain_id=POLYGON)
        api_creds = client.create_or_derive_api_creds()
        client.set_api_creds(api_creds)
        return client

    async def get_active_events(
        self, exclude_tag_ids: list[int] | None = None, count: int | None = None
    ) -> list[dict]:
        """
        Fetch active events from Gamma API, mirroring params used by get_active_markets_by_events,
        but return the raw events payload (including markets) instead of flattening to markets.
        """
        limit = 500
        offset = 0
        all_events: list[dict] = []
        final_excluded_tag_ids: list[int] = []
        if exclude_tag_ids is None or len(exclude_tag_ids) == 0:
            final_excluded_tag_ids = [tag["id"] for tag in BLACKLISTED_MARKET_TAGS]

        if count is not None and count < limit:
            limit = count

        try:
            async with httpx.AsyncClient() as client:
                while True:
                    params = {
                        "closed": False,
                        "limit": limit,
                        "offset": offset,
                        "include_chat": False,
                        "include_template": False,
                        "exclude_tag_id": final_excluded_tag_ids,
                        "order": "id",
                        "ascending": False,
                    }
                    response = await client.get(f"{GAMMA_API_HOST}/events", params=params)
                    events = response.json()
                    if not events:
                        break

                    all_events.extend(events)
                    logger.info(f"Fetched {len(events)} events (offset: {offset})...")

                    if count is not None and len(all_events) >= count:
                        break

                    if len(events) < limit:
                        break

                    offset += limit
        except PolyApiException as exc:
            logger.error(f"get_active_events: error fetching events: {exc}")
            logger.error(traceback.format_exc())
            raise exc

        logger.info(f"Finished fetching {len(all_events)} active events")
        return all_events

    async def get_active_markets_by_events(
        self,
        exclude_tag_ids: list[int] | None = None,
        count: int | None = None,
        api_params: dict | None = None,
    ) -> list[Market]:
        limit = 500
        offset = 0
        all_events = []
        final_excluded_tag_ids = []
        if exclude_tag_ids is None or len(exclude_tag_ids) == 0:
            final_excluded_tag_ids = [tag["id"] for tag in BLACKLISTED_MARKET_TAGS]

        if count is not None and count < limit:
            limit = count

        try:
            async with httpx.AsyncClient() as client:
                while True:
                    params = {
                        "closed": False,
                        "limit": limit,
                        "offset": offset,
                        "include_chat": False,
                        "include_template": False,
                        # filter out annoying markets like crypto 15min/1h/...
                        "exclude_tag_id": final_excluded_tag_ids,
                        # order by id - newest first
                        "order": "id",
                        "ascending": False,
                    }
                    if api_params is not None:
                        params.update(api_params)

                    response = await client.get(f"{GAMMA_API_HOST}/events", params=params)
                    events = response.json()
                    if not events:
                        break

                    all_events.extend(events)
                    logger.info(f"Fetched {len(events)} events (offset: {offset})...")

                    if count is not None and len(all_events) >= count:
                        break

                    if len(events) < limit:
                        break

                    offset += limit
        except PolyApiException as exc:
            logger.error(f"get_active_markets_by_events: error fetching markets: {exc}")
            logger.error(traceback.format_exc())
            raise exc

        markets: list[Market] = []

        for event in all_events:
            for market in event["markets"]:
                # Skip closed markets
                if market.get("closed") or market.get("closed") == "true":
                    continue
                parsed = parse_market_from_api(market)
                if parsed is None:
                    continue
                # Double-check closed flag after parsing
                if parsed.closed:
                    continue
                markets.append(parsed)

        logger.info(
            f"Finished fetching {len(all_events)} active events, found {len(markets)} markets"
        )

        return markets

    async def get_market_trades(
        self,
        condition_ids: list[str] | None = None,
        min_amount: int = 100,
        count: int | None = None,
        user: str | None = None,
    ) -> list[Trade]:
        """
        Data API /trades: 75 requests / 10s	(Throttle requests over the maximum configured rate)

        Warning: 429 really fast
        """

        MAX_LIMIT = 500  # API max seems to be 500 even tho docs say 10k
        offset = 0
        all_trades: list[dict] = []
        total_trades = 0

        async with httpx.AsyncClient() as client:
            while True:
                # Respect count cap by shrinking page size when close to target
                page_limit = MAX_LIMIT
                if count is not None and count > 0:
                    remaining = max(0, count - total_trades)
                    if remaining == 0:
                        break
                    page_limit = min(MAX_LIMIT, remaining)

                params = {
                    "limit": page_limit,
                    "offset": offset,
                    "filterType": "CASH",
                    "filterAmount": int(min_amount),
                    # "takerOnly": False,
                }
                if condition_ids:
                    params["market"] = ",".join(condition_ids)  # comma separated list
                if user:
                    params["user"] = user
                response = await client.get(f"{DATA_API_HOST}/trades", params=params)
                trades = response.json()

                if not trades:
                    break

                all_trades.extend(trades)
                total_trades += len(trades)

                if len(trades) < page_limit:
                    break

                offset += page_limit

                await asyncio.sleep(0.2)

        # Trim to requested count if applicable
        if count is not None and count > 0 and len(all_trades) > count:
            all_trades = all_trades[:count]

        # Parse raw API trades into typed TradeSchema objects
        parsed_trades = [t for t in (parse_trade_from_api(t) for t in all_trades) if t is not None]
        return parsed_trades

    async def get_user_activity_trades(
        self,
        user: str,
        *,
        min_amount: float = 0,
        count: int = 500,
        start_ts: int | None = None,
        end_ts: int | None = None,
    ) -> list[Trade]:
        """
        Fetch user trades via the activity endpoint (supports user filtering).
        Falls back to /trades endpoint if activity is unavailable.
        """

        async def _fetch() -> list[Trade]:
            offset = 0
            per_page = min(500, max(1, count))
            max_pages = max(1, (count + per_page - 1) // per_page)
            trades: list[Trade] = []
            reached_start_window = False
            timeout = httpx.Timeout(10.0, read=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                pages_fetched = 0
                while (
                    len(trades) < count and not reached_start_window and pages_fetched < max_pages
                ):
                    remaining = max(0, count - len(trades))
                    if remaining == 0:
                        break
                    page_limit = max(1, min(per_page, remaining))
                    params: dict[str, object] = {
                        "user": user,
                        "limit": page_limit,
                        "offset": offset,
                        "type": "TRADE",
                        # default sorted by timestamp descending
                        # "sort": "TIMESTAMP",
                        # "sortDirection": "DESC",
                    }
                    if min_amount > 0:
                        params["minAmount"] = int(max(1, min_amount))
                    response = await client.get(f"{DATA_API_HOST}/activity", params=params)
                    response.raise_for_status()
                    payload = response.json()
                    entries: list[dict] = []
                    if isinstance(payload, dict) and "activity" in payload:
                        entries = payload.get("activity") or []
                    elif isinstance(payload, list):
                        entries = payload
                    if not entries:
                        break
                    for entry in entries:
                        parsed = parse_activity_trade(entry)
                        if not parsed:
                            continue
                        if min_amount > 0 and (parsed.size * parsed.price) < min_amount:
                            continue
                        if end_ts is not None and parsed.timestamp > end_ts:
                            continue
                        if start_ts is not None and parsed.timestamp < start_ts:
                            reached_start_window = True
                            break
                        trades.append(parsed)
                        if len(trades) >= count:
                            break
                    pages_fetched += 1
                    if reached_start_window:
                        break
                    if len(entries) < page_limit:
                        break
                    offset += page_limit
                    await asyncio.sleep(0.2)
            return trades

        try:
            return await _fetch()
        except Exception as exc:
            logger.warning(
                "Falling back to /trades endpoint for user=%s due to activity error: %s",
                user,
                exc,
            )
            return await self.get_market_trades(
                None,
                min_amount=int(max(1, min_amount)),
                count=count,
                user=user,
            )

    async def get_top_holders(
        self, condition_ids: list[str], min_balance: int = 1
    ) -> list[TopHolder]:
        """
        No pagination. Artificial limit of 20 per YES/NO per market (so total 40 per market).

        `limit` range: 0-500 (not respected, always returns 20/20 by outcome)
        `min_balance` range: 0-999999
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "market": ",".join(condition_ids),
                    # "limit": limit, # limit is ignored, always returns 20/20 by outcome
                    "minBalance": min_balance,
                }
                response = await client.get(f"{DATA_API_HOST}/holders", params=params)
                holders = response.json()

                # this returns an array of both YES and NO, we need to aggregate them into one array
                if len(holders) > 0:
                    combined_holders: list[dict] = holders[0].get("holders", [])
                    combined_holders.extend(holders[1].get("holders", []))
                    parsed_holders = [TopHolder(**h) for h in combined_holders]
                    return parsed_holders

                return []

        except PolyApiException as exc:
            logger.error(f"get_active_markets: error fetching markets: {exc}")
            logger.error(traceback.format_exc())
            raise exc

    async def get_user_positions_top(self, user_id: str, count: int = 100) -> list[UserPosition]:
        """
        Fetch top N user positions from Data API (already sorted), single page.
        """
        limit = max(1, int(count))
        async with httpx.AsyncClient() as client:
            params = {
                "user": user_id,
                "sizeThreshold": 1,
                "sortBy": "CURRENT",
                "sortDirection": "DESC",
                "limit": limit,
                "offset": 0,
            }
            response = await client.get(f"{DATA_API_HOST}/positions", params=params)
            if response.status_code != 200:
                return []
            data = response.json() or []

        parsed: list[UserPosition] = []
        for p in data:
            schema = parse_user_position_from_api(p)
            if schema:
                parsed.append(schema)
        return parsed

    async def get_market_by_slug(self, slug: str) -> Market | None:
        """
        Fetch a market by its slug from Gamma API.

        Official docs: https://docs.polymarket.com/api-reference/markets/get-market-by-slug

        Args:
            slug: The market slug (e.g., "will-trump-win-2024-election")

        Returns:
            MarketSchema if found, None otherwise

        Raises:
            PolyApiException: If API request fails (non-404 errors)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{GAMMA_API_HOST}/markets/slug/{slug}")
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                market_dict = response.json()
                return parse_market_from_api(market_dict)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            logger.error(f"get_market_by_slug: error fetching market by slug={slug}: {exc}")
            logger.error(traceback.format_exc())
            raise PolyApiException(f"Failed to fetch market by slug: {exc}") from exc
        except Exception as exc:
            logger.error(f"get_market_by_slug: unexpected error for slug={slug}: {exc}")
            logger.error(traceback.format_exc())
            raise exc from exc

    async def get_event_by_id(self, event_id: str) -> Event | None:
        """
        Fetch an event by its ID from Gamma API.

        Official docs: https://docs.polymarket.com/api-reference/events/get-event-by-id

        Args:
            event_id: The event ID

        Returns:
            EventSchema if found, None otherwise

        Raises:
            PolyApiException: If API request fails (non-404 errors)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{GAMMA_API_HOST}/events/{event_id}")
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                event_dict = response.json()
                return parse_event_from_api(event_dict)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            logger.error(f"get_event_by_id: error fetching event by id={event_id}: {exc}")
            logger.error(traceback.format_exc())
            raise PolyApiException(f"Failed to fetch event by id: {exc}") from exc
        except Exception as exc:
            logger.error(f"get_event_by_id: unexpected error for id={event_id}: {exc}")
            logger.error(traceback.format_exc())
            raise exc from exc

    async def get_markets_by_condition_ids(self, condition_ids: list[str]) -> list[Market]:
        """
        Fetch multiple markets by their condition IDs from Gamma API.

        Official docs: https://docs.polymarket.com/api-reference/markets/list-markets

        Args:
            condition_ids: List of condition IDs to fetch

        Returns:
            List of MarketSchema objects

        Raises:
            PolyApiException: If API request fails
        """
        if not condition_ids or len(condition_ids) == 0:
            return []

        try:
            async with httpx.AsyncClient() as client:
                params: dict[str, list[str] | int] = {
                    "limit": 100,  # Reasonable limit for watchlist use case
                    "condition_ids": condition_ids,  # httpx will handle multiple query params
                }

                response = await client.get(f"{GAMMA_API_HOST}/markets", params=params)
                response.raise_for_status()
                markets_data = response.json()

                # Parse raw API markets into typed MarketSchema objects
                parsed_markets = [
                    m for m in (parse_market_from_api(m) for m in markets_data) if m is not None
                ]
                return parsed_markets
        except httpx.HTTPStatusError as exc:
            logger.error(f"get_markets_by_condition_ids: error fetching markets: {exc}")
            logger.error(traceback.format_exc())
            raise PolyApiException(f"Failed to fetch markets by condition IDs: {exc}") from exc
        except Exception as exc:
            logger.error(f"get_markets_by_condition_ids: unexpected error: {exc}")
            logger.error(traceback.format_exc())
            raise exc from exc

    async def search_markets(self, query: str) -> SearchResponse:
        """
        Search for markets, events, and profiles using Gamma API public-search endpoint.

        Returns top 10 markets and top 10 events, sorted by volume (descending).
        Only includes active markets and events.
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "q": query,
                    "limit_per_type": 50,
                    "keep_closed_markets": 0,
                    "search_tags": False,
                    "search_profiles": True,
                    # "sort": "volume",
                    "ascending": False,
                }
                response = await client.get(f"{GAMMA_API_HOST}/public-search", params=params)
                response.raise_for_status()
                data = response.json()

                # Extract and process events
                raw_events = data.get("events", []) or []
                active_events = [e for e in raw_events if e.get("active") and not e.get("closed")]

                # Extract markets from events and flatten
                all_markets = []
                for event in active_events:
                    event_markets = event.get("markets", []) or []
                    for market in event_markets:
                        if market.get("active") and not market.get("closed"):
                            # Only include fields that SearchMarketItem expects
                            market_clean = {
                                "id": market.get("id", ""),
                                "question": market.get("question", ""),
                                "conditionId": market.get("conditionId", ""),
                                "slug": market.get("slug", ""),
                                "category": market.get("category"),
                                "liquidity": market.get("liquidity"),
                                "volume": market.get("volume"),
                                "outcomePrices": ",".join(market.get("outcomePrices", [])),
                                "outcomes": ",".join(market.get("outcomes", [])),
                                "active": market.get("active", False),
                                "closed": market.get("closed", False),
                                "icon": market.get("icon"),
                                "image": market.get("image"),
                            }
                            all_markets.append(market_clean)

                # Sort markets by volume (descending) - only events were sorted by volume
                # all_markets.sort(
                #     key=lambda m: float(m.get("volume") or "0") if m.get("volume") else 0,
                #     reverse=True,
                # )

                # Return all sorted results (frontend will handle top 10 and expand/collapse)
                return SearchResponse(
                    events=[SearchEventItem(**e) for e in active_events],
                    markets=[SearchMarketItem(**m) for m in all_markets],
                    tags=data.get("tags"),
                    profiles=data.get("profiles"),
                    pagination=data.get("pagination"),
                )
        except Exception as exc:
            logger.error(f"search_markets: error searching markets: {exc}")
            logger.error(traceback.format_exc())
            raise exc

    async def search_profiles(self, query: str) -> SearchResponse:
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "q": query,
                    "limit_per_type": 50,
                    "keep_closed_markets": 0,
                    "search_tags": False,
                    "search_profiles": True,
                }
                response = await client.get(f"{GAMMA_API_HOST}/public-search", params=params)
                response.raise_for_status()
                data = response.json()

                # Extract only profiles
                profiles = data.get("profiles", []) or []
                parsed_profiles = [SearchProfileItem(**p) for p in profiles]

                return SearchResponse(profiles=parsed_profiles)
        except Exception as exc:
            logger.error(f"search_profiles: error searching profiles: {exc}")
            logger.error(traceback.format_exc())
            raise exc

    async def get_public_profile(self, address: str) -> UserPublicProfile | None:
        try:
            async with httpx.AsyncClient() as client:
                params = {"address": address}
                response = await client.get(f"{GAMMA_API_HOST}/public-profile", params=params)
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                data = response.json()
                return UserPublicProfile(**data)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            logger.error(f"get_public_profile: error fetching profile for address={address}: {exc}")
            logger.error(traceback.format_exc())
            raise PolyApiException(f"Failed to fetch public profile: {exc}") from exc
        except Exception as exc:
            logger.error(f"get_public_profile: unexpected error for address={address}: {exc}")
            logger.error(traceback.format_exc())
            raise exc from exc
