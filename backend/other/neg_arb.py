import asyncio
import json

from src.polymarket.poly_client import PolyClient
import logging

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


async def main() -> None:
    poly_client = PolyClient()
    active_events = await poly_client.get_active_events(count=500)
    negrisk_events = [e for e in active_events if e.get("negRisk")]

    for negrisk_event in negrisk_events:
        sumBuy = 0
        sumSell = 0
        yesTokenIds = []
        noTokenIds = []
        # markets = [market["conditionId"] for market in negrisk_event["markets"]]
        for market in negrisk_event["markets"]:
            token_ids = json.loads(market["clobTokenIds"])
            yesTokenIds.append(token_ids[0])
            noTokenIds.append(token_ids[1])

        prices_requests = [{"token_id": token_id, "side": "BUY"} for token_id in yesTokenIds]
        yes_prices = await poly_client.get_market_prices_by_request(prices_requests)
        no_prices_requests = [{"token_id": token_id, "side": "SELL"} for token_id in noTokenIds]
        no_prices = await poly_client.get_market_prices_by_request(no_prices_requests)

        print("Event: " + negrisk_event["title"])
        print("Number of outcomes: " + str(len(negrisk_event["markets"])))

        # iterate prices dict and sum up the prices for each side
        for _token_id, _prices in yes_prices.items():
            # print("YES: ", _prices)
            sumBuy += float(_prices.get("BUY", 0))

        for _token_id, _prices in no_prices.items():
            # print("NO: ", _prices)
            sumSell += float(_prices.get("SELL", 0))

        print("Yes sum: " + str(sumBuy))
        print("No sum: " + str(len(negrisk_event["markets"]) - sumSell))
        print("--------------------------------")


if __name__ == "__main__":
    asyncio.run(main())
