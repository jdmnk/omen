from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.models.event import EventDB, Event, parse_event_from_api
from src.models.event_market import EventMarket
from src.models.graph.position import PositionDB, Position, parse_position_from_api
from src.models.market import MarketDB, Market, parse_market_from_api
from src.models.trade import TradeDB, Trade
from src.models.user_position import UserPositionDB, UserPosition
from src.settings import settings
from src.utils.logging_config import get_logger

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
        parsed_markets: list[Market] = []
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
                stmt = pg_insert(MarketDB).values(values)

                # On conflict, update all fields except primary key
                update_fields = {
                    col: stmt.excluded[col]
                    for col in MarketDB.__table__.columns.keys()
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

    async def insert_events(self, events: list[dict], chunk_size: int = 500) -> int:
        """
        Upsert events by id and store full raw payload.

        Returns number of events upserted.
        """
        parsed_events: list[Event] = []
        for ev_dict in events:
            parsed = parse_event_from_api(ev_dict)
            if parsed:
                parsed_events.append(parsed)

        if not parsed_events:
            logger.info("No valid event rows to upsert.")
            return 0

        total_upserted = 0
        async with self.async_session() as session:
            for start in range(0, len(parsed_events), chunk_size):
                batch = parsed_events[start : start + chunk_size]

                values = [e.model_dump() for e in batch]

                stmt = pg_insert(Event).values(values)

                update_fields = {
                    col: stmt.excluded[col]
                    for col in Event.__table__.columns.keys()
                    if col not in ["id", "fetched_at"]
                }
                update_fields["fetched_at"] = text("now()")

                stmt = stmt.on_conflict_do_update(
                    index_elements=["id"],
                    set_=update_fields,
                )

                await session.execute(stmt)
                total_upserted += len(batch)
                await session.commit()

        logger.info("Inserted/updated %d event rows into DB", total_upserted)
        return total_upserted

    async def insert_event_markets(self, events: list[dict], chunk_size: int = 2000) -> int:
        """
        Create/refresh links between events and markets, preserving market order within an event.
        """
        mappings: list[dict] = []
        for ev in events:
            ev_id = ev.get("id")
            if ev_id is None:
                continue
            markets = ev.get("markets", []) or []
            for idx, mk in enumerate(markets):
                cond_id = mk.get("conditionId") or mk.get("condition_id")
                if not cond_id:
                    continue
                mappings.append(
                    {
                        "event_id": str(ev_id),
                        "condition_id": str(cond_id),
                        "position": idx,
                    }
                )

        if not mappings:
            logger.info("No event->market links to upsert.")
            return 0

        total_upserted = 0
        async with self.async_session() as session:
            for start in range(0, len(mappings), chunk_size):
                batch = mappings[start : start + chunk_size]

                stmt = pg_insert(EventMarket).values(batch)

                # Update position if the link exists
                stmt = stmt.on_conflict_do_update(
                    index_elements=["event_id", "condition_id"],
                    set_={"position": stmt.excluded.position},
                )

                await session.execute(stmt)
                total_upserted += len(batch)
                await session.commit()

        logger.info("Inserted/updated %d event->market links", total_upserted)
        return total_upserted

    async def insert_trades(self, trades: list[Trade], chunk_size: int = 1000) -> int:
        """
        Upsert trades by transactionHash. Expects already parsed TradeSchema items.
        """
        if not trades:
            logger.info("No trade rows to upsert.")
            return 0

        total_upserted = 0
        async with self.async_session() as session:
            for start in range(0, len(trades), chunk_size):
                batch = trades[start : start + chunk_size]
                # Use pydantic dicts directly; ORM/driver will coerce types
                values = [t.model_dump() for t in batch]

                stmt = pg_insert(TradeORM).values(values)
                update_fields = {
                    col: stmt.excluded[col]
                    for col in TradeORM.__table__.columns.keys()
                    if col not in ["transactionHash", "fetched_at"]
                }
                update_fields["fetched_at"] = text("now()")

                stmt = stmt.on_conflict_do_update(
                    index_elements=["transactionHash"], set_=update_fields
                )

                await session.execute(stmt)
                total_upserted += len(batch)
                await session.commit()

        logger.info("Inserted/updated %d trades into DB", total_upserted)
        return total_upserted

    async def get_markets_by_volume_and_liquidity(
        self, *, min_volume: float, min_liquidity: float, limit: int | None = None
    ) -> list[str]:
        """
        Return condition_ids for markets meeting volume and liquidity thresholds.
        """
        sql = text(
            """
            SELECT condition_id
            FROM markets
            WHERE volume >= :min_volume
              AND liquidity >= :min_liquidity
            ORDER BY volume DESC
            """
        )
        params: dict = {
            "min_volume": min_volume,
            "min_liquidity": min_liquidity,
        }
        if limit is not None and limit > 0:
            sql = text(
                """
                SELECT condition_id
                FROM markets
                WHERE volume >= :min_volume
                  AND liquidity >= :min_liquidity
                ORDER BY volume DESC
                LIMIT :limit
                """
            )
            params["limit"] = limit

        async with self.engine.connect() as conn:
            rows = (await conn.execute(sql, params)).scalars().all()
            return [str(r) for r in rows]

    async def insert_user_positions(
        self, positions: list[UserPositionSchema], chunk_size: int = 1000
    ) -> int:
        """
        Upsert user positions by composite key (proxyWallet, asset).
        Expects already parsed UserPositionSchema items.
        """
        if not positions:
            logger.info("No user positions to upsert.")
            return 0

        total_upserted = 0
        async with self.async_session() as session:
            for start in range(0, len(positions), chunk_size):
                batch = positions[start : start + chunk_size]
                values = [p.model_dump() for p in batch]

                stmt = pg_insert(UserPositionORM).values(values)
                update_fields = {
                    col: stmt.excluded[col]
                    for col in UserPositionORM.__table__.columns.keys()
                    if col not in ["proxyWallet", "asset", "fetched_at"]
                }
                update_fields["fetched_at"] = text("now()")

                stmt = stmt.on_conflict_do_update(
                    index_elements=["proxyWallet", "asset"],
                    set_=update_fields,
                )

                await session.execute(stmt)
                total_upserted += len(batch)
                await session.commit()

        logger.info("Inserted/updated %d user positions", total_upserted)
        return total_upserted

    async def get_distinct_trade_wallets(self, limit: int | None = None) -> list[str]:
        sql = "SELECT DISTINCT proxyWallet FROM trades ORDER BY proxyWallet"
        if limit is not None and limit > 0:
            sql += " LIMIT :limit"
        params = {"limit": limit} if limit else {}
        async with self.engine.connect() as conn:
            rows = (await conn.execute(text(sql), params)).scalars().all()
            return [str(r) for r in rows]

    async def delete_all_markets(self) -> int:
        sql = text("DELETE FROM markets")
        async with self.engine.connect() as conn:
            res = await conn.execute(sql)
            deleted = res.rowcount
            print(deleted)
        return deleted

    async def get_market_by_condition_id(self, condition_id: str) -> MarketDB | None:
        """
        Get a market by condition_id using the ORM.
        Returns the Market ORM model for full type safety.

        Example:
            market = await db.get_market_by_condition_id("0x123...")
            if market:
                print(f"{market.slug}: ${market.liquidity}")
        """
        async with self.async_session() as session:
            stmt = select(MarketDB).where(MarketDB.condition_id == condition_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_market_by_slug(self, slug: str) -> MarketDB | None:
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
            stmt = select(MarketDB).where(MarketDB.slug == slug)
            result = await session.execute(stmt)
            market_orm = result.scalar_one_or_none()

            return market_orm

    async def autocomplete_markets(self, query: str, limit: int = 10) -> list[dict]:
        """
        Fuzzy search markets by question text using trigram matching.
        Finds similar text anywhere in the question string.
        Returns lightweight dicts: { slug, question }.
        """
        q = (query or "").strip()
        if not q:
            return []

        # Fuzzy search using word_similarity - finds best matching substring anywhere in question
        sql = text(
            """
            SELECT slug, question
            FROM markets
            WHERE :query <% question
            ORDER BY :query <<-> question
            LIMIT :limit
            """
        )
        params = {
            "query": q,
            "limit": limit,
        }

        async with self.engine.connect() as conn:
            rows = (await conn.execute(sql, params)).mappings().all()
            return [{"slug": r["slug"], "question": r["question"]} for r in rows]

    async def insert_positions(self, positions: list[dict], chunk_size: int = 1000) -> int:
        """
        Upsert positions by id.

        - Parses input dicts using PositionSchema for validation
        - Uses PostgreSQL ON CONFLICT (id) DO UPDATE to upsert
        """
        # Parse and validate
        parsed_positions: list[PositionSchema] = []
        for pos_dict in positions:
            parsed = parse_position_from_api(pos_dict)
            if parsed:
                parsed_positions.append(parsed)

        if not parsed_positions:
            logger.info("No valid position rows to upsert.")
            return 0

        total_upserted = 0
        async with self.async_session() as session:
            for start in range(0, len(parsed_positions), chunk_size):
                batch = parsed_positions[start : start + chunk_size]

                values = [p.model_dump() for p in batch]

                stmt = pg_insert(Position).values(values)

                update_fields = {
                    col: stmt.excluded[col]
                    for col in Position.__table__.columns.keys()
                    if col not in ["id"]
                }

                stmt = stmt.on_conflict_do_update(
                    index_elements=["id"],
                    set_=update_fields,
                )

                await session.execute(stmt)
                total_upserted += len(batch)
                await session.commit()

        logger.info("Inserted/updated %d position rows into DB", total_upserted)
        return total_upserted
