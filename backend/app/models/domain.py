"""Entidades OO SQLAlchemy com Mapped type hints e índices para consultas analíticas."""

from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """Modelo OO da conta; relacionamento tipado conecta usuários e seus eventos."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    events: Mapped[list["Event"]] = relationship(back_populates="user")


class Event(Base):
    """Modelo OO do evento; índices aceleram filtros severity/data e agregações."""

    __tablename__ = "events"
    __table_args__ = (Index("ix_events_user_created_at", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    severity: Mapped[str] = mapped_column(String(20), index=True)
    message: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    user: Mapped[User] = relationship(back_populates="events")


class RequestRateLimit(Base):
    """Contador por identidade e janela de tempo compartilhado entre instâncias."""

    __tablename__ = "request_rate_limits"

    bucket: Mapped[str] = mapped_column(String(100), primary_key=True)
    window_id: Mapped[int] = mapped_column(BigInteger, index=True)
    hits: Mapped[int] = mapped_column(Integer)


class ProjectVideo(Base):
    __tablename__ = "project_videos"
    __table_args__ = (
        UniqueConstraint("project", "video_id", name="uq_project_videos_project_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project: Mapped[str] = mapped_column(String(32))
    video_id: Mapped[str] = mapped_column(String(11))


class ProjectCover(Base):
    __tablename__ = "project_covers"

    project: Mapped[str] = mapped_column(String(32), primary_key=True)
    revision: Mapped[str] = mapped_column(String(20))
    image: Mapped[bytes] = mapped_column(LargeBinary)
