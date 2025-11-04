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
