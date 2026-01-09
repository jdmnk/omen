from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class EventMarket(Base):
    __tablename__ = "event_markets"

    event_id: Mapped[str] = mapped_column(
        String, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True
    )
    conditionId: Mapped[str] = mapped_column(
        String, ForeignKey("markets.conditionId", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
