from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class PriceHistoryDB(Base):
    """Stores full price history payload per CLOB token as a JSON blob."""

    __tablename__ = "price_histories"

    clob_token_id: Mapped[str] = mapped_column(String, primary_key=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    points: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)


class PriceHistory(BaseModel):
    clob_token_id: str
    points: list[dict]

    class Config:
        from_attributes = True
