import argparse
import asyncio
import json
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field

from src.polymarket.poly_client import PolyClient
from src.polymarket.poly_client_prices import (
    OrderBookSummaryResponse,
    PolyClientPrices,
)
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class OutcomeQuote:
    """Per-outcome view into the best tradable quotes we can use for arbing."""

    market_id: str
    slug: str
    label: str
    yes_token: str
    no_token: str
    yes_bid: float | None = None
    yes_bid_size: float | None = None
    no_ask: float | None = None
    no_ask_size: float | None = None
    delta: float = 0.0


@dataclass
class ArbOpportunity:
    event_id: str
    event_slug: str
    event_title: str
    augmented: bool
    subset: list[OutcomeQuote] = field(default_factory=list)
    complement: list[OutcomeQuote] = field(default_factory=list)
    cost: float = 0.0
    yes_value: float = 0.0
    usdc_out: float = 0.0
    profit: float = 0.0
    total_yes_bid: float = 0.0


def chunked(items: Sequence[str], size: int) -> Iterable[list[str]]:
    for idx in range(0, len(items), size):
        yield list(items[idx : idx + size])


def best_bid(book: OrderBookSummaryResponse | None) -> tuple[float | None, float | None]:
    if not book:
        return None, None
    bids = book.get("bids") or []
    if not bids:
        return None, None
    top = bids[0]
    try:
        return float(top["price"]), float(top["size"])
    except (KeyError, TypeError, ValueError):
        return None, None


def best_ask(book: OrderBookSummaryResponse | None) -> tuple[float | None, float | None]:
    if not book:
        return None, None
    asks = book.get("asks") or []
    if not asks:
        return None, None
    top = asks[0]
    try:
        return float(top["price"]), float(top["size"])
    except (KeyError, TypeError, ValueError):
        return None, None


async def fetch_order_books(
    prices_client: PolyClientPrices, token_ids: Sequence[str], batch_size: int = 40
) -> dict[str, OrderBookSummaryResponse]:
    """Fetch order books for all requested token ids."""
    books: dict[str, OrderBookSummaryResponse] = {}
    deduped = list(dict.fromkeys(token_ids))  # keep ordering while deduping
    total = len(deduped)
    processed = 0
    for chunk in chunked(deduped, batch_size):
        requests = [{"token_id": token} for token in chunk]
        response = await prices_client.get_order_books_by_request(requests)
        processed += len(chunk)
        for book in response:
            asset_id = book.get("asset_id")
            if asset_id:
                books[asset_id] = book
        logger.info("Fetched %d/%d order books (batch %d/%d)", len(books), total, processed, total)
    logger.info("Finished with %d/%d order books", len(books), total)
    return books


def parse_market_tokens(market: dict) -> tuple[str, str] | None:
    try:
        raw = market.get("clobTokenIds")
        tokens = json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(tokens, list) or len(tokens) != 2:
            return None
        return str(tokens[0]), str(tokens[1])
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


def build_outcome_quotes(
    event: dict, books: dict[str, OrderBookSummaryResponse]
) -> list[OutcomeQuote]:
    # For each market we pair the best YES bid (where we would unload post-convert)
    # with the best NO ask (where we would source inventory for conversion).
    quotes: list[OutcomeQuote] = []
    for market in event.get("markets", []):
        if not market.get("active") or market.get("closed"):
            continue
        parsed = parse_market_tokens(market)
        if not parsed:
            continue
        yes_token, no_token = parsed
        yes_book = books.get(yes_token)
        no_book = books.get(no_token)
        yes_bid, yes_size = best_bid(yes_book)
        no_ask, no_size = best_ask(no_book)
        label = (
            market.get("groupItemTitle")
            or market.get("title")
            or market.get("question")
            or market.get("slug")
            or market.get("id")
        )
        quotes.append(
            OutcomeQuote(
                market_id=str(market.get("id")),
                slug=str(market.get("slug") or ""),
                label=str(label),
                yes_token=yes_token,
                no_token=no_token,
                yes_bid=yes_bid,
                yes_bid_size=yes_size,
                no_ask=no_ask,
                no_ask_size=no_size,
            )
        )
    return quotes


