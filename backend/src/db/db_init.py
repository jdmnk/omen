import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from src.settings import settings
from src.models.market import Base
from sqlalchemy import text


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

        # KNN trigram index on normalized question for ORDER BY <->

        # Normalized (lower + collapsed whitespace) GiST trigram index for KNN on normalized text
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS markets_question_norm_trgm_gist
                ON markets USING GIST (
                  regexp_replace(lower(question), '\\s+', ' ', 'g') gist_trgm_ops
                )
                """
            )
        )

        # Btree prefix index on first 3 normalized chars to prune KNN candidate set for >=3 char queries
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS markets_question_norm_prefix3
                ON markets (
                  left(regexp_replace(lower(question), '\\s+', ' ', 'g'), 3)
                )
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