import asyncio

from src.analytics.top_holders_analysis import get_top_holders_with_wallet_info
from src.polymarket.poly_client_graphs import PolyClientGraphs

# just for testing


async def main():
    poly_client_graphs = PolyClientGraphs()
    condition_id = "0x75126a2dc663e96f0c034ab366ef7c170c6be091debb48e758a7642cab372189"
    token_ids = [
        "63734858454104456827965423032017999969868364661379179189471720454537977517628",
        "82753928373506789738938209253017622876611720867997972800184877791377174293875",
    ]
    top_holders = await get_top_holders_with_wallet_info(
        condition_id=condition_id,
        token_ids=token_ids,
    )
    wallet_ids = [holder.proxyWallet for holder in top_holders]
    print(wallet_ids)

    positions = await poly_client_graphs.get_user_positions_multiple_markets(
        wallet_ids=wallet_ids,
        token_ids=[token_ids[1]],
        min_amount=100,
    )
    print("--------------------------------")
    print([position.model_dump() for position in positions])


if __name__ == "__main__":
    asyncio.run(main())
