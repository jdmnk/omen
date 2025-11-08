## Local dev

```bash
# spin up services
docker compose up --build

# fresh start
docker compose exec app python -m src.db.db_init --reset
docker compose exec app python -m src.db.db_populate_markets
docker compose exec app python -m src.db.db_populate_trades
docker compose exec app python -m src.db.db_populate_positions

# update in a loop (currently unused)
docker compose exec app python -m src.update_markets
```

Docker VPS:

```bash
docker compose up -d
docker compose ps
docker compose logs
docker compose logs --tail 100 app

# wipe it all and start fresh (run where docker compose file is):
docker compose down --rmi all --volumes --remove-orphans

# rebuild/redeploy app
git pull && docker compose up -d --build --no-deps app
```

Database Management:

```bash
docker compose exec db psql -U user -d mydb -c "SELECT count(condition_id) FROM markets;"

docker compose exec db psql -U user -d mydb -c 'SELECT COUNT(DISTINCT "proxyWallet") FROM trades;'
```

VPS general:

```bash
scp .env jure@46.224.29.26:/home/jure/polyapp/backend/.env
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
