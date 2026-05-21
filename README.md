# Omen

Omen is a full-stack Polymarket analytics app. It combines a Next.js frontend, a FastAPI backend, Postgres/Redis-backed ingestion jobs, and a Graph Protocol subgraph to explore markets, users, positions, price history, order books, and holder behavior.

## Product Surface

- Search for Polymarket markets and wallets from one command-style search bar.
- Open market pages with price charts, order books, rules, top holders, and holder PnL.
- Open user pages with PnL, open/closed positions, activity, and selectable market charts.
- Add markets and users to local watchlists.
- Use the home page Top Movers widget to find markets with large recent price changes.

## Repository Layout

- `frontend/` - Next.js app with the main product UI.
- `backend/` - FastAPI service, API routes, Polymarket clients, DB models, and ingestion jobs.
- `backend/docs/` - notes for the upstream Polymarket APIs and subgraph queries used by the backend.
- `subgraphs/` - Graph Protocol PnL subgraph and shared mapping utilities.
- `backend/openapi.json` - generated OpenAPI schema used for frontend API types.

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

## Quick Start

Requirements:

- Docker and Docker Compose for the backend, Postgres, and Redis.
- Node.js plus `pnpm` for the frontend and subgraph tooling.
- Python 3.11 plus `uv` if you want to run backend commands outside Docker.

### Backend

```bash
cd backend
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

The API will be available at `http://localhost:8000`.

For backend commands outside Docker, install/sync the Python environment with:

```bash
cd backend
uv sync --dev
```

Populate local data from a second terminal:

```bash
cd backend
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_init --reset
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_markets
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_trades
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_positions
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_price_history
```

Top Movers are based on `price_delta`, so the widget needs two price-history refreshes to show movement: the first run stores baseline prices, and a later run computes deltas against that baseline.

### Frontend

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

If port `3000` is busy, run `pnpm dev -- --port 3001` and update `NEXT_PUBLIC_SITE_URL` if you need exact local metadata URLs.

### Subgraphs

```bash
cd subgraphs
pnpm install
pnpm prepare
```

See `subgraphs/README.md` for Graph CLI commands.

## Using the App

1. Start the backend and frontend.
2. Populate markets, trades, positions, and price history.
3. Open the home page and use Top Movers or search to choose a market.
4. Search for a wallet or open a holder from a market page.
5. On a user page, click a position row or checkbox to show trade details and add that market to the chart area.

## Development commands

```bash
# frontend
cd frontend
pnpm lint
pnpm type-check
pnpm build

# backend
cd backend
uv sync --dev
uv run ruff check .
uv run ruff format .
uv run pytest
uv run pip-audit
uv run python scripts/generate_types.py

# regenerate frontend API types from backend/openapi.json
cd frontend
pnpm type-gen
```

## Environment

This repo intentionally does not include secrets. Start from:

- `frontend/.env.example`
- `backend/.env.example`
- `subgraphs/.env.example`

The app currently uses public Polymarket APIs only. It does not require an authenticated CLOB key for local analytics workflows.

## Notes

- Omen is an analytics app, not investment advice or an automated trading system.
- Data quality depends on third-party APIs and indexed subgraphs.
- Local watchlists and dismissed UI hints are stored in browser local storage.
- If you fork this repo, rotate any local keys you previously used and run a secret scan before publishing your own copy.
