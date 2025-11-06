from decimal import Decimal

from pydantic import BaseModel
from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base
from src.utils.usdc import from_usdc_decimal


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    realizedPnl: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    user: Mapped[str] = mapped_column(String, nullable=False)
    tokenId: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    avgPrice: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    totalBought: Mapped[Decimal] = mapped_column(Numeric, nullable=False)


# Pydantic Model for validation and type safety
class PositionSchema(BaseModel):
    id: str
    realizedPnl: Decimal
    user: str
    tokenId: str
    amount: Decimal
    avgPrice: Decimal
    totalBought: Decimal

    class Config:
        from_attributes = True


def parse_position_from_api(position_dict: dict) -> PositionSchema | None:
    try:
        id = position_dict.get("id")
        if not id:
            return None

        user = position_dict.get("user", "")
        tokenId = position_dict.get("tokenId", "")

        realizedPnl = from_usdc_decimal(position_dict.get("realizedPnl"))
        amount = from_usdc_decimal(position_dict.get("amount"))
        avgPrice = from_usdc_decimal(position_dict.get("avgPrice"))
        totalBought = from_usdc_decimal(position_dict.get("totalBought"))

        return PositionSchema(
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
