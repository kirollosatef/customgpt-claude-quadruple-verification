"""TTL-aware LRU cache with pattern invalidation and statistics."""

import fnmatch
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass, field


@dataclass
class _CacheEntry:
    value: object
    expire_at: float | None  # None means no expiration


@dataclass
class CacheStats:
    hits: int = 0
    misses: int = 0
    evictions: int = 0

    @property
    def total_requests(self) -> int:
        return self.hits + self.misses

    @property
    def hit_rate(self) -> float:
        total = self.total_requests
        return self.hits / total if total > 0 else 0.0

    def reset(self) -> None:
        self.hits = 0
        self.misses = 0
        self.evictions = 0


class LRUCache:
    """Thread-safe LRU cache with per-key TTL and pattern invalidation.

    Args:
        max_size: Maximum number of entries. When exceeded the least-recently
                  used entry is evicted.  Must be >= 1.
        default_ttl: Default time-to-live in seconds for new entries.
                     ``None`` means entries never expire by default.
    """

    def __init__(self, max_size: int = 128, default_ttl: float | None = None) -> None:
        if max_size < 1:
            raise ValueError("max_size must be >= 1")
        if default_ttl is not None and default_ttl <= 0:
            raise ValueError("default_ttl must be positive or None")

        self._max_size = max_size
        self._default_ttl = default_ttl
        self._data: OrderedDict[str, _CacheEntry] = OrderedDict()
        self._lock = threading.Lock()
        self.stats = CacheStats()

    # -- public API -----------------------------------------------------------

    def get(self, key: str, default: object = None) -> object:
        """Return the cached value for *key*, or *default* on miss/expiry."""
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                self.stats.misses += 1
                return default

            if self._is_expired(entry):
                self._remove(key)
                self.stats.misses += 1
                return default

            # Mark as most-recently used
            self._data.move_to_end(key)
            self.stats.hits += 1
            return entry.value

    def set(self, key: str, value: object, ttl: float | None = ...) -> None:
        """Store *value* under *key*.

        Args:
            key: Cache key.
            value: Arbitrary value.
            ttl: Per-key TTL in seconds.  Pass ``None`` for no expiration.
                 Omit (or pass the sentinel ``...``) to use the cache default.
        """
        actual_ttl = self._default_ttl if ttl is ... else ttl
        if actual_ttl is not None and actual_ttl <= 0:
            raise ValueError("ttl must be positive or None")

        expire_at = (time.monotonic() + actual_ttl) if actual_ttl is not None else None

        with self._lock:
            if key in self._data:
                # Update existing — move to end (most recent)
                self._data.move_to_end(key)
                self._data[key] = _CacheEntry(value=value, expire_at=expire_at)
            else:
                self._evict_if_full()
                self._data[key] = _CacheEntry(value=value, expire_at=expire_at)

    def delete(self, key: str) -> bool:
        """Remove *key* from the cache.  Returns ``True`` if it existed."""
        with self._lock:
            return self._remove(key)

    def invalidate_pattern(self, pattern: str) -> int:
        """Delete all keys matching a Unix shell-style *pattern* (fnmatch).

        Returns the number of keys removed.
        """
        with self._lock:
            keys_to_remove = [k for k in self._data if fnmatch.fnmatch(k, pattern)]
            for k in keys_to_remove:
                del self._data[k]
            return len(keys_to_remove)

    def clear(self) -> None:
        """Remove all entries from the cache."""
        with self._lock:
            self._data.clear()

    def __len__(self) -> int:
        """Return the number of (non-expired) entries currently stored."""
        with self._lock:
            self._purge_expired()
            return len(self._data)

    def __contains__(self, key: str) -> bool:
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return False
            if self._is_expired(entry):
                self._remove(key)
                return False
            return True

    @property
    def max_size(self) -> int:
        return self._max_size

    # -- internals ------------------------------------------------------------

    def _is_expired(self, entry: _CacheEntry) -> bool:
        return entry.expire_at is not None and time.monotonic() >= entry.expire_at

    def _remove(self, key: str) -> bool:
        try:
            del self._data[key]
            return True
        except KeyError:
            return False

    def _evict_if_full(self) -> None:
        """Evict expired entries first, then the LRU entry if still full."""
        # Try purging expired entries to free space
        if len(self._data) >= self._max_size:
            self._purge_expired()

        # Still full — evict the least-recently used
        while len(self._data) >= self._max_size:
            self._data.popitem(last=False)
            self.stats.evictions += 1

    def _purge_expired(self) -> None:
        expired = [k for k, v in self._data.items() if self._is_expired(v)]
        for k in expired:
            del self._data[k]
