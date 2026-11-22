"""Fixed-window request quotas and a bounded HTTP request body."""

from hashlib import sha256
from threading import Lock
from time import time
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import get_settings
from app.database import get_db
from app.models.domain import User
from app.security import get_current_user

_lock = Lock()
_window = -1
_counts: dict[str, int] = {}
PROJECT_COVER_MAX_BYTES = 4 * 1024 * 1024

_increment = text("""
    INSERT INTO request_rate_limits (bucket, window_id, hits)
    VALUES (:bucket, :window, 1)
    ON CONFLICT (bucket) DO UPDATE SET
        window_id = EXCLUDED.window_id,
        hits = CASE
            WHEN request_rate_limits.window_id < EXCLUDED.window_id THEN 1
            ELSE request_rate_limits.hits + 1
        END
    WHERE request_rate_limits.window_id < EXCLUDED.window_id
        OR (request_rate_limits.window_id = EXCLUDED.window_id
            AND request_rate_limits.hits < :maximum)
    RETURNING hits
    """)


def _consume(db: Session, bucket: str, window: int, maximum: int) -> bool:
    global _window
    with _lock:
        new_window = window > _window
        if new_window:
            _counts.clear()
            _window = window
        if get_settings().app_environment == "development":
            hits = _counts.get(bucket, 0)
            if len(_counts) >= 10000 and bucket not in _counts:
                return False
            if hits >= maximum:
                return False
            _counts[bucket] = hits + 1
            return True

    try:
        if new_window:
            db.execute(
                text("DELETE FROM request_rate_limits WHERE window_id < :previous"),
                {"previous": window - 1},
            )
        hits = db.scalar(
            _increment, {"bucket": bucket, "window": window, "maximum": maximum}
        )
        db.commit()
        return hits is not None
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(503, "Limite de requisições indisponível.") from error


def enforce_limit(db: Session, scope: str, identity: str, maximum: int) -> None:
    now = int(time())
    window, seconds = divmod(now, 60)
    fingerprint = sha256(identity.encode()).hexdigest()
    if not _consume(db, f"{scope}:{fingerprint}", window, maximum):
        raise HTTPException(
            429,
            "Limite de requisições atingido.",
            headers={"Retry-After": str(60 - seconds)},
        )


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def enforce_ai_quota(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    settings = get_settings()
    enforce_limit(
        db, "ai-account", str(current_user.id), settings.rate_limit_ai_account
    )
    enforce_limit(db, "ai-global", "gemini", settings.rate_limit_ai_global)


class RequestBodyLimit:
    def __init__(self, app: ASGIApp, maximum: int):
        self.app = app
        self.maximum = maximum

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] not in {"POST", "PUT", "PATCH"}:
            await self.app(scope, receive, send)
            return

        maximum = self.maximum
        if scope["method"] == "PUT" and scope["path"].startswith(
            "/api/v1/hub/project-covers/"
        ):
            maximum = PROJECT_COVER_MAX_BYTES
        chunks = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body = message.get("body", b"")
            if len(chunks) + len(body) > maximum:
                await JSONResponse(
                    {"detail": "Requisição excede o tamanho permitido."}, 413
                )(scope, receive, send)
                return
            chunks.extend(body)
            if not message.get("more_body", False):
                break

        pending = True

        async def replay() -> Message:
            nonlocal pending
            if pending:
                pending = False
                return {
                    "type": "http.request",
                    "body": bytes(chunks),
                    "more_body": False,
                }
            return await receive()

        await self.app(scope, replay, send)
