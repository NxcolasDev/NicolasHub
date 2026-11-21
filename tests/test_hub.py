from fastapi.testclient import TestClient

from app import limits
from app.config import get_settings
from app.main import app
from app.security import create_access_token
from app.services.assistant import get_structured_assistant


def _login(client: TestClient) -> dict[str, str]:
    email = "hub-tester@example.com"
    password = "local-test-password"
    assert (
        client.post(
            "/api/v1/auth/register", json={"email": email, "password": password}
        ).status_code
        == 201
    )
    token = client.post(
        "/api/v1/auth/login", data={"username": email, "password": password}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_profile_and_job_fair_include_source_data(client: TestClient) -> None:
    profile = client.get("/api/v1/hub/profile").json()
    fair = client.get("/api/v1/hub/job-fair").json()
    assert profile["name"] == "Nicolas de Jesus Silva"
    assert len(profile["languages"]) == 5
    assert fair["date"] == "2026-12-02"
    assert len({company["id"] for company in fair["companies"]}) == 15
    recora = next(item for item in profile["projects"] if item["id"] == "recora")
    assert "planos de saúde" in recora["summary"]
    assert "Amazon ECS / Fargate" in recora["stack"]


def test_validation_body_limits_and_cors(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "bad-address", "password": "raw-value"},
    )
    assert response.status_code == 422
    assert "raw-value" not in response.text
    assert "bad-address" not in response.text
    assert (
        client.post(
            "/api/v1/learning/logic",
            json={"task": "rolling_average", "scores": ["NaN"], "window_size": 1},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/v1/learning/logic",
            content=b"x" * (get_settings().request_max_bytes + 1),
        ).status_code
        == 413
    )

    origin = get_settings().allowed_origins[0]
    headers = {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization, Content-Type, X-Admin-Key",
    }
    allowed = client.options(
        "/api/v1/auth/login", headers={**headers, "Origin": origin}
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == origin
    assert "access-control-allow-credentials" not in allowed.headers
    blocked = client.options(
        "/api/v1/auth/login", headers={**headers, "Origin": "https://blocked.invalid"}
    )
    assert blocked.status_code == 400
    assert "access-control-allow-origin" not in blocked.headers


def test_write_access_requires_admin_key_or_signed_admin_session(
    client: TestClient, monkeypatch
) -> None:
    administrator = _login(client)
    client.headers.pop("X-Admin-Key")
    endpoint = "/api/v1/analytics/events"
    event = {"severity": "INFO", "message": "  Ambiente sem fila  "}
    assert client.get("/api/v1/hub/profile").status_code == 200
    assert client.post(endpoint, json=event).status_code == 401
    assert (
        client.post(endpoint, json=event, headers={"X-Admin-Key": "wrong"}).status_code
        == 401
    )
    legacy = {"Authorization": f"Bearer {create_access_token('1')}"}
    assert client.post(endpoint, json=event, headers=legacy).status_code == 401
    assert client.get("/api/v1/auth/session", headers=administrator).json() == {
        "admin": True
    }
    response = client.post(endpoint, json=event, headers=administrator)
    assert response.status_code == 200
    assert response.json()["status"] == "SIMULATED_CLOUD_EVENT"
    assert response.json()["message"] == "Ambiente sem fila"
    assert client.get(endpoint, headers=administrator).json()[0]["id"] == (
        response.json()["id"]
    )
    monkeypatch.setattr(get_settings(), "admin_secret_key", None)
    assert client.get("/api/v1/auth/session", headers=administrator).status_code == 401
    assert client.post(endpoint, json=event, headers=administrator).status_code == 401


def test_login_quota_returns_retry_after(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(get_settings(), "rate_limit_login", 1)
    monkeypatch.setattr(limits, "time", lambda: 604)
    credentials = {"username": "absent@example.com", "password": "not-a-real-password"}
    assert client.post("/api/v1/auth/login", data=credentials).status_code == 401
    response = client.post("/api/v1/auth/login", data=credentials)
    assert response.status_code == 429
    assert response.headers["retry-after"] == "56"


def test_study_and_career_are_authenticated_and_validate_provider_data(
    client: TestClient,
) -> None:
    question = {
        "prompt": "Que serviço consulta dados no S3?",
        "options": ["Athena", "EC2", "SNS", "ECR"],
        "correct_index": 0,
        "explanations": ["Consulta SQL", "Computação", "Notificações", "Registro"],
    }

    class FakeAssistant:
        async def structured(self, prompt, instruction, schema):
            if schema.__name__ == "StudyBatch":
                return schema.model_validate(
                    {
                        "summary": "Revisão de serviços.",
                        "questions": [
                            {**question, "prompt": f"{question['prompt']} Cenário {i}."}
                            for i in range(3)
                        ],
                        "flashcards": [{"front": "Pergunta", "back": "Resposta"}] * 3,
                    }
                )
            assert '"name": "Leega"' in prompt
            return schema.model_validate(
                {
                    "role": "Engenharia de Dados",
                    "fit_summary": "A experiência em SQL atende ao anúncio.",
                    "matches": ["SQL"],
                    "gaps": ["Spark"],
                    "questions": ["Como a equipe revisa pipelines?"],
                    "project_ids": ["gestoriq"],
                    "credential_ids": ["aws-foundations"],
                    "skills": ["SQL"],
                }
            )

    payload = {"topic": "college", "count": 3, "notes": "Anotações de Big Data"}
    assert client.post("/api/v1/study/generate", json=payload).status_code == 401
    headers = _login(client)
    app.dependency_overrides[get_structured_assistant] = FakeAssistant
    study = client.post("/api/v1/study/generate", json=payload, headers=headers)
    assert study.status_code == 200
    assert len(study.json()["questions"]) == 3

    job = {"company_id": "leega", "description": "Vaga de engenharia de dados com SQL."}
    career = client.post("/api/v1/career/tailor", json=job, headers=headers)
    assert career.status_code == 200
    assert career.json()["project_ids"] == ["gestoriq"]
    job["company_id"] = "not-in-the-guide"
    assert (
        client.post("/api/v1/career/tailor", json=job, headers=headers).status_code
        == 422
    )


def test_study_builds_25_distinct_questions_and_excludes_previous(
    client: TestClient,
) -> None:
    import json

    class FakeAssistant:
        async def structured(self, prompt, _instruction, schema):
            request = json.loads(prompt)
            assert request["count"] <= 8
            assert (
                schema.model_json_schema()["properties"]["questions"]["maxItems"] == 8
            )
            earlier = request["previous_prompts"]
            choices = ["A", "B", "C", "D"]
            questions = [
                {
                    "prompt": f"{request['focus']}: questão {i}",
                    "options": choices,
                    "correct_index": 0,
                    "explanations": choices,
                }
                for i in range(request["count"])
            ]
            if schema.__name__ == "StudyBatch":
                questions[0]["prompt"] = earlier[0].upper() + "!"
            return schema.model_validate(
                {
                    "summary": "Resumo",
                    "questions": questions,
                    "flashcards": [{"front": "Pergunta", "back": "Resposta"}] * 3,
                }
            )

    headers = _login(client)
    app.dependency_overrides[get_structured_assistant] = FakeAssistant
    response = client.post(
        "/api/v1/study/generate",
        json={"topic": "college", "previous_prompts": ["Pergunta antiga"]},
        headers=headers,
    )
    assert response.status_code == 200
    prompts = {item["prompt"] for item in response.json()["questions"]}
    assert len(prompts) == 25
    assert "PERGUNTA ANTIGA!" not in prompts


def test_coding_mission_uses_only_catalogued_exercises(client: TestClient) -> None:
    path = "/api/v1/study/coding-mission"
    payload = {"mission_id": "media-movel"}
    assert client.post(path, json=payload).status_code == 401
    headers = _login(client)

    class FakeAssistant:
        async def structured(self, prompt, instruction, schema):
            assert '"level": "intermediário"' in prompt
            assert "solve(data)" in instruction
            return schema(
                scenario="Calcule a média das leituras de sensores.",
                input_hint="Use os campos values e window.",
                strategy_hint="Aproveite a soma da janela anterior.",
                complexity_hint="Percorra os dados uma vez.",
            )

    app.dependency_overrides[get_structured_assistant] = FakeAssistant
    response = client.post(path, json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["strategy_hint"] == "Aproveite a soma da janela anterior."
    assert (
        client.post(
            path, json={"mission_id": "desconhecida"}, headers=headers
        ).status_code
        == 422
    )


def test_unexpected_error_has_reference_and_no_stack_trace(client: TestClient) -> None:
    class BrokenAssistant:
        async def structured(self, prompt, instruction, schema):
            raise RuntimeError("internal diagnostic containing a secret")

    app.dependency_overrides[get_structured_assistant] = BrokenAssistant
    headers = _login(client)
    headers["Origin"] = get_settings().allowed_origins[0]
    result = client.post(
        "/api/v1/study/generate", json={"topic": "cloud"}, headers=headers
    )
    assert result.status_code == 500
    assert result.headers.get("x-request-id")
    assert result.headers["access-control-allow-origin"] == headers["Origin"]
    assert result.json() == {"detail": "Erro interno do servidor."}
