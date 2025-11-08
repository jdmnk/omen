from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from src.db.db_core import DbCore
from src.models.event import EventDB, Event
from src.models.event_market import EventMarket
from src.models.market import MarketDB, Market
from src.models.trade import TradeDB, Trade
from src.models.user_position import UserPositionDB, UserPosition
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class InsertsClient:
    def __init__(self, db_core: DbCore | None = None) -> None:
        self.core = db_core or DbCore()

    async def insert_markets(self, markets: list[Market], chunk_size: int = 1000) -> int:
        if not markets:
            return 0
        total = 0
        async with self.core.async_session() as session:
            for start in range(0, len(markets), chunk_size):
                batch = markets[start : start + chunk_size]
                values = [m.model_dump() for m in batch]

                stmt = pg_insert(MarketDB).values(values)
                update_fields = {
                    col: stmt.excluded[col]
                    for col in MarketDB.__table__.columns.keys()
                    if col not in ["condition_id", "fetched_at"]
                }
                update_fields["fetched_at"] = text("now()")
                stmt = stmt.on_conflict_do_update(
                    index_elements=["condition_id"], set_=update_fields
                )

                await session.execute(stmt)
                total += len(batch)
                await session.commit()
        return total

    async def insert_events(self, events: list[Event], chunk_size: int = 500) -> int:
        if not events:
            return 0
        total = 0
        async with self.core.async_session() as session:
            for start in range(0, len(events), chunk_size):
                batch = events[start : start + chunk_size]
                values = [e.model_dump() for e in batch]

                stmt = pg_insert(EventDB).values(values)
                update_fields = {
                    col: stmt.excluded[col]
                    for col in EventDB.__table__.columns.keys()
                    if col not in ["id", "fetched_at"]
                }
                update_fields["fetched_at"] = text("now()")
                stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_fields)

                await session.execute(stmt)
                total += len(batch)
                await session.commit()
        return total

    async def insert_event_markets_from_events(
        self, events: list[Event], chunk_size: int = 2000
    ) -> int:
        # Build mapping from schemas' raw payloads
        mappings: list[dict] = []
        for ev in events:
            ev_id = ev.id
            mkts = (ev.raw or {}).get("markets", []) if isinstance(ev.raw, dict) else []
            for idx, mk in enumerate(mkts):
                cid = mk.get("conditionId") or mk.get("condition_id")
                if not cid:
                    continue
                mappings.append({"event_id": str(ev_id), "condition_id": str(cid), "position": idx})

        if not mappings:
            return 0

        total = 0
        async with self.core.async_session() as session:
            for start in range(0, len(mappings), chunk_size):
                batch = mappings[start : start + chunk_size]
                stmt = pg_insert(EventMarket).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["event_id", "condition_id"],
                    set_={"position": stmt.excluded.position},
                )
                await session.execute(stmt)
                total += len(batch)
                await session.commit()
        return total

    async def insert_trades(self, trades: list[Trade], chunk_size: int = 1000) -> int:
        if not trades:
            return 0
        total = 0
        try:
            async with self.core.async_session() as session:
                for start in range(0, len(trades), chunk_size):
                    batch = trades[start : start + chunk_size]
                    values = [t.model_dump() for t in batch]

                    stmt = pg_insert(TradeDB).values(values)
                    update_fields = {
                        col: stmt.excluded[col]
                        for col in TradeDB.__table__.columns.keys()
                        if col not in ["transactionHash", "fetched_at"]
                    }
                    update_fields["fetched_at"] = text("now()")
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["transactionHash"], set_=update_fields
                    )

                    await session.execute(stmt)
                    total += len(batch)
                    await session.commit()
        except Exception as e:
            logger.error("Error inserting trades %s", e)
            raise e

        return total

    async def insert_user_positions(
        self, positions: list[UserPositionSchema], chunk_size: int = 1000
    ) -> int:
        if not positions:
            return 0
        total = 0
        async with self.core.async_session() as session:
            for start in range(0, len(positions), chunk_size):
                batch = positions[start : start + chunk_size]
                values = [p.model_dump() for p in batch]

                stmt = pg_insert(UserPositionDB).values(values)
                update_fields = {
                    col: stmt.excluded[col]
                    for col in UserPositionDB.__table__.columns.keys()
                    if col not in ["proxyWallet", "asset", "fetched_at"]
                }
                update_fields["fetched_at"] = text("now()")
                stmt = stmt.on_conflict_do_update(
                    index_elements=["proxyWallet", "asset"], set_=update_fields
                )

                await session.execute(stmt)
                total += len(batch)
                await session.commit()
        return total
