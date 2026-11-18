"""SQLAlchemy engine and typed session dependency for FastAPI."""

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """Base declarativa comum às tabelas que o Alembic versiona."""


def get_database_url() -> str:
    url = get_settings().database_url
    if (
        url == "sqlite:///./nicolas_hub.db"
        and not Path("nicolas_hub.db").exists()
        and Path("pylogic.db").is_file()
    ):
        return "sqlite:///./pylogic.db"
    return url


def _create_database_engine() -> Engine:
    """Monta o engine tipado; SQLite recebe configuração extra para uso multithread."""

    url = get_database_url()
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    return create_engine(
        url, pool_pre_ping=True, connect_args=connect_args, hide_parameters=True
    )


engine = _create_database_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """Usa um generator tipado como dependência FastAPI e sempre fecha a sessão."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
