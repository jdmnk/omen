import argparse


def kelly_fraction(p: float, pm: float) -> float:
    """
    Compute Kelly fraction for YES bets.
    p  = your probability
    pm = market price (implied probability)
    """
    f = (p - pm) / (1 - pm)
    return max(0.0, f)  # never bet negative


def main():
    parser = argparse.ArgumentParser(
        description="Kelly bet calculator for binary markets"
    )
    parser.add_argument("pm", type=float, help="Market price (e.g. 0.6 for 60%)")
    parser.add_argument("p", type=float, help="Your probability (e.g. 0.7 for 70%)")
    parser.add_argument("portfolio", type=float, help="Your portfolio size in dollars")
    args = parser.parse_args()

    f = kelly_fraction(args.p, args.pm)
    full = f * args.portfolio
    half = 0.5 * f * args.portfolio
    quarter = 0.25 * f * args.portfolio

    print(
        f"Market price: {args.pm:.2f}, Your prob: {args.p:.2f}, Portfolio: ${args.portfolio:.2f}"
    )
    print(f"Full Kelly bet:    ${full:.2f} ({f * 100:.2f}% of bankroll)")
    print(f"Half Kelly bet:    ${half:.2f}")
    print(f"Quarter Kelly bet: ${quarter:.2f}")


if __name__ == "__main__":
    main()
