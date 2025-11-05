import asyncio

from src.db.database_client import DatabaseClient
from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_graphs import PolyClientGraphs

# just for testing


async def main():
    poly_client = PolyClient()
    poly_client_graphs = PolyClientGraphs()
    db_client = DatabaseClient()

    # active_markets = await poly_client.get_active_markets_by_events()
    # print(len(active_markets))

    # await db_client.delete_all_markets()
    # await db_client.insert_markets(active_markets)
    markets = await db_client.get_all_markets()
    print(len(markets))

    clob_tokens = markets[0]["data"]["clobTokenIds"]

    print("clob type: " + str(type(clob_tokens)))
    print([clob_tokens[0], clob_tokens[1]])
    positions = await poly_client_graphs.get_market_positions(token_ids=clob_tokens)
    print(len(positions))

    # print(active_markets[0])

    # holders = await poly_client.get_top_holders(condition_ids=["0x0e3c65b0c5a9d8b7f9d3220e559eabcb713c0f99568a8c03cb91e0853785b5d4"])
    # print(len(holders))

    # for holder in holders:
    #     side = "YES" if holder.get("outcomeIndex") == 0 else "NO"
    #     print(side + " - " + holder.get("name") + " - " + str(holder.get("amount")))
    # print(holders)

    # trades_for_market = await poly_client.get_market_trades(condition_ids=[active_markets[0]["conditionId"]])
    # print(trades_for_market[0])

    # clob_tokens = json.loads(active_markets[0]["clobTokenIds"]) # returns array of both

    # positions = await poly_client.get_market_positions(token_ids=clob_tokens)
    # print(positions)


if __name__ == "__main__":
    asyncio.run(main())
