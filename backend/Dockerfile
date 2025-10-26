FROM python:3.11-slim AS base

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Install Poetry
ENV POETRY_VERSION=2.2.1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# Copy dependency files first (for caching)
COPY pyproject.toml poetry.lock ./

# Install dependencies only
RUN poetry install --no-root

# Copy source
COPY . .

# Expose port
EXPOSE 8000

# Default mode = prod, can override with: MODE=dev
ENV MODE=prod

# Run via server.py (decides between uvicorn/gunicorn)
CMD ["python", "-m", "src.server"]
