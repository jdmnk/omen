## Gamma Search API (/public-search)

- **Endpoint**: `GET https://gamma-api.polymarket.com/public-search`
- **Purpose**: Search for markets, events, and profiles across Polymarket
- **Official docs**: [Search markets, events, and profiles](https://docs.polymarket.com/api-reference/search/search-markets-events-and-profiles)

### Query Parameters

- **q** (required): string - Search query string
- **cache**: boolean - Whether to use cached results
- **events_status**: string - Filter events by status
- **limit_per_type**: integer - Limit results per type (events, markets, profiles)
- **page**: integer - Page number for pagination
- **events_tag**: string[] - Filter by event tags
- **keep_closed_markets**: integer - Include closed markets (0 or 1)
- **sort**: string - Sort order
- **ascending**: boolean - Sort direction
- **search_tags**: boolean - Include tags in search results
- **search_profiles**: boolean - Include profiles in search results
- **recurrence**: string - Filter by recurrence type
- **exclude_tag_id**: integer[] - Exclude specific tag IDs
- **optimized**: boolean - Return optimized image URLs

### Response

Returns search results with three main sections:

```json
{
  "events": [
    {
      "id": "string",
      "ticker": "string",
      "slug": "string",
      "title": "string",
      "subtitle": "string",
      "description": "string",
      "markets": [
        {
          "id": "string",
          "question": "string",
          "conditionId": "string",
          "slug": "string",
          "category": "string",
          "liquidity": "string",
          "volume": "string",
          "outcomePrices": "string",
          "outcomes": "string",
          "active": true,
          "closed": false
        }
      ],
      "liquidity": 123,
      "volume": 123,
      "active": true,
      "closed": false
    }
  ],
  "tags": [
    {
      "id": "string",
      "label": "string",
      "slug": "string",
      "event_count": 123
    }
  ],
  "profiles": [
    {
      "id": "string",
      "name": "string",
      "user": 123,
      "profileImage": "string",
      "bio": "string"
    }
  ],
  "pagination": {
    "hasMore": true,
    "totalResults": 123
  }
}
```

### Example Request

```bash
curl --request GET \
  --url "https://gamma-api.polymarket.com/public-search?q=bitcoin&limit_per_type=10&page=1"
```

