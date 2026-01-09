## Local dev

```bash
# spin up services
docker compose up --build
# spinds up services in dev mode
docker compose -f docker-compose.dev.yml up --build

# rebuild just app + reinstall in dev
docker compose -f docker-compose.dev.yml up -d --build --no-deps app

# fresh start
docker compose exec app python -m src.db.db_init --reset
docker compose exec app python -m src.db.db_populate_markets
docker compose exec app python -m src.db.db_populate_trades
docker compose exec app python -m src.db.db_populate_positions
docker compose exec app python -m src.db.db_populate_price_history

# update in a loop
docker compose exec app python -m src.workers.price_history_updater
# current unused
docker compose exec app python -m src.update_markets
```

Docker VPS:

```bash
docker compose up -d
docker compose ps
docker compose logs
docker compose logs --tail 100 app

# main
docker compose up -d --build --no-deps app

# price history worker
docker compose up -d --build price-history-worker
docker compose restart price-history-worker

# wipe it all and start fresh (run where docker compose file is):
docker compose down --rmi all --volumes --remove-orphans

# rebuild/redeploy app
git pull
docker compose up -d --build --no-deps app
```

Database Management:

```bash
docker compose exec db psql -U user -d mydb -c "SELECT count(condition_id) FROM markets;"
docker compose exec db psql -U user -d mydb -c "SELECT count(clob_token_id) FROM price_histories;"

docker compose exec db psql -U user -d mydb -c 'SELECT COUNT(DISTINCT "proxyWallet") FROM trades;'
```

VPS general:

```bash
scp .env.prod jure@46.224.29.26:/home/jure/polyapp/backend/.env
```

Workflows:

```bash
# Reset database (drop all tables, recreate from models, and populate)
docker compose exec app python -m src.db.db_init --reset

# Populate
docker compose exec app python -m src.db.db_populate
```

## Linting (Ruff)

Ruff is configured via `ruff.toml` and installed as a dev dependency.

Run locally (from `backend/`):

```bash
# Lint
poetry run ruff check .

# Format
poetry run ruff format .

poetry run ruff check --fix .
```
