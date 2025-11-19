import os

import requests

from .logging_config import get_logger, to_one_line

logger = get_logger(__name__)


def _get_env(name: str) -> str | None:
    value = os.getenv(name)
    if value is not None:
        value = str(value).strip()
        if value == "":
            return None
    return value


def send_discord_message(content: str) -> bool:
    """
    Send a message to a Discord channel through a bot user.

    Requires DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID env vars.

    Returns True if the API call succeeds, False otherwise.
    """
    token = _get_env("DISCORD_BOT_TOKEN")
    channel_id = _get_env("DISCORD_CHANNEL_ID")

    if not token or not channel_id:
        logger.info("Discord not configured; skipping send")
        return False

    try:
        clean_content = to_one_line(content)
        resp = requests.post(
            f"https://discord.com/api/v10/channels/{channel_id}/messages",
            headers={
                "Authorization": f"Bot {token}",
                "Content-Type": "application/json",
            },
            json={"content": clean_content},
            timeout=10,
        )

        if not resp.ok:
            logger.warning(
                "Discord notify failed: %s %s - %s",
                resp.status_code,
                resp.reason,
                resp.text,
            )

        return resp.ok
    except Exception:
        logger.exception("Discord send exception")
        return False


def notify(text: str) -> bool:
    """
    Minimal Discord notification shim used throughout the app.
    """
    return send_discord_message(text)
