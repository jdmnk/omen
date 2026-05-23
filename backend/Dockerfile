FROM python:3.11-slim AS base

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.8.15 /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

# Copy dependency files first (for caching)
COPY pyproject.toml uv.lock ./

# Install dependencies only
RUN uv sync --frozen --no-dev --no-install-project

# Copy source
COPY . .

# Expose port
EXPOSE 8000

# Default mode = prod, can override with: MODE=dev
ENV MODE=prod

# Run via server.py (decides between uvicorn/gunicorn)
CMD ["python", "-m", "src.server"]
