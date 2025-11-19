import os

import requests

from .logging_config import get_logger, to_one_line


def _get_env(name: str) -> str | None:
    value = os.getenv(name)
    if value is not None:
        value = str(value).strip()
        if value == "":
            return None
    return value


logger = get_logger(__name__)


def send_telegram_message(
    text: str, parse_mode: str = "Markdown", disable_web_page_preview: bool = True
) -> bool:
    """
    Send a message to a Telegram chat using a bot.

    Requires the following environment variables:
    - TELEGRAM_BOT_TOKEN
    - TELEGRAM_CHAT_ID

    Returns True if the message was (apparently) sent, False otherwise.
    """
    token = _get_env("TELEGRAM_BOT_TOKEN")
    chat_id = _get_env("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        logger.info("Telegram not configured; skipping send")
        return False

    try:
        clean_text = to_one_line(text)
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": clean_text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": disable_web_page_preview,
            },
            timeout=10,
        )
        return resp.ok
    except Exception as ex:
        logger.exception("Telegram send exception: %s", ex)
        return False


def notify(text: str) -> bool:
    """
    Minimal notification shim used throughout the app. Safe to call even if
    Telegram is not configured; it will no-op.
    """
    return send_telegram_message(text)
