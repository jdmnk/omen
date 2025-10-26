## Local dev

- run: `docker compose up --build`
- execute a specific script inside main container:
  - update_markets: `docker compose exec app python -m src.update_markets`
  - init db: `docker compose exec app python -m src.db.db_init`
  - populate db: `docker compose exec app python -m src.db.db_populate`

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

- `scp .env jure@46.224.29.26:/home/jure/polyapp/backend/.env`

Workflows:

```bash
# Reset database (drop all tables, recreate from models, and populate)
docker compose exec app python -m src.db.db_init --reset

# Populate
docker compose exec app python -m src.db.db_populate
```

## TODO

Tasks:

- implement graphql for fetching positions!
