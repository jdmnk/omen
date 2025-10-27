from sqlalchemy import text, bindparam, select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.dialects.postgresql import JSONB, insert as pg_insert
from src.utils.logging_config import get_logger
from src.settings import settings
from src.models.market import Market, MarketSchema, parse_market_from_api

logger = get_logger(__name__)


class DatabaseClient:
    def __init__(self) -> None:
        db_url = settings.database_url
        self.engine: AsyncEngine = create_async_engine(db_url, pool_pre_ping=True)
        self.async_session = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def insert_markets(self, markets: list[dict], chunk_size: int = 1000) -> int:
        """
        Insert or update markets using ORM models for type safety.
        
        Args:
            markets: List of market dicts from the Polymarket API
            chunk_size: Number of records to insert per batch
            
        Returns:
            Number of markets successfully inserted/updated
        """
        # Parse and validate markets using Pydantic
        parsed_markets: list[MarketSchema] = []
        for market_dict in markets:
            parsed = parse_market_from_api(market_dict)
            if parsed:
                parsed_markets.append(parsed)
        
        if not parsed_markets:
            logger.info("No valid market rows to upsert.")
            return 0
        
        total_inserted = 0
        async with self.async_session() as session:
            for start in range(0, len(parsed_markets), chunk_size):
                batch = parsed_markets[start : start + chunk_size]
                
                # Convert schemas to dicts for bulk insert
                values = [market.model_dump() for market in batch]
                
                # Use PostgreSQL's INSERT ... ON CONFLICT for efficient upsert
                stmt = pg_insert(Market).values(values)
                
                # On conflict, update all fields except primary key
                update_fields = {
                    col: stmt.excluded[col]
                    for col in Market.__table__.columns.keys()
                    if col not in ["condition_id", "fetched_at"]
                }
                update_fields["fetched_at"] = text("now()")
                
                stmt = stmt.on_conflict_do_update(
                    index_elements=["condition_id"],
                    set_=update_fields,
                )
                
                await session.execute(stmt)
                total_inserted += len(batch)
                await session.commit()
        
        logger.info("Inserted/updated %d market rows into DB", total_inserted)
        return total_inserted

    async def delete_all_markets(self) -> int:
        sql = text("DELETE FROM markets")
        async with self.engine.connect() as conn:
            res = await conn.execute(sql)
            deleted = res.rowcount
            print(deleted)
        return deleted

    async def get_all_markets(self) -> list[dict]:
        sql = text(
            """
            SELECT *
            FROM markets
            ORDER BY data->>'createdAt' ASC
            """
        )
        async with self.engine.connect() as conn:
            rows = (await conn.execute(sql)).mappings().all()
            return rows

    async def get_market_by_condition_id(self, condition_id: str) -> Market | None:
        """
        Get a market by condition_id using the ORM.
        Returns the Market ORM model for full type safety.
        
        Example:
            market = await db.get_market_by_condition_id("0x123...")
            if market:
                print(f"{market.slug}: ${market.liquidity}")
        """
        async with self.async_session() as session:
            stmt = select(Market).where(Market.condition_id == condition_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_market_by_slug(self, slug: str) -> Market | None:
        """
        Get a market by its slug using the ORM.
        Returns the Market ORM model for full type safety.
        
        Example:
            market = await db.get_market_by_slug("btc-100k")
            if market:
                print(f"Liquidity: ${market.liquidity}")
                print(f"Bid/Ask: {market.bestBid}/{market.bestAsk}")
        """
        async with self.async_session() as session:
            stmt = select(Market).where(Market.slug == slug)
            result = await session.execute(stmt)
            market_orm = result.scalar_one_or_none()
            
            return market_orm

    async def search_markets(self, query: str) -> dict | None:
        q = (query or "").strip()
        if not q:
            return None

        # Simple ilike search across common name fields in the JSON
        sql = text(
            """
            SELECT data
            FROM markets
            WHERE (data->>'question') ILIKE :pat
               OR (data->>'market_slug') ILIKE :pat
            ORDER BY fetched_at DESC
            """
        )

        pattern = f"%{q}%"
        async with self.engine.connect() as conn:
            rows = (await conn.execute(sql, {"pat": pattern})).mappings().all()
            if not rows:
                return None
            return rows[0].get("data")

    '''
    Returns a stripped down list for the search autocomplete
    '''
    async def get_all_markets_preview(self) -> list[dict]:
        sql = text(
            """
            SELECT question_id, data->>'market_slug' AS market_slug, data->>'question' AS question
            FROM markets
            ORDER BY fetched_at DESC
            """
        )
        async with self.engine.connect() as conn:
            rows = (await conn.execute(sql)).mappings().all()
            return rows

    async def autocomplete_markets(self, query: str, limit: int = 10) -> list[dict]:
        """
        Fuzzy autocomplete on question only using pg_trgm for performance.
        Returns lightweight dicts: { slug, question }.
        - For very short queries (len < 3), use prefix match on question.
        - For len >= 3, use trigram similarity operator % and order by similarity.
        """
        q = (query or "").strip()
        if not q:
            return []

        use_prefix = len(q) < 3

        if use_prefix:
            # Prefix search on normalized question
            sql = text(
                """
                SELECT slug, question
                FROM markets
                WHERE regexp_replace(lower(question), '\\s+', ' ', 'g') LIKE :prefix
                ORDER BY question <-> :qnorm
                LIMIT :limit
                """
            )
            params = {"prefix": f"{q.lower()}%", "qnorm": " ".join(q.lower().split()), "limit": limit}
        else:
            # Constrain by first 3 normalized characters to leverage prefix index, then KNN
            sql = text(
                """
                WITH q AS (
                  SELECT :qnorm AS qnorm, LEFT(:qnorm, 3) AS p3
                )
                SELECT m.slug, m.question
                FROM markets m, q
                WHERE LEFT(regexp_replace(lower(m.question), '\\s+', ' ', 'g'), 3) = q.p3
                ORDER BY regexp_replace(lower(m.question), '\\s+', ' ', 'g') <-> q.qnorm
                LIMIT :limit
                """
            )
            params = {"qnorm": " ".join(q.lower().split()), "limit": limit}

        async with self.engine.connect() as conn:
            rows = (await conn.execute(sql, params)).mappings().all()
            return [{"slug": r["slug"], "question": r["question"]} for r in rows]