"""
Sliding-window rate limiter decorator for Python web applications.

Supports Flask, Django, and any WSGI-compatible framework.
"""

import time
import threading
import functools
from collections import defaultdict
from typing import Callable, Optional


class _RateLimitState:
    """Stores per-key sliding window timestamps and handles expiry cleanup."""

    def __init__(self, window: float):
        self.window = window
        self.lock = threading.Lock()
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int) -> tuple[bool, int]:
        """Check if a request is allowed and record it if so.

        Returns (allowed, remaining_requests).
        """
        now = time.monotonic()
        cutoff = now - self.window

        with self.lock:
            timestamps = self.requests[key]
            # Sliding window: drop everything before the cutoff
            self.requests[key] = timestamps = [
                t for t in timestamps if t > cutoff
            ]

            if len(timestamps) >= max_requests:
                return False, 0

            timestamps.append(now)
            return True, max_requests - len(timestamps)

    def cleanup(self) -> int:
        """Remove all fully-expired keys. Returns number of keys removed."""
        now = time.monotonic()
        cutoff = now - self.window
        removed = 0

        with self.lock:
            expired_keys = [
                k for k, v in self.requests.items()
                if not v or v[-1] <= cutoff
            ]
            for k in expired_keys:
                del self.requests[k]
                removed += 1

        return removed


def _extract_api_key(request) -> Optional[str]:
    """Try to pull an X-API-Key from the request, or return None."""
    # Flask / generic object with .headers
    if hasattr(request, "headers") and hasattr(request.headers, "get"):
        value = request.headers.get("X-API-Key")
        if value:
            return value

    # Raw WSGI environ dict
    if isinstance(request, dict):
        value = request.get("HTTP_X_API_KEY")
        if value:
            return value

    return None


def _extract_ip(request) -> str:
    """Pull a client IP from the request across Flask, Django, or WSGI."""
    # Flask: check proxy headers then remote_addr
    if hasattr(request, "remote_addr"):
        ip = (
            getattr(request, "access_route", [None])[0]
            or request.remote_addr
        )
        return ip or "unknown"

    # Django
    meta = getattr(request, "META", None)
    if meta:
        forwarded = meta.get("HTTP_X_FORWARDED_FOR", "")
        ip = forwarded.split(",")[0].strip() if forwarded else ""
        return ip or meta.get("REMOTE_ADDR", "unknown")

    # WSGI environ
    if isinstance(request, dict):
        forwarded = request.get("HTTP_X_FORWARDED_FOR", "")
        ip = forwarded.split(",")[0].strip() if forwarded else ""
        return ip or request.get("REMOTE_ADDR", "unknown")

    return "unknown"


def _default_key_func(request) -> str:
    """Extract client identifier from a request object.

    Checks X-API-Key header first, then falls back to IP address.
    """
    api_key = _extract_api_key(request)
    if api_key:
        return f"apikey:{api_key}"
    return f"ip:{_extract_ip(request)}"


def _try_flask_429(body: str):
    """Attempt to build a Flask 429 response. Returns None if Flask is absent."""
    try:
        from flask import jsonify, make_response
    except ImportError:
        return None
    resp = make_response(jsonify({"error": body}), 429)
    resp.headers["Retry-After"] = "60"
    return resp


def _try_django_429(body: str):
    """Attempt to build a Django 429 response. Returns None if Django is absent."""
    try:
        from django.http import JsonResponse
    except ImportError:
        return None
    resp = JsonResponse({"error": body}, status=429)
    resp["Retry-After"] = "60"
    return resp


def _default_exceeded_response():
    """Return a 429 response. Auto-detects Flask vs Django; falls back to a tuple."""
    body = "Rate limit exceeded. Try again later."
    result = _try_flask_429(body)
    if result is not None:
        return result
    result = _try_django_429(body)
    if result is not None:
        return result
    return (body, 429)


def _resolve_request(args, kwargs):
    """Find the request object from view arguments or the Flask global."""
    request = kwargs.get("request")
    if request is not None:
        return request
    if args:
        return args[0]
    try:
        from flask import request as flask_request
        return flask_request
    except ImportError:
        return None


def rate_limit(
    max_requests: int = 60,
    window: float = 60.0,
    key_func: Optional[Callable] = None,
    exceeded_response: Optional[Callable] = None,
):
    """Decorator that applies a sliding-window rate limit to a view function.

    Args:
        max_requests: Maximum number of allowed requests inside ``window``.
        window:       Time window in seconds (sliding).
        key_func:     ``callable(request) -> str`` that returns a tracking key.
                      Defaults to X-API-Key header, then client IP.
        exceeded_response: ``callable()`` returning the response when the
                           limit is exceeded.  Defaults to a JSON 429.

    Usage::

        @app.route("/api/data")
        @rate_limit(max_requests=100, window=60)
        def get_data():
            return {"ok": True}

    The decorator exposes its internal state for manual cleanup::

        get_data.rate_limit_state.cleanup()
    """
    resolve_key = key_func or _default_key_func
    on_exceeded = exceeded_response or _default_exceeded_response
    state = _RateLimitState(window)

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            request = _resolve_request(args, kwargs)
            key = resolve_key(request)
            allowed, remaining = state.is_allowed(key, max_requests)

            if not allowed:
                return on_exceeded()

            response = fn(*args, **kwargs)

            # Attach rate-limit headers when the response supports them
            if hasattr(response, "headers"):
                response.headers["X-RateLimit-Limit"] = str(max_requests)
                response.headers["X-RateLimit-Remaining"] = str(remaining)
                response.headers["X-RateLimit-Window"] = str(int(window))

            return response

        # Expose state so callers can run cleanup or inspect internals
        wrapper.rate_limit_state = state
        return wrapper

    return decorator
