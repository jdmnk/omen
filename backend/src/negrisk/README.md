# Negrisk Research Notes

This document condenses the current public documentation on negative-risk (NegRisk) markets so we can reference it while building analytics under `src/negrisk/`.

## Concept & Mechanics

- **Definition**: NegRisk events are mutually exclusive, winner-take-all collections of binary markets (e.g., election candidates). Exactly one market resolves `YES`; the rest resolve `NO`.
- **Capital-efficiency goal**: A holder of a `NO` position in *any* market can convert that position into a `YES` position across the complementary set of markets plus the appropriate amount of USDC. This equivalence lets traders recycle collateral without waiting for resolution.
- **Gamma API flags**: Events expose `negRisk` to denote NegRisk support. `enableNegRisk` + `negRiskAugmented` together describe augmented NegRisk (see below).
- **Conversion surface**: Converts are executed on-chain through the [NegRisk Adapter](https://polygonscan.com/address/0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296). Any `NO` share becomes `1` `YES` share in all other markets when conversions are live.

## Contract Stack (GitHub adapter docs)

| Component | Role |
| --- | --- |
| **NegRiskAdapter** | Core contract that burns `NO` tokens, mints the equivalent bundle of `YES` tokens + USDC, and enforces outcome exclusivity. Built on top of Gnosis Conditional Tokens. |
| **WrappedCollateral** | Wrapper over USDC used for collateral so the adapter can release USDC during conversions without merging complete sets. |
| **NegRiskOperator** | Admin/orchestration contract that prepares questions/markets, plugs into the oracle, and routes settlement info into the adapter. |
| **UmaCtfAdapter (oracle)** | Oracle-like adapter that feeds outcomes into the NegRisk stack. `questionID` from UMA is passed as `_requestId` when registering markets with the operator. |
| **Vault** | Fee sink that accumulates USDC and YES tokens collected from conversion fees. |

### Example Equivalence

For candidates A/B/C:

- Position: `1 × NO_A + 1 × NO_B`.
- Value if A wins: 1 USDC; if B wins: 1 USDC; if C wins: 2 USDC.
- Equivalent to `1 USDC + 1 × YES_C`. The adapter enforces this conversion path, implying mispricings when market prices diverge from this parity.

## Resolution & Safety Constraints

From the adapter README:

- Every prepared market **must** have exactly one `YES` outcome. Multiple `YES` reports (e.g., due to ambiguous oracle responses) cause `reportOutcome` to revert and can lock the market.
- You must guarantee that not all questions resolve `NO`. Markets should be selected so that “no winner” is impossible (or treated as its own explicit outcome).
- The UMA adapter can emit `[1, 1]` (invalid for NegRisk). Operators need to choose markets/questions so that this state cannot happen, otherwise the adapter reverts.
- There must never be ties or undeterminable questions. Before running on real data, confirm the oracle sources cannot produce multi-winner results.

## Augmented Negative Risk (Docs site)

Problem: Conversions assume all outcomes exist before trading. Launching “Other” placeholders can be undesirable when future, unknown outcomes should have individual markets.

Solution: **Augmented NegRisk** mixes:

1. Named outcomes (the ones we expect to trade).
2. Placeholder outcomes (e.g., `Person A`, `Person B`) that can later be *clarified* into specific names through bulletin-board updates.
3. An explicit `Other` outcome whose definition shifts as placeholders are clarified.

Implications:

- Traders should only interact with named outcomes. Placeholders + `Other` are effectively off-limits until defined.
- When a new outcome emerges, a placeholder is re-labeled to that outcome. The UI hides placeholders by default.
- If resolution happens before a correct named outcome exists, the market resolves to `Other`.
- Tagging: `enableNegRisk == true` **and** `negRiskAugmented == true` identifies augmented sets.

## Analytics Notes / Mispricing Hooks

These invariants guide the analytics code we will add later:

- **Parity checks**: The sum of best `NO` offers in the event should never exceed `1` (after fees). Deviations signal conversion arbitrage.
- **Inventory states**: WrappedCollateral enables releasing USDC without merging sets; we should track vault balances versus outstanding conversions to ensure sustainability.
- **Oracle monitoring**: Since markets depend on UMA question IDs, we need to map Polymarket event IDs → UMA request IDs to detect if any market is at risk of invalid resolution.
- **Field coverage**: Pull `negRisk`, `negRiskAugmented`, `enableNegRisk`, and per-market liquidity/price feeds from Gamma so we can flag which events are convertible and whether placeholders are active.
- **Fee awareness**: Conversion fees accumulate in the Vault; analytics should account for them when computing theoretical conversion values.

## Reference Links

- GitHub Adapter Docs: <https://github.com/Polymarket/neg-risk-ctf-adapter>
- Polymarket NegRisk Overview: <https://docs.polymarket.com/developers/neg-risk/overview.md>

Keep this summary updated as Polymarket ships new NegRisk features (e.g., alternative oracles or modified conversion fees).
