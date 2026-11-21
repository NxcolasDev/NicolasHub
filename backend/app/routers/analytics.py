"""Handlers decorados com schemas tipados, Depends e fluxo async/await de telemetria."""

import logging
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.concurrency import run_in_threadpool
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import BaseModel, ConfigDict, StringConstraints
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Event, User
from app.security import get_current_user
from app.services.aws_identity import TelemetryIdentityError
from app.services.telemetry import publish_event, record_event

router = APIRouter(prefix="/analytics", tags=["analytics"])
Severity = Literal["INFO", "WARN", "ERROR", "CRITICAL"]
logger = logging.getLogger(__name__)


class EventCreate(BaseModel):
    """Dados aceitos para registrar uma nova ocorrência analítica."""

    severity: Severity
    message: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)
    ]


class EventResponse(BaseModel):
    """Campos retornados para um evento, sem dados sensíveis de autenticação."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    severity: str
    message: str
    created_at: datetime


class SeverityCount(BaseModel):
    """Par de severidade e quantidade agregado no banco relacional."""

    severity: str
    count: int


class EventWriteResponse(EventResponse):
    status: Literal["PUBLISHED_CLOUD_EVENT", "SIMULATED_CLOUD_EVENT"]


class AnalyticsSummary(BaseModel):
    """Resposta com totais de eventos e contagem por nível de severidade."""

    total_events: int
    by_severity: list[SeverityCount]


@router.post(
    "/events",
    response_model=EventWriteResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        200: {"model": EventWriteResponse, "description": "Evento salvo localmente"}
    },
)
async def create_event(
    payload: EventCreate,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EventWriteResponse:
    """Persiste fora do loop e usa await para publicar telemetria sem bloqueio."""

    event = await run_in_threadpool(
        record_event,
        db,
        user_id=current_user.id,
        severity=payload.severity,
        message=payload.message,
    )
    try:
        published = await publish_event(event)
    except (BotoCoreError, ClientError, TelemetryIdentityError) as error:
        logger.warning(
            "telemetry_fallback event_id=%s error=%s", event.id, type(error).__name__
        )
        published = False
    if not published:
        response.status_code = status.HTTP_200_OK
    return EventWriteResponse(
        **EventResponse.model_validate(event).model_dump(),
        status="PUBLISHED_CLOUD_EVENT" if published else "SIMULATED_CLOUD_EVENT",
    )


@router.get("/events", response_model=list[EventResponse])
def list_events(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    severity: Severity | None = None,
    created_after: datetime | None = None,
    created_before: datetime | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[Event]:
    """Filtros SQL aproveitam índices de severidade/data para reduzir a busca."""

    if created_after and created_before and created_after > created_before:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="created_after deve ser anterior a created_before.",
        )

    statement = select(Event).where(Event.user_id == current_user.id)
    if severity is not None:
        statement = statement.where(Event.severity == severity)
    if created_after is not None:
        statement = statement.where(Event.created_at >= created_after)
    if created_before is not None:
        statement = statement.where(Event.created_at <= created_before)
    statement = statement.order_by(Event.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(statement))


@router.get("/summary", response_model=AnalyticsSummary)
def summarize_events(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AnalyticsSummary:
    """JOIN e COUNT/GROUP BY agregam dados limitados ao usuário autenticado."""

    grouped = db.execute(
        select(Event.severity, func.count(Event.id))
        .join(User, Event.user_id == User.id)
        .where(User.id == current_user.id)
        .group_by(Event.severity)
        .order_by(Event.severity)
    ).all()
    total = sum(count for _, count in grouped)
    return AnalyticsSummary(
        total_events=total,
        by_severity=[
            SeverityCount(severity=severity, count=count) for severity, count in grouped
        ],
    )
