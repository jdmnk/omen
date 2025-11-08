# Type Generation

This directory contains the type generation setup for sharing types between the Python backend and TypeScript frontend.

## How It Works

1. **Backend** generates an OpenAPI schema from FastAPI models
2. **Frontend** uses `openapi-typescript` to generate TypeScript types from the schema
3. Post-processing creates clean type exports (no nested `components["schemas"]` access needed)

## Usage

```bash
# From frontend directory
pnpm generate-types

# Or from backend directory
poetry run python scripts/generate_types.py
```

## Generated Files

- `backend/openapi.json` - OpenAPI schema (auto-generated, gitignored)
- `frontend/src/lib/models/api.models.generated.ts` - Generated TypeScript types
- `frontend/src/lib/models/frontend.models.ts` - Frontend-only types (manual)
- `frontend/src/lib/models/api.models.ts` - Re-exports and convenience types

## Type Usage

### Backend Types (auto-generated)

```typescript
import { MarketSchema, ClobReward, TradeSchema } from "@/lib/models/api.models";

// Clean, direct access - no components["schemas"] needed!
const market: MarketSchema = { ... };
const reward: ClobReward = { ... };
```

### Frontend-Only Types (manual)

```typescript
import { Interval, OrderBookResponse } from "@/lib/models/api.models";

const interval: Interval = "1d";
const orderbook: OrderBookResponse = { ... };
```

## Available Types

### From Backend (auto-generated)
- `MarketSchema` - Market data with reward fields
- `ClobReward` - CLOB reward configuration
- `EventSchema` - Event data
- `TradeSchema` - Trade data
- `TopHolderSchema` - Top holder with wallet info
- `SearchMarketItem`, `SearchEventItem`, `SearchResponse` - Search types
- `MarketAutocompleteItem` - Autocomplete item
- `UserTradesGroup` - Grouped trades by user
- And more...

### Frontend-Only
- `Interval` - Chart interval type
- `OrderBookLevel`, `OrderBookResponse` - OrderBook types
- `UserConditionStats`, `UserHoldingsSummary` - User aggregation types

## Adding New Types

### Backend Types
Just add or modify Pydantic models in the backend. The types will be generated automatically.

### Frontend-Only Types
Add them to `frontend/src/lib/models/frontend.models.ts`

## Notes

- `-Input` and `-Output` variants are generated for Pydantic models
  - `MarketSchema` = Output variant (what API returns)
  - `MarketSchemaInput` = Input variant (what API accepts)
- Types stay in sync with FastAPI endpoints automatically
- No manual maintenance of type lists needed

