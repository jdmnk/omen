## Endpoints

Events: https://gamma-api.polymarket.com/events
Markets (subset of events): https://gamma-api.polymarket.com/markets

The most efficient approach is to use the /events endpoint and work backwards, as events contain their associated markets.

- For Individual Markets: Always use the slug method for best performance
- For Category Browsing: Use tag filtering to reduce API calls
- For Complete Market Discovery: Use the events endpoint with pagination
- Always Include closed=false: Unless you specifically need historical data
- Implement Rate Limiting: Respect API limits for production applications
  ​

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
