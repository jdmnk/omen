from __future__ import annotations

from sqlalchemy import select, text

from src.db.db_core import DbCore
from src.models.market import MarketDB, Market
from src.models.public import MarketAutocompleteItem


class SelectsClient:
    def __init__(self, db_core: DbCore | None = None) -> None:
        self.core = db_core or DbCore()

    async def get_market_by_condition_id(self, condition_id: str) -> Market | None:
        async with self.core.async_session() as session:
            stmt = select(MarketDB).where(MarketDB.condition_id == condition_id)
            result = await session.execute(stmt)
            market_orm = result.scalar_one_or_none()
            return Market.model_validate(market_orm) if market_orm else None

    async def autocomplete_markets(
        self, query: str, limit: int = 10
    ) -> list[MarketAutocompleteItem]:
        q = (query or "").strip()
        if not q:
            return []

        sql = text(
            """
            SELECT slug, question
            FROM markets
            WHERE :query <% question
            ORDER BY :query <<-> question
            LIMIT :limit
            """
        )
        params = {"query": q, "limit": limit}
        async with self.core.engine.connect() as conn:
            rows = (await conn.execute(sql, params)).mappings().all()
            return [MarketAutocompleteItem(slug=r["slug"], question=r["question"]) for r in rows]

    async def get_markets_by_volume_and_liquidity(
        self, *, min_volume: float, min_liquidity: float, limit: int | None = None
    ) -> list[Market]:
        async with self.core.async_session() as session:
            stmt = (
                select(MarketDB)
                .where(MarketDB.volume >= min_volume, MarketDB.liquidity >= min_liquidity)
                .order_by(MarketDB.volume.desc())
            )
            if limit is not None and limit > 0:
                stmt = stmt.limit(limit)

            result = await session.execute(stmt)
            markets = result.scalars().all()
            return [Market.model_validate(m) for m in markets]

    async def get_distinct_trade_wallets(self, limit: int | None = None) -> list[str]:
        sql = 'SELECT DISTINCT "proxyWallet" FROM trades ORDER BY "proxyWallet"'
        params: dict | None = None
        if limit is not None and limit > 0:
            sql += " LIMIT :limit"
            params = {"limit": limit}
        async with self.core.engine.connect() as conn:
            rows = (await conn.execute(text(sql), params or {})).scalars().all()
            return [str(r) for r in rows]
