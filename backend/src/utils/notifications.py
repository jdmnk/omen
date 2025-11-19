from src.utils.discord_utils import notify as notify_discord
from src.utils.logging_config import get_logger, to_one_line

logger = get_logger(__name__)


def notify_ops(text: str) -> None:
    """
    Fan-out notifications to all configured channels.
    """
    discord_sent = notify_discord(text)

    if not discord_sent:
        logger.warning("Discord notification failed: %s", to_one_line(text))
