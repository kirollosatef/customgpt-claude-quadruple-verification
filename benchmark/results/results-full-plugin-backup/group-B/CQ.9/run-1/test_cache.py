"""Tests for the LRU cache implementation."""

import threading
import time

import pytest

from cache import CacheStats, LRUCache


# -- basic get / set / delete -------------------------------------------------

def test_set_and_get():
    c = LRUCache()
    c.set("a", 1)
    assert c.get("a") == 1


def test_get_missing_returns_default():
    c = LRUCache()
    assert c.get("x") is None
    assert c.get("x", "fallback") == "fallback"


def test_delete_existing():
    c = LRUCache()
    c.set("a", 1)
    assert c.delete("a") is True
    assert c.get("a") is None


def test_delete_missing():
    c = LRUCache()
    assert c.delete("nope") is False


def test_overwrite_key():
    c = LRUCache()
    c.set("a", 1)
    c.set("a", 2)
    assert c.get("a") == 2


def test_contains():
    c = LRUCache()
    c.set("a", 1)
    assert "a" in c
    assert "b" not in c


def test_len():
    c = LRUCache(max_size=10)
    c.set("a", 1)
    c.set("b", 2)
    assert len(c) == 2


def test_clear():
    c = LRUCache()
    c.set("a", 1)
    c.set("b", 2)
    c.clear()
    assert len(c) == 0
    assert c.get("a") is None


# -- TTL expiration -----------------------------------------------------------

def test_ttl_expires():
    c = LRUCache()
    c.set("a", 1, ttl=0.05)
    assert c.get("a") == 1
    time.sleep(0.06)
    assert c.get("a") is None


def test_default_ttl():
    c = LRUCache(default_ttl=0.05)
    c.set("a", 1)
    assert c.get("a") == 1
    time.sleep(0.06)
    assert c.get("a") is None


def test_per_key_ttl_overrides_default():
    c = LRUCache(default_ttl=0.05)
    c.set("short", 1)           # uses default 0.05s
    c.set("long", 2, ttl=1.0)   # explicit 1s
    time.sleep(0.06)
    assert c.get("short") is None   # expired
    assert c.get("long") == 2       # still alive


def test_no_ttl_never_expires():
    c = LRUCache()
    c.set("a", 1, ttl=None)
    time.sleep(0.05)
    assert c.get("a") == 1


def test_contains_expired_key():
    c = LRUCache()
    c.set("a", 1, ttl=0.05)
    time.sleep(0.06)
    assert "a" not in c


def test_len_excludes_expired():
    c = LRUCache()
    c.set("a", 1, ttl=0.05)
    c.set("b", 2)
    time.sleep(0.06)
    assert len(c) == 1


# -- LRU eviction -------------------------------------------------------------

def test_evicts_lru_when_full():
    c = LRUCache(max_size=2)
    c.set("a", 1)
    c.set("b", 2)
    c.set("c", 3)  # should evict "a"
    assert c.get("a") is None
    assert c.get("b") == 2
    assert c.get("c") == 3


def test_access_refreshes_lru_order():
    c = LRUCache(max_size=2)
    c.set("a", 1)
    c.set("b", 2)
    c.get("a")     # touch "a" — now "b" is LRU
    c.set("c", 3)  # should evict "b"
    assert c.get("a") == 1
    assert c.get("b") is None
    assert c.get("c") == 3


def test_overwrite_refreshes_lru_order():
    c = LRUCache(max_size=2)
    c.set("a", 1)
    c.set("b", 2)
    c.set("a", 10)  # update "a" — now "b" is LRU
    c.set("c", 3)   # should evict "b"
    assert c.get("a") == 10
    assert c.get("b") is None
    assert c.get("c") == 3


def test_evicts_expired_before_lru():
    c = LRUCache(max_size=2)
    c.set("a", 1, ttl=0.05)
    c.set("b", 2)
    time.sleep(0.06)
    c.set("c", 3)  # "a" expired → purged first, no LRU eviction needed
    assert c.get("a") is None
    assert c.get("b") == 2
    assert c.get("c") == 3
    assert c.stats.evictions == 0  # expired purge doesn't count as eviction


# -- statistics ---------------------------------------------------------------

def test_stats_hits_and_misses():
    c = LRUCache()
    c.set("a", 1)
    c.get("a")
    c.get("a")
    c.get("nonexistent")
    assert c.stats.hits == 2
    assert c.stats.misses == 1


def test_stats_evictions():
    c = LRUCache(max_size=1)
    c.set("a", 1)
    c.set("b", 2)  # evicts "a"
    c.set("c", 3)  # evicts "b"
    assert c.stats.evictions == 2


def test_stats_expired_counts_as_miss():
    c = LRUCache()
    c.set("a", 1, ttl=0.05)
    time.sleep(0.06)
    c.get("a")
    assert c.stats.misses == 1
    assert c.stats.hits == 0


def test_stats_hit_rate():
    s = CacheStats(hits=3, misses=1)
    assert s.hit_rate == 0.75
    assert s.total_requests == 4


def test_stats_hit_rate_no_requests():
    s = CacheStats()
    assert s.hit_rate == 0.0


def test_stats_reset():
    c = LRUCache()
    c.set("a", 1)
    c.get("a")
    c.get("nonexistent")
    c.stats.reset()
    assert c.stats.hits == 0
    assert c.stats.misses == 0
    assert c.stats.evictions == 0


# -- pattern invalidation -----------------------------------------------------

def test_invalidate_pattern_wildcard():
    c = LRUCache()
    c.set("user:1", "alice")
    c.set("user:2", "bob")
    c.set("post:1", "hello")
    removed = c.invalidate_pattern("user:*")
    assert removed == 2
    assert c.get("user:1") is None
    assert c.get("user:2") is None
    assert c.get("post:1") == "hello"


def test_invalidate_pattern_question_mark():
    c = LRUCache()
    c.set("a1", 1)
    c.set("a2", 2)
    c.set("a10", 10)
    removed = c.invalidate_pattern("a?")
    assert removed == 2  # a1, a2 match; a10 does not


def test_invalidate_pattern_no_match():
    c = LRUCache()
    c.set("x", 1)
    removed = c.invalidate_pattern("y*")
    assert removed == 0
    assert c.get("x") == 1


# -- validation ---------------------------------------------------------------

def test_invalid_max_size():
    with pytest.raises(ValueError):
        LRUCache(max_size=0)


def test_invalid_default_ttl():
    with pytest.raises(ValueError):
        LRUCache(default_ttl=-1)


def test_invalid_per_key_ttl():
    c = LRUCache()
    with pytest.raises(ValueError):
        c.set("a", 1, ttl=-1)


# -- thread safety (smoke test) -----------------------------------------------

def test_concurrent_access():
    c = LRUCache(max_size=100)
    errors = []

    def writer(start: int):
        try:
            for i in range(start, start + 200):
                c.set(f"k{i}", i, ttl=0.5)
        except Exception as e:
            errors.append(e)

    def reader():
        try:
            for i in range(400):
                c.get(f"k{i}")
        except Exception as e:
            errors.append(e)

    threads = [
        threading.Thread(target=writer, args=(0,)),
        threading.Thread(target=writer, args=(200,)),
        threading.Thread(target=reader),
        threading.Thread(target=reader),
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors, f"Errors during concurrent access: {errors}"


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
