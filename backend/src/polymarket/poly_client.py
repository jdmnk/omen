import asyncio
import traceback

import httpx

from src.models.activity import parse_activity_trade
from src.models.event import Event, parse_event_from_api
from src.models.market import Market, parse_market_from_api
from src.models.search import SearchEventItem, SearchMarketItem, SearchProfileItem, SearchResponse
from src.models.top_holders import TopHolder
from src.models.trade import Trade, parse_trade_from_api
from src.models.user_position import UserPosition, parse_user_position_from_api
from src.models.user_profile import UserPublicProfile
from src.polymarket.api_config import DATA_API_HOST, GAMMA_API_HOST, PolymarketApiError
from src.utils.logging_config import get_logger

logger = get_logger(__name__)

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


def parse_search_profiles(raw_profiles: list | None) -> list[SearchProfileItem]:
    profiles: list[SearchProfileItem] = []
    for raw_profile in raw_profiles or []:
        if not isinstance(raw_profile, dict):
            logger.debug("Skipping invalid search profile payload: %r", raw_profile)
            continue

        try:
            profiles.append(SearchProfileItem(**raw_profile))
        except Exception as exc:
            logger.debug("Skipping malformed search profile payload: %s", exc)

    return profiles


def parse_search_market(raw_market: dict) -> SearchMarketItem | None:
    try:
        market_clean = {
            "id": raw_market.get("id", ""),
            "question": raw_market.get("question", ""),
            "conditionId": raw_market.get("conditionId", ""),
            "slug": raw_market.get("slug", ""),
            "category": raw_market.get("category"),
            "liquidity": raw_market.get("liquidity"),
            "volume": raw_market.get("volume"),
            "outcomePrices": ",".join(raw_market.get("outcomePrices", []))
            if isinstance(raw_market.get("outcomePrices"), list)
            else raw_market.get("outcomePrices"),
            "outcomes": ",".join(raw_market.get("outcomes", []))
            if isinstance(raw_market.get("outcomes"), list)
            else raw_market.get("outcomes"),
            "active": raw_market.get("active", False),
            "closed": raw_market.get("closed", False),
            "icon": raw_market.get("icon"),
            "image": raw_market.get("image"),
        }
        return SearchMarketItem(**market_clean)
    except Exception as exc:
        logger.debug("Skipping malformed search market payload: %s", exc)
        return None


def parse_search_events(raw_events: list) -> list[SearchEventItem]:
    parsed_events: list[SearchEventItem] = []
    for raw_event in raw_events:
        if not isinstance(raw_event, dict):
            continue

        event_payload = dict(raw_event)
        event_payload["markets"] = [
            market
            for market in (
                parse_search_market(raw_market)
                for raw_market in (raw_event.get("markets", []) or [])
                if isinstance(raw_market, dict)
            )
            if market is not None
        ]

        try:
            parsed_events.append(SearchEventItem(**event_payload))
        except Exception as exc:
            logger.debug("Skipping malformed search event payload: %s", exc)

    return parsed_events


