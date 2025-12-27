from __future__ import annotations

from sqlalchemy import select, text

from src.db.db_core import DbCore
from src.models.market import Market, MarketDB
from src.models.price_history import PriceHistory, PriceHistoryDB


class SelectsClient:
    def __init__(self, db_core: DbCore | None = None) -> None:
        self.core = db_core or DbCore()

    async def get_market_by_condition_id(self, condition_id: str) -> Market | None:
        async with self.core.async_session() as session:
            stmt = select(MarketDB).where(MarketDB.condition_id == condition_id)
            result = await session.execute(stmt)
            market_orm = result.scalar_one_or_none()
            return Market.model_validate(market_orm) if market_orm else None

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

    async def get_price_histories_by_token_ids(
        self, token_ids: list[str]
    ) -> dict[str, PriceHistory]:
        """Fetch existing price histories keyed by clob_token_id."""
        if not token_ids:
            return {}
        async with self.core.async_session() as session:
            stmt = select(PriceHistoryDB).where(PriceHistoryDB.clob_token_id.in_(token_ids))
            result = await session.execute(stmt)
            rows = result.scalars().all()
            return {row.clob_token_id: PriceHistory.model_validate(row) for row in rows}

    async def get_top_movers(self, limit: int = 30) -> tuple[list[dict], str | None]:
        """
        Get markets with highest absolute price delta.
        Returns list of dicts with market + price info and the fetched_at timestamp.
        """
        sql = text("""
            SELECT
                ph.clob_token_id,
                ph.last_price,
                ph.price_delta,
                ph.fetched_at,
                m.question,
                m.slug,
                m.icon
            FROM price_histories ph
            JOIN markets m ON m.token1 = ph.clob_token_id
            WHERE ph.price_delta IS NOT NULL
                AND ph.last_price IS NOT NULL
                AND ph.last_price >= 0.5
                AND ph.last_price <= 99.5
            ORDER BY ABS(ph.price_delta) DESC
            LIMIT :limit
        """)
        async with self.core.engine.connect() as conn:
            result = await conn.execute(sql, {"limit": limit})
            rows = result.fetchall()

        if not rows:
            return [], None

        # Get the most recent fetched_at from the results
        fetched_at = max(row.fetched_at for row in rows).isoformat() if rows else None

        movers = [
            {
                "clob_token_id": row.clob_token_id,
                "last_price": row.last_price,
                "price_delta": row.price_delta,
                "fetched_at": row.fetched_at.isoformat(),
                "question": row.question,
                "slug": row.slug,
                "icon": row.icon,
            }
            for row in rows
        ]
        return movers, fetched_at
