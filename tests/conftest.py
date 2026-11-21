"""Fixture pytest typed; SQLite in-memory isolates tests from external services."""

import os
import secrets
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("JWT_SECRET_KEY", secrets.token_urlsafe(48))
TEST_ADMIN_KEY = secrets.token_urlsafe(48)
os.environ["ADMIN_SECRET_KEY"] = TEST_ADMIN_KEY
os.environ.setdefault("SQS_QUEUE_URL", "")

from app import limits  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    """Cria esquema e substitui Depends da API durante o ciclo de vida do teste."""

    monkeypatch.setattr(limits, "_window", -1)
    monkeypatch.setattr(limits, "_counts", {})
    monkeypatch.setattr(get_settings(), "sqs_queue_url", None)
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, headers={"X-Admin-Key": TEST_ADMIN_KEY}) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()
