from src.models.graph.position import Position
from src.models.graph.wallet import Wallet
from src.models.top_holders import TopHolder, TopHolderAnalysis
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_graphs import PolyClientGraphs

# Blacklist of wallet addresses to exclude from top holders analysis
BLACKLISTED_WALLETS: set[str] = {
    "0xa5ef39c3d3e10d0b270233af41cac69796b12966",  # negrisk adapter burn address
}


def filter_blacklisted_wallets(holders: list[TopHolder]) -> list[TopHolder]:
    blacklist_normalized = {addr.lower() for addr in BLACKLISTED_WALLETS}

    return [
        h for h in holders if h.proxyWallet and h.proxyWallet.lower() not in blacklist_normalized
    ]


async def enrich_holders(holders: list[TopHolder], token_ids: list[str]) -> list[TopHolderAnalysis]:
    """
    Enrich holders with wallet information and position data.

    Steps:
    1. Get wallet info for all unique proxy wallets from Goldsky
    2. Get position data for all holders from Goldsky
    3. Enrich holders with wallet data and position/PnL data

    Args:
        holders: List of TopHolder objects to enrich
        token_ids: List of token IDs (token1, token2) for the market

    Returns list of holders enriched with wallet information and position data.
    """
    if not holders:
        return []

    poly_client_graphs = PolyClientGraphs()

    # Extract unique proxy wallets (user addresses)
    unique_wallets = list(set(h.proxyWallet for h in holders if h.proxyWallet))

    if not unique_wallets:
        return []

    # Get wallet info for all unique wallets
    wallets = await poly_client_graphs.get_wallets_info(unique_wallets)

    # Get position data for all holders for this market's tokens
    positions = await poly_client_graphs.get_user_positions(unique_wallets, token_ids)

    # Create mappings for quick lookup
    wallet_map: dict[str, Wallet] = {wallet.id: wallet for wallet in wallets}

    # Create position map: (user, tokenId) -> Position
    position_map: dict[tuple[str, str], Position] = {}
    for position in positions:
        key = (position.user, position.tokenId)
        position_map[key] = position

    # Enrich holders with wallet information and position/PnL data
    enriched_holders: list[TopHolderAnalysis] = []

    for holder in holders:
        proxy_wallet = holder.proxyWallet
        if not proxy_wallet:
            continue

        wallet = wallet_map.get(proxy_wallet)
        asset = holder.asset

        # Find matching position by user and tokenId (asset)
        position = position_map.get((proxy_wallet, asset)) if asset else None

        enriched_holders.append(
            TopHolderAnalysis(
                **holder.model_dump(),
                walletCreatedAt=wallet.createdAt if wallet else None,
                walletLastTransfer=wallet.lastTransfer if wallet else None,
                walletBalance=wallet.balance if wallet else None,
                avgPrice=position.avgPrice if position else None,
                realizedPnl=position.realizedPnl if position else None,
                totalBought=position.totalBought if position else None,
            )
        )

    return enriched_holders


async def get_top_holders_analysis(
    condition_id: str, token_ids: list[str]
) -> list[TopHolderAnalysis]:
    """
    Get top holders for a market and enrich them with wallet information and position data.

    Steps:
    1. Get top holders from Polymarket Data API using get_top_holders
    2. Filter out blacklisted wallets
    3. Enrich holders with wallet data and position/PnL data

    Args:
        condition_id: The market condition ID
        token_ids: List of token IDs (token1, token2) for the market

    Returns list of top holders enriched with wallet information and position data.
    """
    poly_client = PolyClient()

    # Get top holders from Polymarket API
    holders = await poly_client.get_top_holders([condition_id])

    if not holders:
        return []

    # Filter out blacklisted wallets
    holders = filter_blacklisted_wallets(holders)

    if not holders:
        return []

    # Enrich holders with wallet information and position data
    return await enrich_holders(holders, token_ids)
