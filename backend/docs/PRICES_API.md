## CLOB Prices API (/prices)

- **Endpoint**: `POST https://clob.polymarket.com/prices`
- **Purpose**: Retrieve prices for specified token IDs and sides in a single request.
- **Official docs**: [Get multiple market prices by request](https://docs.polymarket.com/api-reference/pricing/get-multiple-market-prices-by-request)

### Request Body

Array of objects with:

- **token_id**: string (CLOB token id)
- **side**: `BUY` or `SELL`

Example:

```json
[
  { "token_id": "1234567890", "side": "BUY" },
  { "token_id": "0987654321", "side": "SELL" }
]
```

### Response

Map of `token_id` to side-to-price mapping. Prices are returned as strings.

```json
{
  "1234567890": { "BUY": "1800.50", "SELL": "1801.00" },
  "0987654321": { "BUY": "50.25", "SELL": "50.30" }
}
```
