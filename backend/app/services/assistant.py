"""Adapter REST do Gemini; a API key vem exclusivamente do ambiente/secret manager."""

import logging
from typing import Any, Protocol, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.config import get_settings

logger = logging.getLogger(__name__)

GEMINI_GENERATE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/" "{model}:generateContent"
)
Result = TypeVar("Result", bound=BaseModel)


class AssistantProvider(Protocol):
    """Contrato assíncrono que permite trocar ou substituir o provedor em testes."""

    async def answer(self, prompt: str) -> str:
        """Retorna resposta do assistente para um prompt já validado."""


class AssistantNotConfiguredError(RuntimeError):
    """Indica que endpoint e credencial do provedor não foram configurados."""


class AssistantProviderError(RuntimeError):
    """Indica falha de protocolo/serviço upstream sem expor conteúdo sensível."""


class GeminiAssistant:
    """Cliente assíncrono da API REST Gemini com timeout e payload educacional."""

    async def answer(self, prompt: str) -> str:
        """Chama generateContent sem colocar a chave na URL nem no corpo do prompt."""

        return await self._generate(
            prompt,
            "Você é o assistente de estudos do Nicolas Hub. Ajude com Python, "
            "lógica, SQL, Terraform, Docker e cloud. Explique passo a passo, "
            "use exemplos seguros e nunca afirme que executou código.",
            {"temperature": 0.4, "maxOutputTokens": 1200},
        )

    async def structured(
        self, prompt: str, instruction: str, result_type: type[Result]
    ) -> Result:
        raw = await self._generate(
            prompt,
            instruction,
            {
                "temperature": 0.3,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
                "responseJsonSchema": result_type.model_json_schema(),
            },
        )
        try:
            return result_type.model_validate_json(raw)
        except ValidationError as error:
            raise AssistantProviderError("Formato de resposta inválido.") from error

    async def _generate(
        self, prompt: str, instruction: str, generation_config: dict[str, Any]
    ) -> str:
        settings = get_settings()
        if settings.gemini_api_key is None:
            raise AssistantNotConfiguredError(
                "O assistente de IA não está configurado."
            )
        api_key = settings.gemini_api_key.get_secret_value()
        if not api_key:
            raise AssistantNotConfiguredError(
                "O assistente de IA não está configurado."
            )

        body = {
            "system_instruction": {"parts": [{"text": instruction}]},
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                },
            ],
            "generationConfig": generation_config,
        }
        url = GEMINI_GENERATE_URL.format(model=settings.ai_model)

        try:
            async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
                response = await client.post(
                    url,
                    json=body,
                    headers={"x-goog-api-key": api_key},
                )
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as error:
            raise AssistantProviderError(
                "O provedor de IA excedeu o tempo limite."
            ) from error
        except httpx.HTTPStatusError as error:
            logger.warning(
                "gemini_http_status=%s model=%s",
                error.response.status_code,
                settings.ai_model,
            )
            raise AssistantProviderError(
                f"O provedor de IA respondeu com HTTP {error.response.status_code}."
            ) from error
        except httpx.RequestError as error:
            raise AssistantProviderError(
                "Não foi possível conectar ao provedor de IA."
            ) from error
        except ValueError as error:
            raise AssistantProviderError(
                "O provedor de IA retornou JSON inválido."
            ) from error

        try:
            parts = data["candidates"][0]["content"]["parts"]
            answer = "\n".join(
                part["text"]
                for part in parts
                if isinstance(part.get("text"), str) and not part.get("thought")
            )
        except (KeyError, IndexError, TypeError, AttributeError) as error:
            raise AssistantProviderError(
                "O provedor de IA retornou formato inesperado."
            ) from error

        if not isinstance(answer, str) or not answer.strip():
            raise AssistantProviderError("O provedor de IA retornou resposta vazia.")
        return answer.strip()


def get_assistant_provider() -> AssistantProvider:
    """Dependency factory permite substituir Gemini por mock em testes."""

    return GeminiAssistant()


def get_structured_assistant() -> GeminiAssistant:
    return GeminiAssistant()
