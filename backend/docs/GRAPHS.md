## Subgraphs

Positions subgraph:

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

Pnl subgraph:

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
