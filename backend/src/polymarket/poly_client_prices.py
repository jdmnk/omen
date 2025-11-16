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


class PriceHistoryPoint(TypedDict):
    t: int  # UTC timestamp (seconds)
    p: float  # price


class PriceHistoryApiResponse(TypedDict, total=False):
    history: list[PriceHistoryPoint]


class PolyClientPrices:
    USER_PNL_HOST = "https://user-pnl-api.polymarket.com"

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

    async def get_price_history_for_token(
        self,
        token_id: str,
        *,
        start_ts: int | None = None,
        end_ts: int | None = None,
        interval: Literal["1m", "1h", "6h", "1d", "1w", "max"] = "1m",
        fidelity: int = 60,
    ) -> PriceHistoryApiResponse:
        """
        Fetch historical price data for a specific CLOB token via GET /prices-history.

        Docs: https://docs.polymarket.com/api-reference/pricing/get-price-history-for-a-traded-token

        Args:
            token_id: The CLOB token ID (aka market token id)
            start_ts: Optional start timestamp (UTC seconds)
            end_ts: Optional end timestamp (UTC seconds)
            interval: Bucket interval when start/end are not provided (default: "1m")
            fidelity: Resolution of data in minutes (default: 60)
        """
        params: dict[str, str | int] = {"market": token_id}
        # interval is mutually exclusive with startTs/endTs
        if start_ts is not None or end_ts is not None:
            if start_ts is not None:
                params["startTs"] = int(start_ts)
            if end_ts is not None:
                params["endTs"] = int(end_ts)
        else:
            params["interval"] = interval
        params["fidelity"] = int(fidelity)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{CLOB_HOST}/prices-history", params=params)
                if response.status_code != 200:
                    logger.error(
                        f"get_price_history_for_token: non-200 status {response.status_code}: {response.text}"
                    )
                    return {"history": []}
                data: PriceHistoryApiResponse = response.json() or {"history": []}
                # Normalize shape if API returns empty object
                if "history" not in data or data["history"] is None:
                    data["history"] = []
                return data
        except PolyApiException as exc:
            logger.error(f"get_price_history_for_token: error: {exc}")
            logger.error(traceback.format_exc())
            raise exc

    async def get_user_pnl_points(
        self,
        user_address: str,
        *,
        interval: Literal["12h", "1d", "1w", "1m", "max"] = "1m",
        fidelity: str | None = None,
    ) -> list[PriceHistoryPoint]:
        """
        Fetch user's PnL time series from Polymarket's user PnL API.
        Defaults to last month with 12h fidelity to match frontend.
        """
        fidelity_map: dict[str, str] = {
            "12h": "1h",
            "1d": "1h",
            "1w": "3h",
            "1m": "12h",
            "max": "1d",
        }
        final_fidelity = fidelity or fidelity_map.get(interval, "12h")
        params = {
            "user_address": user_address,
            "interval": interval,
            "fidelity": final_fidelity,
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.USER_PNL_HOST}/user-pnl", params=params)
                if response.status_code != 200:
                    logger.error(
                        f"get_user_pnl_points: non-200 status {response.status_code}: {response.text}"
                    )
                    return []
                data: list[PriceHistoryPoint] = response.json() or []
                # Basic normalization: sort asc and drop exact duplicate timestamps
                data.sort(key=lambda d: d.get("t", 0))
                deduped: list[PriceHistoryPoint] = []
                last_t: int | None = None
                for pt in data:
                    t = int(pt.get("t", 0))
                    if last_t is None or t != last_t:
                        deduped.append({"t": t, "p": float(pt.get("p", 0))})
                        last_t = t
                    else:
                        # replace previous point at same timestamp
                        deduped[-1] = {"t": t, "p": float(pt.get("p", 0))}
                return deduped
        except PolyApiException as exc:
            logger.error(f"get_user_pnl_points: error: {exc}")
            logger.error(traceback.format_exc())
            raise exc
