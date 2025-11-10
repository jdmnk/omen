"""Models for Polymarket Data API responses."""

from datetime import datetime

from pydantic import BaseModel


class TopHolder(BaseModel):
    """Single holder from Polymarket Data API."""

    proxyWallet: str
    bio: str | None = None
    asset: str
    pseudonym: str | None = None
    amount: float
    displayUsernamePublic: bool
    outcomeIndex: int
    name: str | None = None
    profileImage: str | None = None
    profileImageOptimized: str | None = None


class TopHoldersResponse(BaseModel):
    """Holders response from Polymarket Data API."""

    token: str
    holders: list[TopHolder]


class TopHolderPnl(TopHolder):
    """TopHolder with PnL data only."""

    avgPrice: float | None = None
    realizedPnl: float | None = None
    totalBought: float | None = None


class TopHolderWalletInfo(TopHolder):
    """TopHolder with wallet info only."""

    walletCreatedAt: datetime | None = None
    walletLastTransfer: datetime | None = None
    walletBalance: float | None = None


class TopHolderAnalysis(TopHolder):
    """Polymarket holder enriched with wallet information and position data."""

    # Wallet fields (optional - may not exist for all wallets)
    walletCreatedAt: datetime | None = None
    walletLastTransfer: datetime | None = None
    walletBalance: float | None = None

    # Position fields (optional - may not exist if position not found)
    avgPrice: float | None = None
    realizedPnl: float | None = None
    totalBought: float | None = None
