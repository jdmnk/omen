import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# Quiet noisy third-party loggers
# logging.getLogger("httpx").setLevel(logging.WARNING)
# logging.getLogger("httpcore").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def quiet_httpx_logging(level: int = logging.WARNING) -> None:
    """Raise log level for noisy HTTP clients."""
    logging.getLogger("httpx").setLevel(level)
    logging.getLogger("httpcore").setLevel(level)


def get_message_only_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Logger that prints only the message payload (no time/level/name).
    Does not propagate to the root to avoid basicConfig formatting.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = False
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setLevel(level)
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(handler)
    return logger


def to_one_line(text: str) -> str:
    """
    Collapse whitespace and newlines to a single space for clean one-line logs/messages.
    """
    try:
        return " ".join(str(text).split())
    except Exception:
        return str(text)
