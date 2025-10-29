import string
import traceback

import httpx
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderBookSummary
from py_clob_client.constants import POLYGON
from py_clob_client.exceptions import PolyApiException

from src.models.position import PositionSchema, parse_position_from_api
from src.models.trade import TradeSchema, parse_trade_from_api
from src.settings import settings
from src.utils.logging_config import get_logger
from src.utils.usdc import to_usdc

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
        self.clob_client = self.get_clob_client()

    def get_clob_client(self) -> ClobClient:
        client = ClobClient(CLOB_HOST, key=settings.polymarket_private_key, chain_id=POLYGON)
        api_creds = client.create_or_derive_api_creds()
        client.set_api_creds(api_creds)
        return client

    async def get_active_markets_by_events(
        self, exclude_tag_ids: list[int] | None = None, count: int | None = None
    ) -> list[dict]:
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

        markets = []

        for event in all_events:
            for market in event["markets"]:
                if market["closed"] or market["closed"] == "true":
                    print("found a closed market in open event: ", market["question"])
                    continue
                markets.append(market)

        logger.info(
            f"Finished fetching {len(all_events)} active events, found {len(markets)} markets"
        )

        return markets

    def get_market_order_book(self, token_id: str) -> OrderBookSummary | None:
        try:
            order_book = self.clob_client.get_order_book(token_id)
            return order_book
        except PolyApiException as exc:
            if exc.status_code == 404:
                logger.error(
                    f"get_market_order_book: order book does not exist for token_id={token_id}"
                )
                return None
            else:
                logger.error(
                    f"get_market_order_book: error fetching order book for token_id={token_id}: {exc}"
                )
                logger.error(traceback.format_exc())
                raise exc

    async def get_market_trades(
        self, condition_ids: list[str], count: int | None = None
    ) -> list[TradeSchema]:
        """
        Data API /trades: 75 requests / 10s	(Throttle requests over the maximum configured rate)

        Warning: 429 really fast
        """

        limit = 500
        offset = 0
        all_trades: list[dict] = []
        total_trades = 0

        async with httpx.AsyncClient() as client:
            while True:
                params = {
                    "market": ",".join(condition_ids),  # comma separated list
                    "limit": limit,
                    "offset": offset,
                }
                response = await client.get(f"{DATA_API_HOST}/trades", params=params)
                trades = response.json()

                if not trades:
                    break

                all_trades.extend(trades)
                total_trades += len(trades)

                if len(trades) < limit:
                    break

                offset += limit

        # Parse raw API trades into typed TradeSchema objects
        parsed_trades = [t for t in (parse_trade_from_api(t) for t in all_trades) if t is not None]
        return parsed_trades

    async def get_top_holders(
        self, condition_ids: list[string], min_balance: int = 1, limit: int = 500
    ) -> list[dict]:
        """
        No pagination. Artificial limit of 20 per YES/NO per market (so total 40 per market).

        `limit` range: 0-500
        `min_balance` range: 0-999999
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "market": ",".join(condition_ids),
                    "limit": limit,
                    "minBalance": min_balance,
                }
                response = await client.get(f"{DATA_API_HOST}/holders", params=params)
                holders = response.json()

                # this returns an array of both YES and NO, we need to aggregate them into one array
                if len(holders) > 0:
                    combined_holders: list[dict] = holders[0].get("holders", [])
                    combined_holders.extend(holders[1].get("holders", []))
                    return combined_holders

                return []

        except PolyApiException as exc:
            logger.error(f"get_active_markets: error fetching markets: {exc}")
            logger.error(traceback.format_exc())
            raise exc

    async def get_market_positions(
        self, token_ids: list[str], min_amount: int = 0
    ) -> list[PositionSchema]:
        """
        Goldsky GraphQL api.

        Token IDs are the CLob token IDs (YES and NO).

        Sorted by amount desc.
        """

        query = """
        query GetMarketHolders($first: Int!, $skip: Int!, $tokenIds: [BigInt!]!, $minAmount: BigInt!) {
            userPositions(
                first: $first
                skip: $skip
                orderBy: amount
                orderDirection: desc
                where: {
                    tokenId_in: $tokenIds
                    amount_gt: $minAmount
                }
            ) {
                id
                realizedPnl
                user
                tokenId
                amount
                avgPrice
                totalBought
            }
        }
        """

        variables = {
            "first": 1000,
            "skip": 0,
            "tokenIds": token_ids,
            "minAmount": to_usdc(min_amount),  # for the smart contract
        }

        payload = {"query": query, "variables": variables, "operationName": "GetMarketHolders"}

        async with httpx.AsyncClient() as client:
            response = await client.post(GOLDSKY_API_HOST + GOLDSKY_API_PNL_SUBGRAPH, json=payload)
            data = response.json()
            user_positions = data.get("data", {}).get("userPositions", [])
            parsed_positions: list[PositionSchema] = [
                parse_position_from_api(position) for position in user_positions
            ]

            # sort by total amount desc (amount * avg price)
            parsed_positions.sort(key=lambda x: x.amount * x.avgPrice, reverse=True)

            return parsed_positions
