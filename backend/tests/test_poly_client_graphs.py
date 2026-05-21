from __future__ import annotations

import pytest

from src.polymarket import poly_client_graphs as graphs_module
from src.polymarket.api_config import (
    GOLDSKY_API_HOST,
    GOLDSKY_API_PNL_SUBGRAPH,
    GOLDSKY_API_WALLET_SUBGRAPH,
)
from src.polymarket.poly_client_graphs import PolyClientGraphs

pytestmark = pytest.mark.asyncio


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def json(self):
        return self.payload


class FakeAsyncClient:
    def __init__(self, response: FakeResponse):
        self.response = response
        self.posts: list[tuple[str, dict]] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def post(self, url: str, json: dict):
        self.posts.append((url, json))
        return self.response


def position_payload(
    *,
    position_id: str = "position-1",
    amount: str = "2000000",
    avg_price: str = "500000",
):
    return {
        "id": position_id,
        "realizedPnl": "100000",
        "user": "0xabc",
        "tokenId": "token-1",
        "amount": amount,
        "avgPrice": avg_price,
        "totalBought": "1000000",
    }


async def test_get_market_positions_posts_to_goldsky_and_filters_bad_rows(monkeypatch):
    fake_client = FakeAsyncClient(
        FakeResponse(
            {
                "data": {
                    "userPositions": [
                        position_payload(position_id="smaller", amount="1000000"),
                        {"user": "missing-id"},
                        position_payload(position_id="larger", amount="3000000"),
                    ]
                }
            }
        )
    )
    monkeypatch.setattr(graphs_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClientGraphs().get_market_positions(["token-1"], min_amount=2)

    assert [position.id for position in result] == ["larger", "smaller"]
    assert fake_client.posts[0][0] == GOLDSKY_API_HOST + GOLDSKY_API_PNL_SUBGRAPH
    assert fake_client.posts[0][1]["operationName"] == "GetMarketHolders"
    assert fake_client.posts[0][1]["variables"]["tokenIds"] == ["token-1"]
    assert fake_client.posts[0][1]["variables"]["minAmount"] == "2000000"


async def test_get_user_positions_posts_expected_filters(monkeypatch):
    fake_client = FakeAsyncClient(
        FakeResponse({"data": {"userPositions": [position_payload(), {"id": None}]}})
    )
    monkeypatch.setattr(graphs_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClientGraphs().get_user_positions(["0xabc"], ["token-1"])

    assert len(result) == 1
    assert fake_client.posts[0][0] == GOLDSKY_API_HOST + GOLDSKY_API_PNL_SUBGRAPH
    assert fake_client.posts[0][1]["operationName"] == "GetUserPositions"
    assert fake_client.posts[0][1]["variables"]["userIds"] == ["0xabc"]
    assert fake_client.posts[0][1]["variables"]["tokenIds"] == ["token-1"]


async def test_get_wallets_info_posts_to_wallet_subgraph(monkeypatch):
    fake_client = FakeAsyncClient(
        FakeResponse(
            {
                "data": {
                    "wallets": [
                        {
                            "id": "0xabc",
                            "signer": "0xsigner",
                            "type": "proxy",
                            "balance": "2500000",
                            "lastTransfer": "1710000000",
                            "createdAt": "1700000000",
                        },
                        {"signer": "missing-id"},
                    ]
                }
            }
        )
    )
    monkeypatch.setattr(graphs_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClientGraphs().get_wallets_info(["0xabc"])

    assert len(result) == 1
    assert result[0].id == "0xabc"
    assert result[0].balance == 2.5
    assert fake_client.posts[0][0] == GOLDSKY_API_HOST + GOLDSKY_API_WALLET_SUBGRAPH
    assert fake_client.posts[0][1]["operationName"] == "GetWalletsInfo"
    assert fake_client.posts[0][1]["variables"]["walletIds"] == ["0xabc"]