def evaluate_event(event: dict, quotes: list[OutcomeQuote]) -> ArbOpportunity | None:
    tradable = [
        q for q in quotes if q.yes_bid is not None and q.no_ask is not None and q.no_ask > 0
    ]
    if len(tradable) < 2:
        return None

    # total_yes is Σ best YES bids. If markets are efficient this should be ≈1.
    total_yes = sum(q.yes_bid or 0 for q in tradable)
    base_term = total_yes - 1.0
    # delta expresses how much extra value a single NO conversion would generate: 1 - YES_bid - NO_ask.
    for quote in tradable:
        yes_bid = quote.yes_bid or 0.0
        no_ask = quote.no_ask or 0.0
        quote.delta = 1.0 - yes_bid - no_ask

    # If multiple outcomes have positive delta we can buy them all since a convert on each is individually profitable.
    positives = [q for q in tradable if q.delta > 0]
    if positives:
        subset = positives
    else:
        # Otherwise pick the single best (least negative) delta, because converting that outcome forces USDC + YES bundle sales.
        subset = [max(tradable, key=lambda q: q.delta)]

    complement = [q for q in tradable if q not in subset]
    # Conversion releases (|subset|-1) USDC plus YES tokens on the complement legs.
    usdc_out = max(0.0, len(subset) - 1)
    yes_value = sum(q.yes_bid or 0.0 for q in complement)
    cost = sum(q.no_ask or 0.0 for q in subset)
    profit = usdc_out + yes_value - cost

    # Numerical sanity check using derived formula as well
    derived_profit = base_term + sum(q.delta for q in subset)
    if abs(profit - derived_profit) > 1e-6:
        logger.debug(
            "Profit mismatch for event %s (direct=%.6f derived=%.6f)",
            event.get("slug"),
            profit,
            derived_profit,
        )

    if profit <= 0:
        return None

    return ArbOpportunity(
        event_id=str(event.get("id")),
        event_slug=str(event.get("slug")),
        event_title=str(event.get("title") or event.get("slug")),
        augmented=bool(event.get("negRiskAugmented")),
        subset=subset,
        complement=complement,
        cost=cost,
        yes_value=yes_value,
        usdc_out=usdc_out,
        profit=profit,
        total_yes_bid=total_yes,
    )


async def find_opportunities(min_profit: float, limit_events: int | None) -> list[ArbOpportunity]:
    poly_client = PolyClient()
    prices_client = PolyClientPrices()

    logger.info("Fetching active events from Gamma API...")
    events = await poly_client.get_active_events()
    # NegRisk can be signaled at both event and market level, so check every flag.
    neg_events = [
        event
        for event in events
        if event.get("enableNegRisk") or event.get("negRisk") or event.get("negRiskAugmented")
    ]
    if limit_events:
        neg_events = neg_events[:limit_events]
    logger.info("Found %d NegRisk-enabled events", len(neg_events))

    token_ids: list[str] = []
    for event in neg_events:
        for market in event.get("markets", []):
            if not market.get("active") or market.get("closed"):
                continue
            parsed = parse_market_tokens(market)
            if parsed:
                token_ids.extend(parsed)

    books = await fetch_order_books(prices_client, token_ids)

    opportunities: list[ArbOpportunity] = []
    for event in neg_events:
        quotes = build_outcome_quotes(event, books)
        opportunity = evaluate_event(event, quotes)
        if not opportunity:
            continue
        if opportunity.profit < min_profit:
            continue
        opportunities.append(opportunity)

    opportunities.sort(key=lambda o: o.profit, reverse=True)
    return opportunities


def format_outcome_list(outcomes: Sequence[OutcomeQuote], *, side: str) -> str:
    parts: list[str] = []
    for item in outcomes:
        if side == "NO":
            price = item.no_ask
            size = item.no_ask_size
        else:
            price = item.yes_bid
            size = item.yes_bid_size
        price_str = f"{price:.4f}" if price is not None else "n/a"
        size_str = f"{size:.2f}" if size is not None else "n/a"
        parts.append(f"{item.label} @{price_str} (size {size_str})")
    return "; ".join(parts)


def print_opportunities(opportunities: Sequence[ArbOpportunity], top: int | None) -> None:
    display = opportunities if top is None else opportunities[:top]
    if not display:
        print("No NegRisk arbitrage opportunities above threshold.")
        return
    for opp in display:
        subset_str = format_outcome_list(opp.subset, side="NO")
        complement_str = format_outcome_list(opp.complement, side="YES")
        print(
            f"\nEvent: {opp.event_title} ({opp.event_slug}) "
            f"| outcomes: {len(opp.subset) + len(opp.complement)} "
            f"| augmented={opp.augmented}"
        )
        print(f"  Buy NO on: {subset_str}")
        if opp.complement:
            print(f"  Sell YES (post-convert): {complement_str}")
        else:
            print("  Sell YES (post-convert): [none] -> pure USDC release")
        print(
            f"  Est. profit/share: {opp.profit:.4f} "
            f"(cost {opp.cost:.4f}, USDC out {opp.usdc_out:.4f}, YES sale {opp.yes_value:.4f})"
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scan active Polymarket NegRisk events for NO→YES conversion arbitrage."
    )
    parser.add_argument(
        "--min-profit",
        type=float,
        default=0.01,
        help="Minimum estimated profit per conversion set (in USDC) to report.",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=10,
        help="Maximum number of opportunities to print (default: 10).",
    )
    parser.add_argument(
        "--limit-events",
        type=int,
        default=None,
        help="Optionally cap how many NegRisk events to inspect (useful for testing).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    opportunities = asyncio.run(find_opportunities(args.min_profit, args.limit_events))
    print_opportunities(opportunities, args.top)


if __name__ == "__main__":
    main()
