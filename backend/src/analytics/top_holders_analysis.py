from src.models.graph.position import Position
from src.models.graph.wallet import Wallet
from src.models.top_holders import TopHolder, TopHolderAnalysis, TopHolderPnl, TopHolderWalletInfo
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


async def get_top_holders_pnl(holders: list[TopHolder], token_ids: list[str]) -> list[TopHolderPnl]:
    """
    Get PnL data for holders.

    Args:
        holders: List of TopHolder objects
        token_ids: List of token IDs (token1, token2) for the market

    Returns list of holders with PnL data (avgPrice, realizedPnl, totalBought).
    """
    if not holders:
        return []

    poly_client_graphs = PolyClientGraphs()

    # Extract unique proxy wallets (user addresses)
    unique_wallets = list(set(h.proxyWallet for h in holders if h.proxyWallet))

    if not unique_wallets:
        return []

    # Get position data for all holders for this market's tokens
    positions = await poly_client_graphs.get_user_positions(unique_wallets, token_ids)

    # Create position map: (user, tokenId) -> Position
    position_map: dict[tuple[str, str], Position] = {}
    for position in positions:
        key = (position.user, position.tokenId)
        position_map[key] = position

    # Enrich holders with PnL data
    enriched_holders: list[TopHolderPnl] = []

    for holder in holders:
        proxy_wallet = holder.proxyWallet
        if not proxy_wallet:
            continue

        asset = holder.asset

        # Find matching position by user and tokenId (asset)
        position = position_map.get((proxy_wallet, asset)) if asset else None

        enriched_holders.append(
            TopHolderPnl(
                **holder.model_dump(),
                avgPrice=position.avgPrice if position else None,
                realizedPnl=position.realizedPnl if position else None,
                totalBought=position.totalBought if position else None,
            )
        )

    return enriched_holders


async def get_top_holders_wallet_info(
    holders: list[TopHolder],
) -> list[TopHolderWalletInfo]:
    """
    Get wallet information for holders.

    Args:
        holders: List of TopHolder objects

    Returns list of holders with wallet info (walletCreatedAt, walletLastTransfer, walletBalance).
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

    # Create mappings for quick lookup
    wallet_map: dict[str, Wallet] = {wallet.id: wallet for wallet in wallets}

    # Enrich holders with wallet information
    enriched_holders: list[TopHolderWalletInfo] = []

    for holder in holders:
        proxy_wallet = holder.proxyWallet
        if not proxy_wallet:
            continue

        wallet = wallet_map.get(proxy_wallet)

        enriched_holders.append(
            TopHolderWalletInfo(
                **holder.model_dump(),
                walletCreatedAt=wallet.createdAt if wallet else None,
                walletLastTransfer=wallet.lastTransfer if wallet else None,
                walletBalance=wallet.balance if wallet else None,
            )
        )

    return enriched_holders