class PolyClient:
    """
    General rate limiting: 5000req / 10s
    Data API (General)	200 requests / 10s	(Throttle requests over the maximum configured rate)
    """

    async def get_active_events(
        self, exclude_tag_ids: list[int] | None = None, count: int | None = None
    ) -> list[dict]:
        """
        Fetch active events from Gamma API, mirroring params used by get_active_markets_by_events,
        but return the raw events payload (including markets) instead of flattening to markets.
        """
        limit = 500
        after_cursor: str | None = None
        all_events: list[dict] = []
        final_excluded_tag_ids: list[int] = []
        if count is not None and count <= 0:
            return []
        if exclude_tag_ids is None or len(exclude_tag_ids) == 0:
            final_excluded_tag_ids = [tag["id"] for tag in BLACKLISTED_MARKET_TAGS]

        if count is not None and count < limit:
            limit = count

        try:
            async with httpx.AsyncClient() as client:
                while True:
                    params: dict[str, object] = {
                        "closed": False,
                        "limit": limit,
                        "include_chat": False,
                        "include_template": False,
                        "exclude_tag_id": final_excluded_tag_ids,
                        "order": "id",
                        "ascending": False,
                    }
                    if after_cursor:
                        params["after_cursor"] = after_cursor

                    response = await client.get(f"{GAMMA_API_HOST}/events/keyset", params=params)
                    data = response.json()
                    events = data.get("events", []) if isinstance(data, dict) else data
                    if not events:
                        break

                    all_events.extend(events)
                    logger.info(f"Fetched {len(events)} events...")

                    if count is not None and len(all_events) >= count:
                        break

                    after_cursor = data.get("next_cursor") if isinstance(data, dict) else None
                    if not after_cursor:
                        break
        except httpx.HTTPError as exc:
            logger.error(f"get_active_events: error fetching events: {exc}")
            logger.error(traceback.format_exc())
            raise PolymarketApiError(f"Failed to fetch active events: {exc}") from exc

        if count is not None and len(all_events) > count:
            all_events = all_events[:count]

        logger.info(f"Finished fetching {len(all_events)} active events")
        return all_events

    async def get_active_markets_by_events(
        self,
        exclude_tag_ids: list[int] | None = None,
        count: int | None = None,
        api_params: dict | None = None,
    ) -> list[Market]:
        limit = 250
        after_cursor: str | None = None
        all_events = []
        final_excluded_tag_ids = []
        if count is not None and count <= 0:
            return []
        if exclude_tag_ids is None or len(exclude_tag_ids) == 0:
            final_excluded_tag_ids = [tag["id"] for tag in BLACKLISTED_MARKET_TAGS]

        if count is not None and count < limit:
            limit = count

        try:
            async with httpx.AsyncClient() as client:
                while True:
                    params: dict[str, object] = {
                        "closed": False,
                        "limit": limit,
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
                    if after_cursor:
                        params["after_cursor"] = after_cursor

                    response = await client.get(f"{GAMMA_API_HOST}/events/keyset", params=params)
                    data = response.json()
                    events = data.get("events", []) if isinstance(data, dict) else data
                    if not events:
                        break

                    all_events.extend(events)
                    logger.info(f"Fetched {len(events)} events...")

                    if count is not None and len(all_events) >= count:
                        break

                    after_cursor = data.get("next_cursor") if isinstance(data, dict) else None
                    if not after_cursor:
                        break
        except httpx.HTTPError as exc:
            logger.error(f"get_active_markets_by_events: error fetching markets: {exc}")
            logger.error(traceback.format_exc())
            raise PolymarketApiError(f"Failed to fetch active markets: {exc}") from exc

        if count is not None and len(all_events) > count:
            all_events = all_events[:count]

        markets: list[Market] = []

        for event in all_events:
            if not isinstance(event, dict):
                continue
            for market in event.get("markets", []) or []:
                if not isinstance(market, dict):
                    continue
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
                    combined_holders: list[dict] = []
                    for outcome_holders in holders:
                        combined_holders.extend(outcome_holders.get("holders", []))
                    parsed_holders = [TopHolder(**h) for h in combined_holders]
                    return parsed_holders

                return []

        except httpx.HTTPError as exc:
            logger.error(f"get_active_markets: error fetching markets: {exc}")
            logger.error(traceback.format_exc())
            raise PolymarketApiError(f"Failed to fetch top holders: {exc}") from exc

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
            PolymarketApiError: If API request fails (non-404 errors)
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
            raise PolymarketApiError(f"Failed to fetch market by slug: {exc}") from exc
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
            PolymarketApiError: If API request fails (non-404 errors)
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
            raise PolymarketApiError(f"Failed to fetch event by id: {exc}") from exc
        except Exception as exc:
            logger.error(f"get_event_by_id: unexpected error for id={event_id}: {exc}")
            logger.error(traceback.format_exc())
            raise exc from exc

    async def get_markets_by_condition_ids(self, condition_ids: list[str]) -> list[Market]:
        """
        Fetch multiple markets by their condition IDs from Gamma API.

        Official docs: https://docs.polymarket.com/api-reference/markets/list-markets-keyset-pagination

        Args:
            condition_ids: List of condition IDs to fetch

        Returns:
            List of MarketSchema objects

        Raises:
            PolymarketApiError: If API request fails
        """
        if not condition_ids or len(condition_ids) == 0:
            return []

        try:
            async with httpx.AsyncClient() as client:
                after_cursor: str | None = None
                markets_data: list[dict] = []

                while True:
                    params: dict[str, object] = {
                        "limit": 100,
                        "condition_ids": condition_ids,
                    }
                    if after_cursor:
                        params["after_cursor"] = after_cursor

                    response = await client.get(f"{GAMMA_API_HOST}/markets/keyset", params=params)
                    response.raise_for_status()
                    data = response.json()
                    page_markets = data.get("markets", []) if isinstance(data, dict) else data
                    if not page_markets:
                        break

                    markets_data.extend(page_markets)
                    after_cursor = data.get("next_cursor") if isinstance(data, dict) else None
                    if not after_cursor:
                        break

                # Parse raw API markets into typed MarketSchema objects
                parsed_markets = [
                    m for m in (parse_market_from_api(m) for m in markets_data) if m is not None
                ]
                return parsed_markets
        except httpx.HTTPStatusError as exc:
            logger.error(f"get_markets_by_condition_ids: error fetching markets: {exc}")
            logger.error(traceback.format_exc())
            raise PolymarketApiError(f"Failed to fetch markets by condition IDs: {exc}") from exc
        except Exception as exc:
            logger.error(f"get_markets_by_condition_ids: unexpected error: {exc}")
            logger.error(traceback.format_exc())
            raise exc from exc

    async def search_markets(self, query: str) -> SearchResponse:
        """
        Search for markets, events, and profiles using Gamma API public-search endpoint.

        Returns top 10 markets and top 10 events, sorted by volume (descending).
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

                # Extract markets from events and flatten
                all_markets = []
                for event in raw_events:
                    if not isinstance(event, dict):
                        continue
                    event_markets = event.get("markets", []) or []
                    for market in event_markets:
                        if not isinstance(market, dict):
                            continue
                        parsed_market = parse_search_market(market)
                        if parsed_market is not None:
                            all_markets.append(parsed_market)

                # Sort markets by volume (descending) - only events were sorted by volume
                # all_markets.sort(
                #     key=lambda m: float(m.get("volume") or "0") if m.get("volume") else 0,
                #     reverse=True,
                # )

                # Return all sorted results (frontend will handle top 10 and expand/collapse)
                return SearchResponse(
                    events=parse_search_events(raw_events),
                    markets=all_markets,
                    tags=data.get("tags"),
                    profiles=parse_search_profiles(data.get("profiles")),
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
                return SearchResponse(profiles=parse_search_profiles(data.get("profiles")))
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
            raise PolymarketApiError(f"Failed to fetch public profile: {exc}") from exc
        except Exception as exc:
            logger.error(f"get_public_profile: unexpected error for address={address}: {exc}")
            logger.error(traceback.format_exc())
            raise exc from exc
