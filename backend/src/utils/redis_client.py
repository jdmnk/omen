import json
from typing import Any

import redis
from redis import Redis

from src.settings import settings
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class RedisClient:
    """
    Redis client wrapper for caching operations.
    """

    def __init__(self, redis_url: str | None = None):
        """
        Initialize Redis client.

        Args:
            redis_url: Optional Redis URL. Defaults to settings.redis_url.
        """
        self.redis_url = redis_url or settings.redis_url
        self.client: Redis[str] | None = None
        self._connected = False
        try:
            self.client = redis.from_url(
                self.redis_url, decode_responses=True, socket_connect_timeout=5
            )
            # Test connection
            self.client.ping()
            self._connected = True
            logger.info(f"Redis client connected to {self.redis_url}")
        except Exception as exc:
            logger.warning(f"Failed to connect to Redis: {exc}. Caching will be disabled.")
            self._connected = False

    def get(self, key: str) -> Any | None:
        """
        Get value from Redis cache.

        Args:
            key: Cache key

        Returns:
            Cached value (deserialized from JSON) or None if not found
        """
        if not self._connected or self.client is None:
            return None
        try:
            value = self.client.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception as exc:
            logger.error(f"Redis get error for key {key}: {exc}")
            return None

    def set(self, key: str, value: Any, expiry_seconds: int = 86400) -> bool:
        """
        Set value in Redis cache with expiry.

        Args:
            key: Cache key
            value: Value to cache (will be serialized to JSON)
            expiry_seconds: Expiry time in seconds (default: 86400 = 24 hours)

        Returns:
            True if successful, False otherwise
        """
        if not self._connected or self.client is None:
            return False
        try:
            serialized = json.dumps(value, default=str)
            self.client.setex(key, expiry_seconds, serialized)
            return True
        except Exception as exc:
            logger.error(f"Redis set error for key {key}: {exc}")
            return False

    def delete(self, key: str) -> bool:
        """
        Delete key from Redis cache.

        Args:
            key: Cache key

        Returns:
            True if successful, False otherwise
        """
        if not self._connected or self.client is None:
            return False
        try:
            self.client.delete(key)
            return True
        except Exception as exc:
            logger.error(f"Redis delete error for key {key}: {exc}")
            return False

    def exists(self, key: str) -> bool:
        """
        Check if key exists in Redis cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        if not self._connected or self.client is None:
            return False
        try:
            return bool(self.client.exists(key))
        except Exception as exc:
            logger.error(f"Redis exists error for key {key}: {exc}")
            return False


# Global Redis client instance
redis_client = RedisClient()
