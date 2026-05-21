from __future__ import annotations

import pytest

from src.polymarket import poly_client_prices as prices_module
from src.polymarket.api_config import CLOB_API_HOST, USER_PNL_API_HOST
from src.polymarket.poly_client_prices import PolyClientPrices

pytestmark = pytest.mark.asyncio


class FakeResponse:
    def __init__(self, payload, status_code: int = 200, text: str = ""):
        self.payload = payload
        self.status_code = status_code
        self.text = text

    def json(self):
        return self.payload

    def raise_for_status(self):
        return None


class FakeAsyncClient:
    def __init__(self, response: FakeResponse):
        self.response = response
        self.posts: list[tuple[str, object, dict | None]] = []
        self.gets: list[tuple[str, dict | None]] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def post(self, url: str, json=None, headers: dict | None = None):
        self.posts.append((url, json, headers))
        return self.response

    async def get(self, url: str, params: dict | None = None):
        self.gets.append((url, params))
        return self.response


async def test_get_market_prices_posts_to_public_clob_prices(monkeypatch):
    fake_client = FakeAsyncClient(FakeResponse({"token-1": {"BUY": "0.5"}}))
    monkeypatch.setattr(prices_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClientPrices().get_market_prices_by_request(
        [{"token_id": "token-1", "side": "BUY"}]
    )

    assert result == {"token-1": {"BUY": "0.5"}}
    assert fake_client.posts == [
        (
            f"{CLOB_API_HOST}/prices",
            [{"token_id": "token-1", "side": "BUY"}],
            {"Content-Type": "application/json"},
        )
    ]


async def test_get_order_books_posts_to_public_clob_books(monkeypatch):
    fake_client = FakeAsyncClient(FakeResponse([{"market": "condition-1"}]))
    monkeypatch.setattr(prices_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClientPrices().get_order_books_by_request([{"token_id": "token-1"}])

    assert result == [{"market": "condition-1"}]
    assert fake_client.posts[0][0] == f"{CLOB_API_HOST}/books"
    assert fake_client.posts[0][1] == [{"token_id": "token-1"}]


async def test_get_price_history_builds_expected_params(monkeypatch):
    fake_client = FakeAsyncClient(FakeResponse({"history": [{"t": 1, "p": 0.5}]}))
    monkeypatch.setattr(prices_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClientPrices().get_price_history_for_token("token-1", interval="1h")

    assert result == {"history": [{"t": 1, "p": 0.5}]}
    assert fake_client.gets == [
        (f"{CLOB_API_HOST}/prices-history", {"market": "token-1", "interval": "1h", "fidelity": 60})
    ]


async def test_get_user_pnl_points_sorts_and_dedupes(monkeypatch):
    fake_client = FakeAsyncClient(
        FakeResponse(
            [
                {"t": 2, "p": 0.2},
                {"t": 1, "p": 0.1},
                {"t": 2, "p": 0.3},
            ]
        )
    )
    monkeypatch.setattr(prices_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClientPrices().get_user_pnl_points("0xabc")

    assert result == [{"t": 1, "p": 0.1}, {"t": 2, "p": 0.3}]
    assert fake_client.gets[0][0] == f"{USER_PNL_API_HOST}/user-pnl"
