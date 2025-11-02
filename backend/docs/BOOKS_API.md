## CLOB Order Books API (/books)

- Endpoint: `POST https://clob.polymarket.com/books`
- Purpose: Retrieve order book summaries for specified token IDs in one call
- Official docs: [Get multiple order books summaries by request](https://docs.polymarket.com/api-reference/orderbook/get-multiple-order-books-summaries-by-request)

### Request Body

Array of objects with:

- **token_id**: string (CLOB token id)

Example:

```json
[{ "token_id": "1234567890" }, { "token_id": "0987654321" }]
```

### Response

Array of order book summaries. Prices and sizes are strings.

```json
[
  {
    "market": "0x1b6f76e5b8587ee896c35847e12d11e75290a8c3934c5952e8a9d6e4c6f03cfa",
    "asset_id": "1234567890",
    "timestamp": "2023-10-01T12:00:00Z",
    "hash": "0xabc123def456...",
    "bids": [{ "price": "1800.50", "size": "10.5" }],
    "asks": [{ "price": "1800.50", "size": "10.5" }],
    "min_order_size": "0.001",
    "tick_size": "0.01",
    "neg_risk": false
  }
]
```
