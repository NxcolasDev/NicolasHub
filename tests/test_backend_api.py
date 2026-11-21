"""Funções pytest tipadas verificam contratos HTTP, isolamento e agregações."""

import asyncio
from types import SimpleNamespace

from pydantic import SecretStr
from fastapi.testclient import TestClient

from app.services.engine import count_by_severity
from app.services.assistant import get_assistant_provider
from app.services import assistant as assistant_service
from src.domain.curriculum import LearningTrack, lessons_for_track


def register(client: TestClient, email: str) -> None:
    """Cria usuário de teste usando a interface pública de registro."""

    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse-battery"},
    )
    assert response.status_code == 201


def login(client: TestClient, email: str) -> str:
    """Obtém access token usando o formulário OAuth2 password."""

    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "correct-horse-battery"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_analytics_events_are_authenticated_and_scoped_to_user(
    client: TestClient,
) -> None:
    """Garante autenticação obrigatória e que usuários não leem eventos alheios."""

    unauthenticated = client.get("/api/v1/analytics/events")
    assert unauthenticated.status_code == 401

    register(client, "first@example.com")
    first_token = login(client, "first@example.com")
    first_headers = {"Authorization": f"Bearer {first_token}"}

    created = client.post(
        "/api/v1/analytics/events",
        json={"severity": "ERROR", "message": "database timeout"},
        headers=first_headers,
    )
    assert created.status_code == 200
    assert created.json()["status"] == "SIMULATED_CLOUD_EVENT"
    assert created.json()["severity"] == "ERROR"

    register(client, "second@example.com")
    second_headers = {"Authorization": f"Bearer {login(client, 'second@example.com')}"}
    assert client.get("/api/v1/analytics/events", headers=second_headers).json() == []

    summary = client.get("/api/v1/analytics/summary", headers=first_headers)
    assert summary.status_code == 200
    assert summary.json() == {
        "total_events": 1,
        "by_severity": [{"severity": "ERROR", "count": 1}],
    }


def test_registration_rejects_duplicate_email_and_short_password(
    client: TestClient,
) -> None:
    """Valida restrições de senha e conflito de email na borda HTTP."""

    register(client, "duplicate@example.com")
    duplicate = client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "correct-horse-battery"},
    )
    assert duplicate.status_code == 409

    invalid_password = client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "short"},
    )
    assert invalid_password.status_code == 422


def test_count_by_severity_aggregates_without_losing_repeated_values() -> None:
    """Confirma o contrato da função pura que agrega severidades."""

    assert count_by_severity(["ERROR", "INFO", "ERROR"]) == {"ERROR": 2, "INFO": 1}


def test_learning_curriculum_is_ordered_and_pure() -> None:
    """Confirma que a trilha Python retorna níveis ascendentes sem mutação global."""

    lessons = lessons_for_track(LearningTrack.PYTHON)
    assert [lesson.level for lesson in lessons] == [1, 2, 3]
    assert lessons_for_track(LearningTrack.CLOUD)[0].title == "Fundamentos de cloud"


def test_assistant_route_requires_authentication_and_uses_injected_provider(
    client: TestClient,
) -> None:
    """Testa o adapter desacoplado sem chamadas de rede ou credenciais de fornecedor."""

    class FakeAssistant:
        async def answer(self, prompt: str) -> str:
            return f"Resposta: {prompt}"

    client.app.dependency_overrides[get_assistant_provider] = lambda: FakeAssistant()
    anonymous = client.post(
        "/api/v1/learning/assistant", json={"prompt": "O que é Python?"}
    )
    assert anonymous.status_code == 401

    register(client, "learner@example.com")
    token = login(client, "learner@example.com")
    response = client.post(
        "/api/v1/learning/assistant",
        json={"prompt": "  O que é Python?  "},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json() == {"answer": "Resposta: O que é Python?"}


def test_logic_endpoint_executes_domain_exercises(client: TestClient) -> None:
    """Garante que terminal e backend usem as mesmas regras puras do domínio."""

    average = client.post(
        "/api/v1/learning/logic",
        json={
            "task": "rolling_average",
            "scores": [10, 20, 30, 40],
            "window_size": 2,
        },
    )
    assert average.status_code == 200
    assert average.json()["result"] == [15.0, 25.0, 35.0]

    critical_logs = client.post(
        "/api/v1/learning/logic",
        json={
            "task": "critical_logs",
            "logs": [
                {"severity": "ERROR", "error_code": "ERR_1"},
                {"severity": "CRITICAL", "error_code": "ERR_2"},
                {"severity": "INFO", "error_code": "INF_1"},
            ],
        },
    )
    assert critical_logs.status_code == 200
    assert critical_logs.json()["result"] == ["ERR_1", "ERR_2"]


def test_health_endpoint_reports_database_and_optional_queue(
    client: TestClient,
    monkeypatch,
) -> None:
    """Verifica que o dashboard recebe estado de banco e fila sem dados sensíveis."""

    monkeypatch.setattr("app.main.check_sqs_connection", lambda: "error")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "sqs": "error",
    }


def test_gemini_adapter_uses_header_and_parses_rest_response(monkeypatch) -> None:
    """Exercita o adapter Gemini com transporte falso e chave de teste local."""

    api_key = "local-test-only-not-a-real-key"
    monkeypatch.setattr(
        assistant_service,
        "get_settings",
        lambda: SimpleNamespace(
            gemini_api_key=SecretStr(api_key),
            ai_model="gemini-2.5-flash",
            ai_timeout_seconds=5,
        ),
    )

    class FakeResponse:
        def raise_for_status(self) -> None:
            """Imita resposta HTTP de sucesso para o adapter."""

        def json(self) -> dict[str, object]:
            """Retorna o formato candidates/parts utilizado pela API Gemini."""

            return {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Primeira parte."}, {"text": "Segunda."}]
                        }
                    }
                ]
            }

    class FakeAsyncClient:
        async def __aenter__(self):
            """Retorna o transporte falso como context manager assíncrono."""

            return self

        async def __aexit__(self, *args: object) -> None:
            """Fecha o context manager falso sem consumir exceções."""

        async def post(self, url: str, *, json: object, headers: dict[str, str]):
            """Captura request para garantir que a credencial nunca vá na URL."""

            assert url.endswith("/models/gemini-2.5-flash:generateContent")
            assert api_key not in url
            assert headers["x-goog-api-key"] == api_key
            assert isinstance(json, dict)
            return FakeResponse()

    monkeypatch.setattr(
        assistant_service.httpx,
        "AsyncClient",
        lambda **kwargs: FakeAsyncClient(),
    )
    answer = asyncio.run(assistant_service.GeminiAssistant().answer("Explique slicing"))
    assert answer == "Primeira parte.\nSegunda."
