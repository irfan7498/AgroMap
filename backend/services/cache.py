"""
Simple in-memory TTL cache.
Used primarily for weather data to avoid hammering external APIs.
"""

import time
from typing import Any, Optional, Dict, Tuple


class TTLCache:
    """Thread-safe-ish in-memory cache with per-key TTL."""

    def __init__(self):
        # key -> (value, expiry_timestamp)
        self._store: Dict[str, Tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        """Return cached value if it exists and hasn't expired, else None."""
        if key in self._store:
            value, expiry = self._store[key]
            if time.time() < expiry:
                return value
            # Expired — clean up
            del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 600) -> None:
        """Store a value with a TTL (default 10 minutes)."""
        self._store[key] = (value, time.time() + ttl_seconds)

    def clear(self) -> None:
        """Flush all cached entries."""
        self._store.clear()


# Global singleton instance
weather_cache = TTLCache()
