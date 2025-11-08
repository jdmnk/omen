from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class EventDB(Base):
    """SQLAlchemy ORM model for events table."""

    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    slug: Mapped[str] = mapped_column(String, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    closed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    raw: Mapped[dict] = mapped_column(JSONB, nullable=False)


class Event(BaseModel):
    id: str
    slug: str
    title: str
    closed: bool
    raw: dict

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

        return Event(
            id=str(event_id),
            slug=slug,
            title=title,
            closed=closed,
            raw=event_dict,
        )
    except Exception:
        return None
