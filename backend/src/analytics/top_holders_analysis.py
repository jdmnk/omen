from datetime import datetime
from decimal import Decimal

from src.db.selects import SelectsClient
from src.models.position import PositionSchema
from src.models.wallet import WalletSchema
from src.polymarket.poly_client_graphs import PolyClientGraphs


class TopHolderSchema(PositionSchema):
    """Position schema enriched with wallet information."""

    # Wallet fields (optional - may not exist for all wallets)
    walletCreatedAt: datetime | None = None
    walletLastTransfer: datetime | None = None
    walletBalance: Decimal | None = None


async def get_top_holders_with_wallet_info(
    condition_id: str, min_amount: int = 100
) -> list[TopHolderSchema]:
    """
    Get top holders for a market and enrich them with wallet information.

    Steps:
    1. Get market by condition_id to fetch token1 and token2
    2. Get top positions using get_market_positions
    3. Get wallet info for all unique proxy wallets
    4. Enrich positions with wallet data

    Returns sorted list of top holders enriched with wallet information.
    """
    selects = SelectsClient()
    poly_client_graphs = PolyClientGraphs()

    # Get market to fetch token1 and token2
    market = await selects.get_market_by_condition_id(condition_id)
    if not market:
        return []

    # Get top positions
    positions = await poly_client_graphs.get_market_positions(
        [market.token1, market.token2], min_amount=min_amount
    )

    if not positions:
        return []

    # Extract unique proxy wallets (user addresses)
    unique_wallets = list(set(pos.user for pos in positions))

    # Get wallet info for all unique wallets
    wallets = await poly_client_graphs.get_wallets_info(unique_wallets)

    # Create a mapping of wallet_id -> wallet info for quick lookup
    wallet_map: dict[str, WalletSchema] = {wallet.id: wallet for wallet in wallets}

    # Enrich positions with wallet information
    enriched_holders: list[TopHolderSchema] = []

    for position in positions:
        wallet = wallet_map.get(position.user)
        enriched_holders.append(
            TopHolderSchema(
                **position.model_dump(),
                walletCreatedAt=wallet.createdAt if wallet else None,
                walletLastTransfer=wallet.lastTransfer if wallet else None,
                walletBalance=wallet.balance if wallet else None,
            )
        )

    return enriched_holders
