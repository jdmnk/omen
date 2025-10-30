from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.settings import settings


class DbCore:
    def __init__(self) -> None:
        db_url = settings.database_url
        self.engine: AsyncEngine = create_async_engine(db_url, pool_pre_ping=True)
        self.async_session: async_sessionmaker[AsyncSession] = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )
