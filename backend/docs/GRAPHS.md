## Subgraph Queries

The backend uses subgraph data from two places:

- An external Polymarket positions subgraph for holder balances.
- The Omen PnL subgraph in `subgraphs/pnl-subgraph` for realized PnL, average prices, and bought amounts.

### External positions subgraph

```graphql
query GetMarketHolders($first: Int!, $skip: Int!, $tokenIds: [String!]!) {
  userBalances(first: $first, skip: $skip, where: { asset_in: $tokenIds }) {
    id
    user
    asset {
      id
      condition {
        id
        payouts
      }
      complement
      outcomeIndex
    }
    balance
  }
}
```

### Omen PnL subgraph

```graphql
query GetMarketHolders($first: Int!, $skip: Int!, $tokenIds: [BigInt!]!) {
  userPositions(
    first: $first
    skip: $skip
    orderBy: amount
    orderDirection: desc
    where: { tokenId_in: $tokenIds }
  ) {
    id
    realizedPnl
    user
    tokenId
    amount
    avgPrice
    totalBought
  }
}
```
