from __future__ import annotations

import pytest

from src.polymarket import poly_client as poly_client_module
from src.polymarket.api_config import DATA_API_HOST, GAMMA_API_HOST
from src.polymarket.poly_client import PolyClient

pytestmark = pytest.mark.asyncio


class FakeResponse:
    def __init__(self, payload, status_code: int = 200):
        self.payload = payload
        self.status_code = status_code

    def json(self):
        return self.payload

    def raise_for_status(self):
        return None


class FakeAsyncClient:
    def __init__(self, responses: list[FakeResponse]):
        self.responses = responses
        self.gets: list[tuple[str, dict | None]] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def get(self, url: str, params: dict | None = None):
        self.gets.append((url, params))
        return self.responses.pop(0)


def market_payload(
    *,
    condition_id: str = "condition-1",
    slug: str = "market-1",
    closed: bool = False,
) -> dict:
    return {
        "conditionId": condition_id,
        "question": "Will it happen?",
        "questionID": "question-1",
        "marketMakerAddress": "0xmaker",
        "submitted_by": "0xsubmitter",
        "icon": "icon.png",
        "image": "image.png",
        "outcomes": '["Yes","No"]',
        "outcomePrices": '["0.40","0.60"]',
        "slug": slug,
        "clobTokenIds": '["token-yes","token-no"]',
        "description": "Description",
        "liquidityNum": "10",
        "volumeNum": "20",
        "volume24hr": 1,
        "volume1wk": 2,
        "volume1mo": 3,
        "volume1yr": 4,
        "negRisk": False,
        "bestBid": 0.4,
        "bestAsk": 0.6,
        "endDate": "2026-12-31T00:00:00Z",
        "active": not closed,
        "closed": closed,
        "groupItemTitle": "",
        "resolutionSource": "",
        "events": [],
    }


async def test_get_active_events_uses_keyset_pagination(monkeypatch):
    fake_client = FakeAsyncClient(
        [
            FakeResponse(
                {
                    "events": [{"id": "event-1"}, {"id": "event-2"}],
                    "next_cursor": "cursor-2",
                }
            ),
            FakeResponse({"events": [{"id": "event-3"}]}),
        ]
    )
    monkeypatch.setattr(poly_client_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClient().get_active_events(count=3)

    assert [event["id"] for event in result] == ["event-1", "event-2", "event-3"]
    assert fake_client.gets[0][0] == f"{GAMMA_API_HOST}/events/keyset"
    assert fake_client.gets[1][1]["after_cursor"] == "cursor-2"
    assert "offset" not in fake_client.gets[0][1]


async def test_get_active_markets_by_events_uses_keyset_and_filters_closed(monkeypatch):
    fake_client = FakeAsyncClient(
        [
            FakeResponse(
                {
                    "events": [
                        {
                            "id": "event-1",
                            "markets": [
                                market_payload(condition_id="open-market"),
                                market_payload(condition_id="closed-market", closed=True),
                            ],
                        }
                    ]
                }
            )
        ]
    )
    monkeypatch.setattr(poly_client_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClient().get_active_markets_by_events(count=1)

    assert [market.conditionId for market in result] == ["open-market"]
    assert fake_client.gets[0][0] == f"{GAMMA_API_HOST}/events/keyset"
    assert "offset" not in fake_client.gets[0][1]


async def test_get_markets_by_condition_ids_uses_markets_keyset(monkeypatch):
    fake_client = FakeAsyncClient(
        [FakeResponse({"markets": [market_payload(condition_id="condition-1")]})]
    )
    monkeypatch.setattr(poly_client_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClient().get_markets_by_condition_ids(["condition-1"])

    assert [market.conditionId for market in result] == ["condition-1"]
    assert fake_client.gets[0][0] == f"{GAMMA_API_HOST}/markets/keyset"
    assert fake_client.gets[0][1]["condition_ids"] == ["condition-1"]
    assert "offset" not in fake_client.gets[0][1]


async def test_get_top_holders_flattens_available_outcome_buckets(monkeypatch):
    fake_client = FakeAsyncClient(
        [
            FakeResponse(
                [
                    {
                        "holders": [
                            {
                                "proxyWallet": "0xabc",
                                "asset": "token-1",
                                "amount": 12.5,
                                "displayUsernamePublic": True,
                                "outcomeIndex": 0,
                            }
                        ]
                    }
                ]
            )
        ]
    )
    monkeypatch.setattr(poly_client_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClient().get_top_holders(["condition-1"], min_balance=5)

    assert len(result) == 1
    assert result[0].proxyWallet == "0xabc"
    assert fake_client.gets[0][0] == f"{DATA_API_HOST}/holders"
    assert fake_client.gets[0][1] == {"market": "condition-1", "minBalance": 5}
