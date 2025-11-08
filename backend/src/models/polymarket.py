"""Models for Polymarket Data API responses."""

from pydantic import BaseModel


class PolymarketHolder(BaseModel):
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


class PolymarketHoldersResponse(BaseModel):
    """Holders response from Polymarket Data API."""

    token: str
    holders: list[PolymarketHolder]
