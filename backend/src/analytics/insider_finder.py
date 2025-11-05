from pydantic import BaseModel

from src.db.selects import SelectsClient
from src.models.position import PositionSchema
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_graphs import PolyClientGraphs


class Insider(BaseModel):
    proxyWallet: str


async def find_insiders(condition_id: str):  # -> list[Insider]:
    # first we get the market by id
    selects = SelectsClient()
    poly_client = PolyClient()
    poly_client_graphs = PolyClientGraphs()
    market = await selects.get_market_by_condition_id(condition_id)

    # get top 10000 trades by size
    trades = await poly_client.get_market_trades([condition_id], count=10000)

    # get top 1000 positions by size (default=1000
    positions: list[PositionSchema] = await poly_client_graphs.get_market_positions(
        [market.token1, market.token2], min_amount=100
    )

    # create a dict of holders and their position with parm of their trades
    holder_positions = {}

    for position in positions:
        holder_positions[position.user] = {}
        holder_positions[position.user]["user_info"] = {}
        holder_positions[position.user]["position"] = position.model_dump()
        holder_positions[position.user]["total_amount"] = float(position.amount) * float(
            position.avgPrice
        )
        holder_positions[position.user]["trades"] = []

    for trade in trades:
        # proxyWallet = user
        if trade.proxyWallet not in holder_positions:
            continue  # continue for now we dont care about non-top holders

        holder_positions[trade.proxyWallet]["trades"].append(trade.model_dump())
        holder_positions[trade.proxyWallet]["user_info"]["name"] = trade.name
        holder_positions[trade.proxyWallet]["user_info"]["pseudonym"] = trade.pseudonym
        holder_positions[trade.proxyWallet]["user_info"]["profileImage"] = trade.profileImage
        holder_positions[trade.proxyWallet]["user_info"]["profileImageOptimized"] = (
            trade.profileImageOptimized
        )

    # delete all positions without trades
    filtered_holder_positions = {}
    for user, position in holder_positions.items():
        if len(position["trades"]) > 0:
            filtered_holder_positions[user] = position

    # sort by precomputed total_amount desc
    sorted_holder_positions = sorted(
        filtered_holder_positions.items(),
        key=lambda x: x[1]["total_amount"],
        reverse=True,
    )

    # shape as list[dict] for API response
    result = [{"user": user, **data} for user, data in sorted_holder_positions]

    return result
