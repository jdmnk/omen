## Local dev

```bash
# spin up services
docker compose up --build

# fresh start
docker compose exec app python -m src.db.db_init --reset
docker compose exec app python -m src.db.db_populate_markets
docker compose exec app python -m src.db.db_populate_trades

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
```

Database Management:

- **Reset database (drop all tables & recreate)**: `docker compose exec app python -m src.db.db_init --reset`
- **Create tables only**: `docker compose exec app python -m src.db.db_init`
- **Check markets**: `docker compose exec db psql -U user -d mydb -c "SELECT *  FROM markets order by slug limit 1;"`

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

## TODO

Tasks:

- per user / per position: insider score / whale score
- per market: whale interest (smart money interest)
