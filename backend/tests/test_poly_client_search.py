from __future__ import annotations

import pytest

from src.polymarket import poly_client as poly_client_module
from src.polymarket.api_config import GAMMA_API_HOST
from src.polymarket.poly_client import PolyClient, parse_search_profiles


class FakeResponse:
    def __init__(self, payload, status_code: int = 200):
        self.payload = payload
        self.status_code = status_code

    def json(self):
        return self.payload

    def raise_for_status(self):
        return None


class FakeAsyncClient:
    def __init__(self, response: FakeResponse):
        self.response = response
        self.requests: list[tuple[str, dict | None]] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def get(self, url: str, params: dict | None = None):
        self.requests.append((url, params))
        return self.response


def test_parse_search_profiles_skips_null_and_malformed_profiles():
    profiles = parse_search_profiles(
        [
            {"name": "Valid", "proxyWallet": "0xabc", "displayUsernamePublic": True},
            None,
            {"name": "Missing wallet", "displayUsernamePublic": True},
        ]
    )

    assert len(profiles) == 1
    assert profiles[0].name == "Valid"
    assert profiles[0].proxyWallet == "0xabc"


@pytest.mark.asyncio
async def test_search_markets_filters_invalid_profiles_and_flattens_event_markets(monkeypatch):
    fake_client = FakeAsyncClient(
        FakeResponse(
            {
                "events": [
                    {
                        "id": "event-1",
                        "ticker": "CAR",
                        "slug": "car-event",
                        "title": "Car event",
                        "active": True,
                        "closed": False,
                        "markets": [
                            {
                                "id": "market-1",
                                "question": "Will it happen?",
                                "conditionId": "condition-1",
                                "slug": "will-it-happen",
                                "outcomePrices": ["0.25", "0.75"],
                                "outcomes": ["Yes", "No"],
                                "active": True,
                                "closed": False,
                            }
                        ],
                    }
                ],
                "profiles": [
                    {"name": "Valid", "proxyWallet": "0xabc", "displayUsernamePublic": True},
                    None,
                ],
                "tags": [{"id": "tag-1"}],
                "pagination": {"hasMore": False},
            }
        )
    )
    monkeypatch.setattr(poly_client_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClient().search_markets("car")

    assert fake_client.requests[0][0] == f"{GAMMA_API_HOST}/public-search"
    assert fake_client.requests[0][1]["q"] == "car"
    assert len(result.profiles or []) == 1
    assert len(result.events or []) == 1
    assert len(result.markets or []) == 1
    assert result.markets[0].outcomes == "Yes,No"


@pytest.mark.asyncio
async def test_search_profiles_filters_invalid_profiles(monkeypatch):
    fake_client = FakeAsyncClient(
        FakeResponse(
            {
                "profiles": [
                    None,
                    {"name": "Valid", "proxyWallet": "0xdef", "displayUsernamePublic": False},
                ]
            }
        )
    )
    monkeypatch.setattr(poly_client_module.httpx, "AsyncClient", lambda: fake_client)

    result = await PolyClient().search_profiles("valid")

    assert len(result.profiles or []) == 1
    assert result.profiles[0].proxyWallet == "0xdef"

