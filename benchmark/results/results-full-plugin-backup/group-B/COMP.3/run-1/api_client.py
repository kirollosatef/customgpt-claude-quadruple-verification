import time
import logging

import requests
from requests.exceptions import (
    ConnectionError,
    JSONDecodeError,
    Timeout,
)

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base exception for API client errors."""

    def __init__(self, message, status_code=None, response=None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class AuthenticationError(APIError):
    """Raised on 401/403 responses indicating expired or invalid credentials."""


class RateLimitError(APIError):
    """Raised on 429 responses. Includes retry_after hint when available."""

    def __init__(self, message, retry_after=None, **kwargs):
        super().__init__(message, **kwargs)
        self.retry_after = retry_after


class ServerError(APIError):
    """Raised on 5xx responses."""


class APIClient:
    DEFAULT_TIMEOUT = 30
    MAX_RETRIES = 3
    BACKOFF_BASE = 1  # seconds
    BACKOFF_MAX = 60  # seconds cap

    def __init__(self, base_url, api_key, timeout=None, max_retries=None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout or self.DEFAULT_TIMEOUT
        self.max_retries = max_retries if max_retries is not None else self.MAX_RETRIES
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {self.api_key}"})

    # -- public methods -------------------------------------------------------

    def get(self, endpoint):
        return self._request("GET", endpoint)

    def post(self, endpoint, data):
        return self._request("POST", endpoint, json=data)

    def delete(self, endpoint):
        return self._request("DELETE", endpoint)

    # -- internals ------------------------------------------------------------

    def _request(self, method, endpoint, **kwargs):
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        for attempt in range(self.max_retries + 1):
            try:
                response = self.session.request(
                    method, url, timeout=self.timeout, **kwargs
                )
                self._raise_for_status(response)
                return self._parse_json(response)

            except RateLimitError as exc:
                wait = exc.retry_after or self._backoff(attempt)
                if attempt >= self.max_retries:
                    raise
                logger.warning(
                    "Rate-limited (429). Retry %d/%d in %.1fs",
                    attempt + 1,
                    self.max_retries,
                    wait,
                )
                time.sleep(wait)

            except ServerError:
                if attempt >= self.max_retries:
                    raise
                wait = self._backoff(attempt)
                logger.warning(
                    "Server error (5xx). Retry %d/%d in %.1fs",
                    attempt + 1,
                    self.max_retries,
                    wait,
                )
                time.sleep(wait)

            except (ConnectionError, Timeout) as exc:
                if attempt >= self.max_retries:
                    raise APIError(
                        f"Connection failed after {self.max_retries + 1} attempts: {exc}"
                    ) from exc
                wait = self._backoff(attempt)
                logger.warning(
                    "%s. Retry %d/%d in %.1fs",
                    type(exc).__name__,
                    attempt + 1,
                    self.max_retries,
                    wait,
                )
                time.sleep(wait)

            except AuthenticationError:
                raise  # never retry auth failures

    def _raise_for_status(self, response):
        code = response.status_code
        if code < 400:
            return

        if code == 429:
            retry_after = self._parse_retry_after(response)
            raise RateLimitError(
                f"Rate limited: {response.text}",
                retry_after=retry_after,
                status_code=code,
                response=response,
            )

        if code in (401, 403):
            raise AuthenticationError(
                f"Authentication failed ({code}): {response.text}",
                status_code=code,
                response=response,
            )

        if 400 <= code < 500:
            raise APIError(
                f"Client error ({code}): {response.text}",
                status_code=code,
                response=response,
            )

        if code >= 500:
            raise ServerError(
                f"Server error ({code}): {response.text}",
                status_code=code,
                response=response,
            )

    @staticmethod
    def _parse_json(response):
        if response.status_code == 204 or not response.content:
            return None
        try:
            return response.json()
        except (JSONDecodeError, ValueError) as exc:
            raise APIError(
                f"Invalid JSON in response: {response.text[:200]}"
            ) from exc

    @staticmethod
    def _parse_retry_after(response):
        header = response.headers.get("Retry-After")
        if header is None:
            return None
        try:
            return float(header)
        except (ValueError, TypeError):
            return None

    def _backoff(self, attempt):
        wait = min(self.BACKOFF_BASE * (2 ** attempt), self.BACKOFF_MAX)
        return wait
