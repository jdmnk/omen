import traceback
from typing import Literal, TypedDict

import httpx
from py_clob_client.exceptions import PolyApiException

from src.polymarket.poly_client import CLOB_HOST
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class PriceRequest(TypedDict):
    token_id: str
    side: Literal["BUY", "SELL"]


class BookRequest(TypedDict):
    token_id: str


class OrderBookLevel(TypedDict):
    price: str
    size: str


class OrderBookSummaryResponse(TypedDict, total=False):
    market: str
    asset_id: str
    timestamp: str
    hash: str
    bids: list[OrderBookLevel]
    asks: list[OrderBookLevel]
    min_order_size: str
    tick_size: str
    neg_risk: bool


class PolyClientPrices:
    async def get_market_prices_by_request(
        self, requests: list[PriceRequest]
    ) -> dict[str, dict[str, str]]:
        """
        Fetch multiple market prices via CLOB POST /prices.

        Docs: https://docs.polymarket.com/api-reference/pricing/get-multiple-market-prices-by-request
        """
        if not requests:
            return {}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{CLOB_HOST}/prices",
                    json=requests,
                    headers={"Content-Type": "application/json"},
                )
                if response.status_code != 200:
                    logger.error(
                        f"get_market_prices_by_request: non-200 status {response.status_code}: {response.text}"
                    )
                    return {}
                data: dict[str, dict[str, str]] = response.json() or {}
                return data
        except PolyApiException as exc:
            logger.error(f"get_market_prices_by_request: error: {exc}")
            logger.error(traceback.format_exc())
            raise exc

    async def get_order_books_by_request(
        self, requests: list[BookRequest]
    ) -> list[OrderBookSummaryResponse]:
        """
        Fetch multiple order book summaries via CLOB POST /books.

        Docs: https://docs.polymarket.com/api-reference/orderbook/get-multiple-order-books-summaries-by-request
        """
        if not requests:
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{CLOB_HOST}/books",
                    json=requests,
                    headers={"Content-Type": "application/json"},
                )
                if response.status_code != 200:
                    logger.error(
                        f"get_order_books_by_request: non-200 status {response.status_code}: {response.text}"
                    )
                    return []
                data: list[OrderBookSummaryResponse] = response.json() or []
                return data
        except PolyApiException as exc:
            logger.error(f"get_order_books_by_request: error: {exc}")
            logger.error(traceback.format_exc())
            raise exc
