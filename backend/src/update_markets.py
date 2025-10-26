from src.polymarket.poly_client import PolyClient
from src.db.database_client import DatabaseClient
from src.utils.logging_config import get_logger
import asyncio
import signal

logger = get_logger(__name__)

async def update_markets(poly_client: PolyClient, db_client: DatabaseClient):
    markets = await poly_client.get_active_markets()
    await db_client.insert_markets(markets)

async def main():
    poly_client = PolyClient()
    db_client = DatabaseClient()

    loop = asyncio.get_event_loop()
    stop_event = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_event.set)

    def _report_task_error(task: asyncio.Task) -> None:
        try:
            exc = task.exception()
        except asyncio.CancelledError:
            return
        if exc:
            logger.error("monitor_positions_task crashed", exc_info=exc)
            stop_event.set()

    monitor_task = asyncio.create_task(update_markets(poly_client=poly_client, db_client=db_client))
    monitor_task.add_done_callback(_report_task_error)
    # telegram_task = start_telegram_bot(client, stop_event)
    stop_task = asyncio.create_task(stop_event.wait())

    wait_set = {monitor_task, stop_task}
    done, pending = await asyncio.wait(wait_set, return_when=asyncio.FIRST_COMPLETED)

    if monitor_task in done:
        try:
            await monitor_task
        except Exception:
            # exception already logged in callback
            pass

    logger.info('Stopping...')
    for task in pending:
        task.cancel()
    
    gather_set = {monitor_task, stop_task}
    await asyncio.gather(*gather_set, return_exceptions=True)

if __name__ == "__main__":
    asyncio.run(main())
