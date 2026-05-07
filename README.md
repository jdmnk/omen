# Omen

Omen is a full-stack Polymarket analytics app. It combines a Next.js frontend, a FastAPI backend, Postgres/Redis-backed data jobs, and The Graph subgraphs to explore markets, users, positions, price history, order books, and holder behavior.

The repository is intended as a public example of a production-shaped analytics app rather than a packaged library. It shows the app structure, API contracts, ingestion jobs, generated frontend types, and UI patterns used to build a market intelligence product.

## What is included

- `frontend/` - Next.js app with market search, market detail pages, user profiles, PnL charts, watchlists, order books, top holders, and share cards.
- `backend/` - FastAPI service with Polymarket clients, database models, API routes, data population scripts, and background workers.
- `subgraphs/` - Graph Protocol mappings for Polymarket user and PnL indexing.
- `backend/openapi.json` - generated OpenAPI schema used by the frontend type generation flow.

## Architecture

```text
Next.js frontend
  -> FastAPI backend
    -> Postgres
    -> Redis
    -> Polymarket Gamma/CLOB/Data APIs
    -> GraphQL subgraphs
```

The frontend talks to the backend through `NEXT_PUBLIC_API_URL`. The backend stores market, trade, position, profile, and price-history data in Postgres, uses Redis for cached/worker data, and calls public Polymarket APIs plus subgraph endpoints for enriched analytics.

## Local setup

### Backend

```bash
cd backend
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Populate local data from another terminal:

```bash
cd backend
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_init --reset
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_markets
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_trades
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_positions
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_price_history
```

### Frontend

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

### Subgraphs

```bash
cd subgraphs
pnpm install
pnpm prepare
```

See `subgraphs/README.md` for Graph CLI commands.

## Development commands

```bash
# frontend
cd frontend
pnpm lint
pnpm type-check
pnpm build

# backend
cd backend
poetry run ruff check .
poetry run ruff format .

# regenerate frontend API types from backend/openapi.json
cd frontend
pnpm type-gen
```

## Environment

This repo intentionally does not include secrets. Start from:

- `frontend/.env.example`
- `backend/.env.example`
- `subgraphs/.env.example`

Most read-only product flows use public Polymarket APIs. Backend jobs that need authenticated CLOB access require `POLYMARKET_PRIVATE_KEY`; leave it empty unless you are intentionally running those flows with a dedicated development wallet.

## Notes for public use

- This is an example application, not investment advice or an automated trading system.
- Data quality depends on third-party APIs and indexed subgraphs.
- If you fork this repo, rotate any local keys you previously used and run a secret scan before publishing your own copy.
