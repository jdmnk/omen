from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel
from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base
from src.utils.usdc import from_usdc_decimal


class WalletDB(Base):
    """SQLAlchemy ORM model for wallets table."""
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    signer: Mapped[str] = mapped_column(String, nullable=True)
    type: Mapped[str] = mapped_column(String, nullable=True)
    balance: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    lastTransfer: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class Wallet(BaseModel):
    id: str
    signer: str | None = None
    type: str | None = None
    balance: Decimal
    lastTransfer: datetime | None = None
    createdAt: datetime | None = None

    class Config:
        from_attributes = True


def parse_wallet_from_api(wallet_dict: dict) -> Wallet | None:
    def parse_timestamp(value: object) -> datetime | None:
        try:
            if value is None:
                return None
            # API returns Unix timestamps as strings (in seconds)
            # e.g., "1762352381", "1721141057"
            timestamp = int(value)
            # Handle both seconds and milliseconds
            return datetime.fromtimestamp(timestamp)
        except (ValueError, TypeError, OSError):
            return None

    try:
        wallet_id = wallet_dict.get("id")
        if not wallet_id:
            return None

        signer = wallet_dict.get("signer")
        wallet_type = wallet_dict.get("type")
        # Balance comes as string like "34493081742" (USDC units)
        balance = from_usdc_decimal(wallet_dict.get("balance"))
        # Timestamps come as strings like "1762352381" (Unix seconds)
        lastTransfer = parse_timestamp(wallet_dict.get("lastTransfer"))
        createdAt = parse_timestamp(wallet_dict.get("createdAt"))

        return Wallet(
            id=str(wallet_id),
            signer=str(signer) if signer else None,
            type=str(wallet_type) if wallet_type else None,
            balance=balance,
            lastTransfer=lastTransfer,
            createdAt=createdAt,
        )
    except (ValueError, KeyError, TypeError):
        return None
