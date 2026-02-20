"""Tests for the sliding-window @rate_limit decorator."""

import time
import threading
from unittest.mock import MagicMock

from rate_limit import rate_limit, _default_key_func, _RateLimitState

SAMPLE_CREDENTIAL = "unit-test-sample-1234"
VIEW_BODY = "response-success"
DENIED_CODE = 429


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class FakeRequest:
    """Minimal request double for testing."""

    class _Headers(dict):
        def get(self, key, default=None):
            return super().get(key, default)

    def __init__(self, ip="127.0.0.1", credential=None):
        self.remote_addr = ip
        self.access_route = [ip]
        headers = {}
        if credential:
            headers["X-API-Key"] = credential
        self.headers = self._Headers(headers)


class FakeResponse:
    """Minimal response double that supports .headers for testing."""

    def __init__(self, body):
        self.body = body
        self.headers = {}


def make_view_response():
    return FakeResponse(VIEW_BODY)


# ---------------------------------------------------------------------------
# Tests: key extraction
# ---------------------------------------------------------------------------

def test_key_func_uses_credential_header():
    req = FakeRequest(credential=SAMPLE_CREDENTIAL)
    assert _default_key_func(req) == f"apikey:{SAMPLE_CREDENTIAL}"


def test_key_func_falls_back_to_ip():
    req = FakeRequest(ip="10.0.0.5")
    assert _default_key_func(req) == "ip:10.0.0.5"


def test_key_func_wsgi_dict_with_header():
    environ = {"HTTP_X_API_KEY": SAMPLE_CREDENTIAL, "REMOTE_ADDR": "1.2.3.4"}
    assert _default_key_func(environ) == f"apikey:{SAMPLE_CREDENTIAL}"


def test_key_func_wsgi_dict_ip():
    environ = {"REMOTE_ADDR": "9.8.7.6"}
    assert _default_key_func(environ) == "ip:9.8.7.6"


def test_key_func_django_meta():
    req = MagicMock(spec=[])
    req.META = {"HTTP_X_FORWARDED_FOR": "5.5.5.5, 6.6.6.6", "REMOTE_ADDR": "7.7.7.7"}
    assert _default_key_func(req) == "ip:5.5.5.5"


# ---------------------------------------------------------------------------
# Tests: sliding window state
# ---------------------------------------------------------------------------

def test_state_allows_up_to_max():
    state = _RateLimitState(window=10.0)
    for _ in range(5):
        allowed, _ = state.is_allowed("user1", max_requests=5)
        assert allowed
    allowed, remaining = state.is_allowed("user1", max_requests=5)
    assert not allowed
    assert remaining == 0


def test_state_window_expires(monkeypatch):
    """Timestamps older than the window are discarded."""
    state = _RateLimitState(window=1.0)

    for _ in range(3):
        state.is_allowed("u", max_requests=3)

    original_monotonic = time.monotonic
    offset = 1.5

    def shifted():
        return original_monotonic() + offset

    monkeypatch.setattr(time, "monotonic", shifted)

    allowed, remaining = state.is_allowed("u", max_requests=3)
    assert allowed
    assert remaining == 2


# ---------------------------------------------------------------------------
# Tests: cleanup
# ---------------------------------------------------------------------------

def test_cleanup_removes_expired(monkeypatch):
    state = _RateLimitState(window=0.5)
    state.is_allowed("a", 10)
    state.is_allowed("b", 10)

    original_monotonic = time.monotonic
    offset = 1.0

    def shifted():
        return original_monotonic() + offset

    monkeypatch.setattr(time, "monotonic", shifted)

    removed = state.cleanup()
    assert removed == 2
    assert len(state.requests) == 0


def test_cleanup_keeps_active():
    state = _RateLimitState(window=10.0)
    state.is_allowed("still-active", 10)

    removed = state.cleanup()
    assert removed == 0
    assert "still-active" in state.requests


# ---------------------------------------------------------------------------
# Tests: decorator integration
# ---------------------------------------------------------------------------

def test_decorator_allows_within_limit():
    @rate_limit(max_requests=3, window=60)
    def view(request):
        return make_view_response()

    req = FakeRequest(ip="1.1.1.1")
    for _ in range(3):
        resp = view(req)
        assert resp.body == VIEW_BODY


def test_decorator_blocks_over_limit():
    @rate_limit(max_requests=2, window=60)
    def view(request):
        return make_view_response()

    req = FakeRequest(ip="2.2.2.2")
    view(req)
    view(req)
    resp = view(req)
    assert isinstance(resp, tuple)
    assert resp[1] == DENIED_CODE


def test_decorator_tracks_per_user():
    @rate_limit(max_requests=1, window=60)
    def view(request):
        return make_view_response()

    resp_a = view(FakeRequest(ip="10.0.0.1"))
    assert resp_a.body == VIEW_BODY

    resp_b = view(FakeRequest(ip="10.0.0.2"))
    assert resp_b.body == VIEW_BODY

    resp_a2 = view(FakeRequest(ip="10.0.0.1"))
    assert isinstance(resp_a2, tuple) and resp_a2[1] == DENIED_CODE


def test_decorator_custom_exceeded_response():
    def custom_response():
        return {"status": "too_many", "code": DENIED_CODE}

    @rate_limit(max_requests=1, window=60, exceeded_response=custom_response)
    def view(request):
        return make_view_response()

    view(FakeRequest())
    resp = view(FakeRequest())
    assert resp == {"status": "too_many", "code": DENIED_CODE}


def test_decorator_custom_key_func():
    def by_user_id(request):
        return f"user:{request.user_id}"

    @rate_limit(max_requests=1, window=60, key_func=by_user_id)
    def view(request):
        return make_view_response()

    req = MagicMock()
    req.user_id = 42

    resp1 = view(req)
    assert resp1.body == VIEW_BODY

    resp2 = view(req)
    assert isinstance(resp2, tuple) and resp2[1] == DENIED_CODE


def test_decorator_attaches_rate_limit_headers():
    @rate_limit(max_requests=10, window=30)
    def view(request):
        return make_view_response()

    resp = view(FakeRequest(ip="3.3.3.3"))
    assert resp.headers["X-RateLimit-Limit"] == "10"
    assert resp.headers["X-RateLimit-Remaining"] == "9"
    assert resp.headers["X-RateLimit-Window"] == "30"


def test_exposed_state_cleanup():
    @rate_limit(max_requests=5, window=0.01)
    def view(request):
        return make_view_response()

    view(FakeRequest(ip="4.4.4.4"))
    time.sleep(0.05)

    removed = view.rate_limit_state.cleanup()
    assert removed >= 1


# ---------------------------------------------------------------------------
# Tests: thread safety
# ---------------------------------------------------------------------------

def test_concurrent_requests():
    @rate_limit(max_requests=50, window=60)
    def view(request):
        return make_view_response()

    results = []
    req = FakeRequest(ip="5.5.5.5")

    def make_request():
        resp = view(req)
        results.append(resp)

    threads = [threading.Thread(target=make_request) for _ in range(80)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    successes = sum(1 for r in results if isinstance(r, FakeResponse))
    failures = sum(1 for r in results if isinstance(r, tuple))
    assert successes == 50
    assert failures == 30


if __name__ == "__main__":
    import pytest
    raise SystemExit(pytest.main([__file__, "-v"]))
