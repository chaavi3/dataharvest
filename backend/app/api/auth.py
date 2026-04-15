"""Optional PIN-based authentication middleware."""

import secrets

from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..state.config import get_settings, hash_pin

_SESSION_TOKENS: set[str] = set()

PUBLIC_PATHS = {"/api/auth/login", "/api/auth/status", "/api/health", "/docs", "/openapi.json"}


class PinAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if not settings.auth_pin_hash:
            return await call_next(request)

        path = request.url.path
        if path in PUBLIC_PATHS or not path.startswith("/api"):
            return await call_next(request)

        token = request.cookies.get("dh_session") or request.headers.get("x-session-token")
        if token and token in _SESSION_TOKENS:
            return await call_next(request)

        return JSONResponse(status_code=401, content={"detail": "Authentication required"})


def login(pin: str) -> str | None:
    settings = get_settings()
    if not settings.auth_pin_hash:
        return "no-auth"
    if hash_pin(pin) == settings.auth_pin_hash:
        token = secrets.token_urlsafe(32)
        _SESSION_TOKENS.add(token)
        return token
    return None


def logout(token: str):
    _SESSION_TOKENS.discard(token)
