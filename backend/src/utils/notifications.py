from src.utils.discord_utils import notify as notify_discord
from src.utils.logging_config import get_logger, to_one_line
from src.utils.telegram_utils import notify as notify_telegram

logger = get_logger(__name__)


def notify_ops(text: str) -> None:
    """
    Fan-out notifications to all configured channels.
    """
    telegram_sent = notify_telegram(text)
    discord_sent = notify_discord(text)

    if not discord_sent:
        logger.warning("Discord notification failed: %s", to_one_line(text))

    if not telegram_sent:
        logger.info("Telegram notification skipped or failed")
