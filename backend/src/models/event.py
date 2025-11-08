from __future__ import annotations

from pydantic import BaseModel
from src.models.market import Market, parse_market_from_api


class Event(BaseModel):
    id: str
    slug: str
    title: str
    closed: bool
    markets: list[Market] | None = None

    class Config:
        from_attributes = True


def parse_event_from_api(event_dict: dict) -> Event | None:
    try:
        # id may be int; store as str for consistency with other ids
        event_id = event_dict.get("id")
        if event_id is None:
            return None
        slug = str(event_dict.get("slug") or "").strip()
        if not slug:
            return None

        # Some payloads might use question instead of title
        title = str(event_dict.get("title") or event_dict.get("question") or slug)

        closed_raw = event_dict.get("closed", False)
        closed = bool(closed_raw)
        if isinstance(closed_raw, str):
            closed = closed_raw.lower() == "true"

        markets_raw = event_dict.get("markets", [])
        markets = [parse_market_from_api(m) for m in markets_raw]

        return Event(
            id=str(event_id),
            slug=slug,
            title=title,
            closed=closed,
            markets=markets,
        )
    except Exception:
        return None
