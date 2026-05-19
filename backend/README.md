# Backend

FastAPI service for Omen market analytics. It exposes the API consumed by the frontend, stores normalized Polymarket data in Postgres, uses Redis for worker/cache support, and includes jobs for market, trade, position, and price-history ingestion.

## Local Development

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Reset and populate the local database:

```bash
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_init --reset
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_markets
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_trades
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_positions
docker compose -f docker-compose.dev.yml exec app python -m src.db.db_populate_price_history
```

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
poetry run ruff check .
poetry run ruff format .
```

## API Schema

The generated OpenAPI schema lives at `openapi.json`. When backend response models change, regenerate the schema and then run the frontend type generation command:

```bash
cd ../frontend
pnpm type-gen
```

## Environment

Start from `.env.example`. Keep local `.env` files and private keys out of Git.
