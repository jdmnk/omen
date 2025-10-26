import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from src.settings import settings
from src.db.models import Base


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
        await conn.run_sync(Base.metadata.create_all)

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