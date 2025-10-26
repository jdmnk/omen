from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from src.settings import settings


def get_async_engine() -> AsyncEngine:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    return engine