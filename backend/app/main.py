"""Composição ASGI; decoradores FastAPI registram handlers com sessões tipadas."""

import logging
from uuid import uuid4

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.config import get_settings
from app.database import get_db
from app.limits import RequestBodyLimit
from app.routers import analytics, auth, hub, learning, preparation
from app.security import require_admin_write
from app.services.telemetry import check_sqs_connection

settings = get_settings()
logger = logging.getLogger(__name__)
PUBLIC_VALIDATION_FIELDS = frozenset("""
    body query path header email username password task scores window_size logs severity
    error_code prompt topic notes count description company_id message created_after
    created_before limit offset
    """.split())

app = FastAPI(
    title="Nicolas Hub API",
    description="API de estudos, carreira e analytics.",
    version="1.0.0",
    debug=False,
    dependencies=[Depends(require_admin_write)],
)
app.add_middleware(RequestBodyLimit, maximum=settings.request_max_bytes)


@app.exception_handler(RequestValidationError)
async def invalid_request(
    request: Request, error: RequestValidationError
) -> JSONResponse:
    fields = [
        {
            "field": [
                (
                    loc
                    if isinstance(loc, int) or loc in PUBLIC_VALIDATION_FIELDS
                    else "campo"
                )
                for loc in item["loc"][:6]
            ],
            "code": item["type"],
        }
        for item in error.errors()[:20]
    ]
    return JSONResponse(
        {"detail": "Revise os campos da requisição.", "errors": fields}, status_code=422
    )


@app.middleware("http")
async def handle_unexpected_error(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as error:
        request_id = uuid4().hex
        route = getattr(request.scope.get("route"), "path", "unknown")
        logger.error(
            "request_id=%s route=%s error=%s", request_id, route, type(error).__name__
        )
        return JSONResponse(
            {"detail": "Erro interno do servidor."},
            status_code=500,
            headers={"X-Request-ID": request_id},
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Key"],
    expose_headers=["Retry-After", "X-Request-ID"],
)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(learning.router, prefix="/api/v1")
app.include_router(hub.router, prefix="/api/v1")
app.include_router(preparation.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check(db: Session = Depends(get_db)) -> dict[str, object]:
    """Informa conectividade real com banco/SQS sem expor endpoints ou credenciais."""

    database_status = "ok"
    try:
        await run_in_threadpool(db.execute, text("SELECT 1"))
    except SQLAlchemyError:
        database_status = "error"

    sqs_status = await run_in_threadpool(check_sqs_connection)
    overall_status = "ok" if database_status == "ok" else "degraded"
    return JSONResponse(
        status_code=200 if overall_status == "ok" else 503,
        content={
            "status": overall_status,
            "database": database_status,
            "sqs": sqs_status,
        },
    )
