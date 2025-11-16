import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from src.models import (
    event as _ensure_event_model_import,  # noqa: F401
    event_market as _ensure_event_market_import,  # noqa: F401
    trade as _ensure_trade_model_import,  # noqa: F401
    user_position as _ensure_user_position_model_import,  # noqa: F401
    price_history as _ensure_price_history_model_import,  # noqa: F401
)
from src.models.market import Base
from src.settings import settings


async def drop_all_tables() -> None:
    """
    Drop all tables, indexes, and constraints.
    WARNING: This deletes ALL data!
    """
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    print("🗑️  All tables dropped.")


async def create_all_tables() -> None:
    """
    Create all tables from SQLAlchemy models.
    """
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)

    async with engine.begin() as conn:
        # Ensure required extensions
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent"))

        await conn.run_sync(Base.metadata.create_all)

        # GiST trigram index on question for similarity search and ILIKE performance
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS markets_question_trgm_gist
                ON markets USING GIST (question gist_trgm_ops)
                """
            )
        )

    print("✅ Database schema created from models.")


async def reset_db() -> None:
    """
    Drop all tables and recreate them from scratch.
    WARNING: This deletes ALL data!
    """
    print("🔄 Resetting database...")
    await drop_all_tables()
    await create_all_tables()
    print("✅ Database reset complete.")


# For backwards compatibility
async def init_db() -> None:
    """Alias for create_all_tables"""
    await create_all_tables()


if __name__ == "__main__":
    # Check if reset flag is passed
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        asyncio.run(reset_db())
    else:
        asyncio.run(init_db())
