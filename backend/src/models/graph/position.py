from pydantic import BaseModel
from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base
from src.utils.usdc import from_usdc_float


class PositionDB(Base):
    """SQLAlchemy ORM model for positions table."""
    __tablename__ = "positions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    realizedPnl: Mapped[float] = mapped_column(Numeric, nullable=False)
    user: Mapped[str] = mapped_column(String, nullable=False)
    tokenId: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric, nullable=False)
    avgPrice: Mapped[float] = mapped_column(Numeric, nullable=False)
    totalBought: Mapped[float] = mapped_column(Numeric, nullable=False)


# Pydantic model for API validation and serialization
class Position(BaseModel):
    id: str
    realizedPnl: float
    user: str
    tokenId: str
    amount: float
    avgPrice: float
    totalBought: float

    class Config:
        from_attributes = True


def parse_position_from_api(position_dict: dict) -> Position | None:
    try:
        id = position_dict.get("id")
        if not id:
            return None

        user = position_dict.get("user", "")
        tokenId = position_dict.get("tokenId", "")

        realizedPnl = from_usdc_float(position_dict.get("realizedPnl"))
        amount = from_usdc_float(position_dict.get("amount"))
        avgPrice = from_usdc_float(position_dict.get("avgPrice"))
        totalBought = from_usdc_float(position_dict.get("totalBought"))

        return Position(
            id=id,
            realizedPnl=realizedPnl,
            user=user,
            tokenId=tokenId,
            amount=amount,
            avgPrice=avgPrice,
            totalBought=totalBought,
        )
    except (ValueError, KeyError, TypeError):
        return None
