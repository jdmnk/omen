"""Public profile model from Polymarket Gamma API."""

from __future__ import annotations

from pydantic import BaseModel


class UserProfileUser(BaseModel):
    id: str | None = None
    creator: bool | None = None
    mod: bool | None = None


class UserPublicProfile(BaseModel):
    id: str | None = None
    createdAt: str | None = None
    proxyWallet: str | None = None
    profileImage: str | None = None
    displayUsernamePublic: bool | None = None
    bio: str | None = None
    pseudonym: str | None = None
    name: str | None = None
    users: list[UserProfileUser] | None = None
    xUsername: str | None = None
    verifiedBadge: bool | None = None
