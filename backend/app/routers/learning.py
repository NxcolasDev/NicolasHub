"""Rotas de aprendizagem; a IA é opcional, autenticada e desacoplada por Protocol."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, FiniteFloat, field_validator
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.limits import client_ip, enforce_ai_quota, enforce_limit
from app.services.assistant import (
    AssistantNotConfiguredError,
    AssistantProvider,
    AssistantProviderError,
    get_assistant_provider,
)
from src.domain.challenge import AnalyticsEngine

router = APIRouter(prefix="/learning", tags=["learning"])


class AssistantRequest(BaseModel):
    """Prompt limitado em tamanho para reduzir abuso e custo do provedor."""

    prompt: str = Field(min_length=1, max_length=4000)

    @field_validator("prompt")
    @classmethod
    def prompt_must_contain_text(cls, value: str) -> str:
        """Remove espaços periféricos e recusa prompts vazios após normalização."""

        normalized = value.strip()
        if not normalized:
            raise ValueError("O prompt não pode conter apenas espaços.")
        return normalized


class AssistantResponse(BaseModel):
    """Resposta normalizada independente do formato interno do fornecedor."""

    answer: str


class RollingAverageRequest(BaseModel):
    """Entrada tipada para exercício de média móvel."""

    task: Literal["rolling_average"]
    scores: list[Annotated[FiniteFloat, Field(ge=-1e100, le=1e100)]] = Field(
        min_length=1, max_length=1000
    )
    window_size: int = Field(ge=1, le=1000)


class ExerciseLog(BaseModel):
    severity: str = Field(default="", max_length=16)
    error_code: str = Field(default="", max_length=128)


class CriticalLogsRequest(BaseModel):
    """Entrada tipada para exercício de varredura de logs."""

    task: Literal["critical_logs"]
    logs: list[ExerciseLog] = Field(max_length=1000)


class LogicResponse(BaseModel):
    """Saída estável dos exercícios do motor de domínio."""

    task: str
    result: list[float] | list[str]
    explanation: str


@router.post("/logic", response_model=LogicResponse)
def run_logic_exercise(
    payload: RollingAverageRequest | CriticalLogsRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> LogicResponse:
    """Executa exercícios puros do domínio, sem estado ou dependência externa."""

    enforce_limit(db, "logic", client_ip(request), get_settings().rate_limit_logic)
    if isinstance(payload, RollingAverageRequest):
        result = AnalyticsEngine.calculate_rolling_average(
            payload.scores,
            payload.window_size,
        )
        return LogicResponse(
            task=payload.task,
            result=result,
            explanation=(
                "Cada valor é a média de uma janela contígua; uma janela maior "
                "que a entrada produz uma lista vazia."
            ),
        )

    critical_codes = AnalyticsEngine.find_critical_errors(
        [log.model_dump() for log in payload.logs]
    )
    return LogicResponse(
        task=payload.task,
        result=sorted(critical_codes),
        explanation=(
            "Foram selecionados códigos únicos com severidade ERROR ou CRITICAL."
        ),
    )


@router.post("/assistant", response_model=AssistantResponse)
async def ask_assistant(
    payload: AssistantRequest,
    _quota: Annotated[None, Depends(enforce_ai_quota)],
    provider: Annotated[AssistantProvider, Depends(get_assistant_provider)],
) -> AssistantResponse:
    """Usa async/await na porta do provider e converte falhas em erros explícitos."""

    try:
        answer = await provider.answer(payload.prompt.strip())
    except AssistantNotConfiguredError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Assistente de IA não configurado.",
        ) from error
    except AssistantProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="O serviço de IA está indisponível. Tente novamente.",
        ) from error
    return AssistantResponse(answer=answer)
