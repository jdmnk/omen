# NegRisk Arbitrage Playbook

NegRisk conversions unlock several capital-efficient trades. This note catalogues the main arbitrage angles so we can later codify detection logic.

## 1. Classic Conversion Arb (NO sum > 1)

**Setup**: Sum of mid-market prices (or best offers) for all `NO` tokens in an event exceeds 1 USDC after accounting for fees and slippage.

**Trade**:
1. Buy `NO` of the richest mispriced market (or multiple `NO`s).
2. Invoke `convert()` to receive a bundle of `YES` tokens + USDC.
3. Immediately sell the received `YES` tokens.

**Profit Driver**: Because a `NO` should equal `1 - price_of(YES_other)` the overpricing leaks value into the conversion. Execution risk comes from conversion fees and market depth on the `YES` legs.

## 2. YES Basket Undervaluation

**Setup**: Combined price of all `YES` tokens *excluding* outcome `i` trades below `(1 - fee)` despite there being ample conversion liquidity.

**Trade**:
1. Buy the cheap YES basket (across multiple order books).
2. Convert a small amount of `NO_i` (possibly borrowing or sourcing from liquidity providers) to create a matching YES basket + USDC.
3. Deliver the YES basket obtained via conversion to flatten exposure, pocketing the USDC.

**Profit Driver**: Treats conversion as a synthetic short on the YES basket. Useful when the YES books are gappy and market makers misprice cross-outcome correlations. Risks include partial fills on YES books and adapter inventory exhaustion.

## 3. Placeholder/Other Drift (Augmented NegRisk)

**Setup**: In augmented NegRisk events, placeholders sometimes trade at non-zero prices even though traders should ignore them until clarified.

**Trade**:
1. Sell overpriced placeholder YES tokens or short via borrowing.
2. Convert from a named outcome NO into the placeholder YES set if necessary to cover the short.

**Profit Driver**: Conversion guarantees placeholder YES coverage if they later become real outcomes; until then they should be near zero. Need to monitor bulletin-board clarifications to avoid being caught during a renaming event.

## 4. Vault Fee Harvesting

**Setup**: Conversion fees accumulate in USDC while YES inventory remains balanced. When market makers ignore this income stream, conversions can be run purely to harvest fees if the NO price is exactly at parity.

**Trade**:
1. Oscillate between `NO` and `YES` positions (buy NO, convert, sell YES).
2. Ensure fees returned as USDC exceed transaction costs.

**Profit Driver**: Essentially a rebate capture. Only viable when on-chain gas + spread costs are dwarfed by the conversion fee rebate. Requires automation and cheap gas windows.

## 5. Event-Level Misclassification

**Setup**: Gamma API marks an event as NegRisk but order books trade as if markets were independent (common for newer traders). For example, YES prices sum to much more than 1 because participants ignore mutual exclusivity.

**Trade**:
1. Purchase the cheapest set of YES markets whose sum < 1.
2. Short or sell NO positions where prices imply > 1 payout.
3. Use conversion to shuttle risk across legs until parity is restored.

**Profit Driver**: Educated traders exploit structural ignorance. Monitoring `negRisk`, `enableNegRisk`, and `negRiskAugmented` flags is essential to find these mismatches quickly.

## Observability Metrics to Automate

- `Σ price(NO_i)` and `Σ price(YES_i)` vs. 1 (per event).
- Adapter conversion volume spikes tied to specific outcomes (indicates someone is running arb).
- Vault YES inventory vs. outstanding NO supply (arb dries up when inventory is low).
- Placeholder outcomes trading above dust levels despite no clarification.

Documenting these playbooks lets us translate them into scanners/alerts inside `src/negrisk/` later on.
