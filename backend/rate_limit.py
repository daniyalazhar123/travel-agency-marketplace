"""Tiny in-memory fixed-window rate limiter (no new dependencies).

Thread-safe via Lock; keyed by client IP. Best-effort behind reverse
proxies: prefers the LAST X-Forwarded-For hop (the one appended by the
first proxy — client-supplied spoof entries sit to its left), falling
back to the direct peer address. Per-instance only; swap for a shared
store (Redis/Upstash) when scaling horizontally.
"""
import time
from threading import Lock

from fastapi import Request, HTTPException


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, tuple[float, int]] = {}
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            # Opportunistic prune so the dict can't grow unbounded
            if len(self._hits) > 10_000:
                cutoff = now - self.window_seconds
                self._hits = {k: v for k, v in self._hits.items() if now - v[0] < cutoff}
            window_start, count = self._hits.get(key, (now, 0))
            if now - window_start >= self.window_seconds:
                self._hits[key] = (now, 1)
                return True
            if count >= self.max_requests:
                return False
            self._hits[key] = (window_start, count + 1)
            return True


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        last_hop = forwarded.split(",")[-1].strip()
        if last_hop:
            return last_hop
    if request.client is not None and request.client.host:
        return request.client.host
    return "unknown"


def rate_limit(max_requests: int, window_seconds: int):
    """FastAPI dependency factory: raises 429 when the IP budget is spent."""
    limiter = RateLimiter(max_requests, window_seconds)

    async def dependency(request: Request) -> None:
        if not limiter.allow(client_ip(request)):
            raise HTTPException(
                status_code=429,
                detail="Too many requests — please try again later.",
                headers={"Retry-After": str(window_seconds)},
            )

    return dependency
