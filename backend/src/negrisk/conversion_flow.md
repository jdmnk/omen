# NegRisk Conversion Flow

This note walks through how a `NO → YES` conversion actually works inside Polymarket’s NegRisk stack, so we have an exact model when we simulate arbitrage or reconcile balances.

## Preconditions

1. **Wrapped collateral**: All NegRisk event markets are collateralized with `WrappedCollateral` (a USDC wrapper). This is required so the adapter can release raw USDC mid-cycle without touching the Conditional Tokens contract.
2. **Mutually exclusive outcomes**: Exactly one market in the event must resolve `YES`; the rest must resolve `NO`.
3. **Oracle wiring**: Each question associated with the event exists on UMA via the UmaCtfAdapter. The `NegRiskOperator` prepared the market by providing the UMA `questionID` as `_requestId`.
4. **Conversion window**: Conversions are only possible while markets are unresolved and liquidity for the target YES tokens exists within the adapter vault.

## Assets Involved

- **NO position token**: `ConditionalTokens.positionId(conditionId, NO)` that the trader holds in their wallet.
- **YES position tokens**: One per *other* outcome in the same event.
- **WrappedCollateral**: Backing for the outstanding sets; stored partly in the adapter vault.
- **USDC**: Released to match parity and accumulated as fees.

## High-Level Logic

Conceptually, the adapter enforces:  
`1 × NO(outcome_i)  ↔  1 × YES(all outcomes ≠ i)  +  (k × USDC)`  
where `k` is the collateral delta that keeps the total payout equal to 1 USDC regardless of the actual winner.

## Detailed Step Sequence

1. **User authorization**
   - Trader calls `NegRiskAdapter.convert()` with:
     - `marketId`/`conditionId`
     - Outcome index they are converting *from*
     - Amount of `NO` shares
   - Trader approves the adapter to spend their `NO` position tokens (ERC1155 via Conditional Tokens).

2. **Adapter intake**
   - Adapter pulls the `NO` tokens from the trader.
   - Tokens are held by the adapter and effectively burned (cannot be re-used because the trader gave up the right to redeem them post-resolution).

3. **Portfolio synthesis**
   - Adapter mints/gives the trader:
     - `YES` positions for every *other* outcome in the event, one-for-one with the burned `NO` amount.
     - `USDC` equal to the difference between the notional payout (1 USDC) and the sum of market prices of the minted YES bundle, minus fees.
   - Conversion fee (if configured) is carved out in USDC and diverted to the Vault.

4. **Vault bookkeeping**
   - Adapter reduces its `YES` inventory (it must have sourced these beforehand, either through initial seeding or prior conversions).
   - WrappedCollateral/USDC balances are updated so that liabilities for future conversions remain fully backed.

5. **Post-conversion state**
   - Trader now holds a diversified YES basket that is always worth ≥ 1 USDC at resolution, plus USDC liquidity.
   - If any of the other outcomes resolve `YES`, the trader redeems that YES token for 1 USDC. If the converted outcome wins instead, the trader already pocketed USDC during conversion, matching the original NO payout.

## Numerical Example

Event with outcomes `{A, B, C}`; trader converts `NO_A`.

1. Submit `convert(conditionId, outcome=A, amount=10)` with approvals.
2. Adapter receives `10 × NO_A`.
3. Adapter gives back:
   - `10 × YES_B`
   - `10 × YES_C`
   - `USDC = 10 × (1 - fee - market_implied_value_of(YES_B + YES_C))`
4. Vault keeps `fee × 10` USDC. Trader arbitrages mispricing if `market_implied_value_of(YES_B + YES_C)` was < 1.

## Edge Cases & Protections

- **Insufficient YES inventory**: Adapter can reject conversions if it does not hold enough YES tokens to deliver the bundle. Liquidity providers must seed the vault accordingly.
- **Invalid oracle outcome**: If UMA returns `[1,1]` for a question, the adapter reverts — markets must guarantee this cannot happen.
- **Multiple YES outcomes**: Operator rejects oracles that try to report multiple winners; otherwise `reportOutcome` reverts, halting settlement.
- **Augmented NegRisk**: Conversions still work, but placeholders/“Other” are effectively ignored by traders. The adapter treats them like any other outcome mathematically; we simply avoid trading their tokens in analytics.

## Observability Hooks

For analytics:

- Track adapter `convert` events to see volume, fees, and which outcomes are being drained.
  - `Converted(address trader, uint256 conditionId, uint8 outcome, uint256 amount, uint256 usdcOut, uint256 fee)`
- Monitor vault balances of USDC and YES tokens to detect stress.
- Cross-check outstanding NO supply vs. available YES inventory to flag conversion halts before they happen.

These details will guide any simulator or monitoring job we build to detect mispriced NegRisk events.
