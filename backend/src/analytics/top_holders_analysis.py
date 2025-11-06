from datetime import datetime
from decimal import Decimal

from src.models.graph.position import PositionSchema
from src.models.public import PolymarketHolder
from src.models.wallet import WalletSchema
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_graphs import PolyClientGraphs

# Blacklist of wallet addresses to exclude from top holders analysis
BLACKLISTED_WALLETS: set[str] = {
    "0xa5ef39c3d3e10d0b270233af41cac69796b12966",  # negrisk adapter burn address
}


class TopHolderSchema(PolymarketHolder):
    """Polymarket holder schema enriched with wallet information and position data."""

    # Wallet fields (optional - may not exist for all wallets)
    walletCreatedAt: datetime | None = None
    walletLastTransfer: datetime | None = None
    walletBalance: Decimal | None = None

    # Position fields (optional - may not exist if position not found)
    avgPrice: Decimal | None = None
    realizedPnl: Decimal | None = None
    totalBought: Decimal | None = None


def filter_blacklisted_wallets(holders: list[dict]) -> list[dict]:
    blacklist_normalized = {addr.lower() for addr in BLACKLISTED_WALLETS}

    return [
        h
        for h in holders
        if h.get("proxyWallet") and h.get("proxyWallet", "").lower() not in blacklist_normalized
    ]


async def get_top_holders_with_wallet_info(
    condition_id: str, token_ids: list[str]
) -> list[TopHolderSchema]:
    """
    Get top holders for a market and enrich them with wallet information and position data.

    Steps:
    1. Get top holders from Polymarket Data API using get_top_holders
    2. Get wallet info for all unique proxy wallets from Goldsky
    3. Get position data for all holders from Goldsky
    4. Enrich holders with wallet data and position/PnL data

    Args:
        condition_id: The market condition ID
        token_ids: List of token IDs (token1, token2) for the market

    Returns list of top holders enriched with wallet information and position data.
    """
    poly_client = PolyClient()
    poly_client_graphs = PolyClientGraphs()

    # Get top holders from Polymarket API
    holders = await poly_client.get_top_holders([condition_id])

    if not holders:
        return []

    # Filter out blacklisted wallets
    holders = filter_blacklisted_wallets(holders)

    if not holders:
        return []

    # Extract unique proxy wallets (user addresses)
    unique_wallets = list(set(h.get("proxyWallet") for h in holders if h.get("proxyWallet")))

    if not unique_wallets:
        return []

    # Get wallet info for all unique wallets
    wallets = await poly_client_graphs.get_wallets_info(unique_wallets)

    # Get position data for all holders for this market's tokens
    positions = await poly_client_graphs.get_user_positions(unique_wallets, token_ids)

    # Create mappings for quick lookup
    wallet_map: dict[str, WalletSchema] = {wallet.id: wallet for wallet in wallets}

    # Create position map: (user, tokenId) -> PositionSchema
    position_map: dict[tuple[str, str], PositionSchema] = {}
    for position in positions:
        key = (position.user, position.tokenId)
        position_map[key] = position

    # Enrich holders with wallet information and position/PnL data
    enriched_holders: list[TopHolderSchema] = []

    for holder_dict in holders:
        proxy_wallet = holder_dict.get("proxyWallet")
        if not proxy_wallet:
            continue

        wallet = wallet_map.get(proxy_wallet)
        asset = holder_dict.get("asset", "")

        # Find matching position by user and tokenId (asset)
        position = position_map.get((proxy_wallet, asset)) if asset else None

        enriched_holders.append(
            TopHolderSchema(
                **holder_dict,
                walletCreatedAt=wallet.createdAt if wallet else None,
                walletLastTransfer=wallet.lastTransfer if wallet else None,
                walletBalance=wallet.balance if wallet else None,
                avgPrice=position.avgPrice if position else None,
                realizedPnl=position.realizedPnl if position else None,
                totalBought=position.totalBought if position else None,
            )
        )

    return enriched_holders
