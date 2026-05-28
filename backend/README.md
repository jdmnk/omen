# Backend

FastAPI service for Omen market analytics. It exposes the API consumed by the frontend, stores normalized Polymarket data in Postgres, uses Redis for worker/cache support, and includes jobs for market, trade, position, and price-history ingestion.

## Requirements

- Docker and Docker Compose for the recommended local setup.
- Python 3.11 and `uv` for local linting, audits, or non-Docker scripts.

## Run Locally

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

The API runs on `http://localhost:8000`. Interactive API docs are available at `http://localhost:8000/docs`.

## Local uv Environment

Docker is the recommended runtime because the API expects Postgres and Redis.
For local scripts, linting, audits, and schema generation:

```bash
uv sync --dev
uv run python scripts/generate_types.py
```

## Populate Local Data

Reset the schema and populate the main tables:

```bash
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_init --reset
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_markets
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_trades
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_positions
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_price_history
```

The order matters:

- `db_init --reset` creates a clean local schema.
- `db_populate_markets` loads active markets and event links.
- `db_populate_trades` and `db_populate_positions` support user profile and holder views.
- `db_populate_price_history` powers market charts and Top Movers.

Top Movers require price deltas. Run `db_populate_price_history` once to create baseline prices, then run it again later to compute `price_delta` values used by `/markets/top-movers`.

Run the price-history worker manually:

```bash
docker compose -f docker-compose.dev.yml exec app python -m src.workers.price_history_updater
```

## Database Checks

```bash
docker compose -f docker-compose.dev.yml exec db psql -U user -d mydb -c "SELECT count(condition_id) FROM markets;"
docker compose -f docker-compose.dev.yml exec db psql -U user -d mydb -c "SELECT count(clob_token_id) FROM price_histories;"
docker compose -f docker-compose.dev.yml exec db psql -U user -d mydb -c 'SELECT COUNT(DISTINCT "proxyWallet") FROM trades;'
```

## Linting

Ruff is configured via `ruff.toml`.

```bash
uv sync --dev
uv run ruff check .
uv run ruff format .
```

## Dependency Audit

```bash
uv run pip-audit
```

## API Schema

The generated OpenAPI schema lives at `openapi.json`. When backend response models change, regenerate the schema and then run the frontend type generation command:

```bash
cd ../frontend
pnpm type-gen
```

## Environment

Start from `.env.example`. Keep local `.env` files and private keys out of Git.

The backend uses public Polymarket APIs for analytics data. It does not require a Polymarket private key.
