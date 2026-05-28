## Endpoints

Events: https://gamma-api.polymarket.com/events/keyset
Markets (subset of events): https://gamma-api.polymarket.com/markets

The most efficient approach is to use the `/events/keyset` endpoint and work backwards, as events contain their associated markets. Polymarket added cursor-based keyset endpoints in April 2026; use each response's `next_cursor` as `after_cursor` on the next request. Do not send `offset` to keyset endpoints.

- For Individual Markets: Always use the slug method for best performance
- For Category Browsing: Use tag filtering to reduce API calls
- For Complete Market Discovery: Use the events keyset endpoint with cursor pagination
- Always Include closed=false: Unless you specifically need historical data
- Implement Rate Limiting: Respect API limits for production applications
  ​

## CLOB V2 Notes

Production CLOB V2 runs on the unchanged host `https://clob.polymarket.com`.

- This app only uses public CLOB REST endpoints for read-only analytics data, so it does not need a CLOB SDK or private key.
- If authenticated trading flows are added later, use `py-clob-client-v2`; the legacy `py-clob-client` package only supports V1.
- Auth headers are unchanged, but V2 order signing removed `nonce`, `feeRateBps`, and `taker`.
- Fees are protocol-handled at match time; do not add manual order fee fields.
- Builder attribution uses `builderCode` on orders instead of `POLY_BUILDER_*` HMAC headers.
- API-only trading flows use pUSD collateral handling; analytics/read-only CLOB market data endpoints remain on the same host.
