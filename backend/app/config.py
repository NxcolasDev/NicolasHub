"""Configuração tipada com BaseSettings (OO) e cache via decorador @lru_cache."""

from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import AliasChoices, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Modelo OO de configurações; type hints validam valores lidos do ambiente."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
        hide_input_in_errors=True,
    )

    app_environment: Literal["development", "production"] = "development"
    database_url: str = "sqlite:///./nicolas_hub.db"
    jwt_secret_key: SecretStr | None = None
    jwt_access_token_expire_minutes: int = Field(default=30, ge=1, le=1440)
    public_registration: bool | None = None
    rate_limit_login: int = Field(default=10, ge=1)
    rate_limit_register: int = Field(default=5, ge=1)
    rate_limit_logic: int = Field(default=60, ge=1)
    rate_limit_ai_account: int = Field(default=10, ge=1)
    rate_limit_ai_global: int = Field(default=60, ge=1)
    request_max_bytes: int = Field(default=262144, ge=1024, le=1048576)
    aws_region: str = "us-east-1"
    sqs_queue_url: str | None = None
    aws_sqs_role_arn: str | None = None
    aws_web_identity_audience: str | None = None
    gemini_api_key: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("GEMINI_API_KEY", "AI_API_KEY"),
    )
    ai_model: str = Field(
        default="gemini-3.5-flash-lite", pattern=r"^[A-Za-z0-9][\w.-]*$"
    )
    ai_timeout_seconds: float = Field(default=20.0, gt=0, le=120)
    frontend_origins: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        origins = [value.strip() for value in self.frontend_origins.split(",")]
        if self.app_environment == "development" and not any(origins):
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return [value for value in origins if value]

    @property
    def registration_enabled(self) -> bool:
        if self.public_registration is not None:
            return self.public_registration
        return self.app_environment == "development"

    @model_validator(mode="after")
    def validate_deployment(self) -> "Settings":
        if bool(self.aws_sqs_role_arn) != bool(self.aws_web_identity_audience):
            raise ValueError("AWS_SQS_ROLE_ARN e AWS_WEB_IDENTITY_AUDIENCE são um par.")

        for origin in self.allowed_origins:
            url = urlsplit(origin)
            allowed_schemes = (
                {"https"} if self.app_environment == "production" else {"http", "https"}
            )
            if (
                url.scheme not in allowed_schemes
                or not url.hostname
                or url.username is not None
                or url.path
                or url.query
                or url.fragment
                or "*" in origin
                or any(char.isspace() for char in origin)
                or url.netloc.endswith(":")
            ):
                raise ValueError(
                    "FRONTEND_ORIGINS deve conter origens explícitas válidas."
                )
            try:
                _ = url.port
            except ValueError:
                raise ValueError(
                    "FRONTEND_ORIGINS contém uma porta inválida."
                ) from None

        if self.app_environment == "production":
            if not self.database_url.startswith("postgresql+psycopg://"):
                raise ValueError(
                    "DATABASE_URL deve apontar para PostgreSQL em produção."
                )
            secret = (
                self.jwt_secret_key.get_secret_value() if self.jwt_secret_key else ""
            )
            if len(secret) < 32 or secret.upper().startswith("MOCK_ONLY"):
                raise ValueError(
                    "JWT_SECRET_KEY deve ser um segredo forte de produção."
                )
        return self


@lru_cache
def get_settings() -> Settings:
    """Lê o ambiente uma vez; @lru_cache reaproveita a instância tipada."""

    return Settings()
