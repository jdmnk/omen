import asyncio
import json
import logging

from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_prices import PolyClientPrices

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


async def main() -> None:
    poly_client = PolyClient()
    poly_client_prices = PolyClientPrices()
    active_events = await poly_client.get_active_events(count=500)
    negrisk_events = [e for e in active_events if e.get("negRisk")]

    for negrisk_event in negrisk_events:
        sumBuy = 0
        yesTokenIds = []
        # noTokenIds = []
        # markets = [market["conditionId"] for market in negrisk_event["markets"]]
        for market in negrisk_event["markets"]:
            token_ids = json.loads(market["clobTokenIds"])
            yesTokenIds.append(token_ids[0])
            # noTokenIds.append(token_ids[1])

        books_requests = [{"token_id": token_id} for token_id in yesTokenIds]
        yes_books = await poly_client_prices.get_order_books_by_request(books_requests)

        print("Event: " + negrisk_event["title"])
        print("Number of outcomes: " + str(len(negrisk_event["markets"])))

        # iterate prices dict and sum up the prices for each side
        for _book in yes_books:
            bids = _book.get("bids")
            if bids:
                sumBuy += float(bids[-1].get("price", 0))

        print("Yes sum: " + str(sumBuy))
        print("--------------------------------")


if __name__ == "__main__":
    asyncio.run(main())
