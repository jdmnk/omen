# Repository Guidelines

## Project Structure & Module Organization
The backend ships as a FastAPI service under `src/`. HTTP routers and dependency wiring live in `src/api`, database models/migrations in `src/db`, typed domain schemas in `src/models`, and cross-service clients in `src/polymarket`. Utility helpers reside in `src/utils`, while analytics notebooks and reports are in `src/analytics`. `docs/` holds OpenAPI snapshots plus ops notes, and `scripts/` contains one-off data jobs. Treat each feature as a vertical slice—API route, CRUD logic, and background tasks should live side by side inside the relevant subpackage.

## Build, Test, and Development Commands
- `poetry install`: Sync the virtualenv to `pyproject.toml`.
- `docker compose up --build`: Run the production-like stack (app + Postgres + Redis).
- `docker compose -f docker-compose.dev.yml up --build`: Developer stack with live reload.
- `poetry run uvicorn src.server:app --reload`: Run FastAPI locally without Docker when you only need the app tier.
- `poetry run ruff check .` / `poetry run ruff format .`: Lint and format per repo policy.
- `docker compose exec app python -m src.db.db_init --reset`: Drop/recreate schema, then reseed with `src.db.db_populate_*`.

## Coding Style & Naming Conventions
Target Python 3.11, four-space indentation, and explicit type hints. Business entities should extend `pydantic.BaseModel`; tables belong to SQLAlchemy declarative models under `src/db`. Files and modules use snake_case, classes are PascalCase, and coroutine helpers should be suffixed with `_async` only when there is a sync counterpart. Keep request/response DTOs near the route module, and export shared settings via `src/settings.py`. Ruff enforces import ordering, docstrings on public async functions, and trailing commas—run it before committing.

## Testing Guidelines
Automated tests are still sparse (`src/tests.py` is an integration harness), so treat `docker compose exec app python -m src.tests` plus manual API verification (e.g., via the FastAPI docs at `/docs`) as part of your checklist. When writing new tests, use `pytest` + `httpx.AsyncClient`, store them under `src/tests/`, and create fixtures for external RPC services so the suite can run offline. Every new route should have at least one happy-path test plus failure coverage for validation errors or empty datasets.

## Commit & Pull Request Guidelines
Keep commit subjects short and imperative (`add new cmds to readme`). Bundle schema changes with the scripts that rely on them. Pull requests must list the commands you ran (`poetry run ruff check .`, `docker compose exec app python -m src.db.db_populate`) and include API samples or screenshots when response formats change. Rebase before requesting review, ensure migrations are idempotent, and avoid committing `.env` or generated analytics artifacts.

## Security & Configuration Tips
Environment variables live in `.env` (mounted by Docker) and are parsed through `src/settings.py` using `pydantic-settings`; never commit these files. Keep RPC URLs, database creds, and API tokens scoped to the least privilege required for analytics jobs. When the API surface changes, regenerate `openapi.json` from a running app and double-check that no secret defaults end up in schema examples. Validate new secrets inside `Settings.model_validate` so the service fails fast instead of booting with `None`. Rotate per-market API keys via the infrastructure repo, and avoid storing generated CSV/plots in git—ship them to object storage instead.
