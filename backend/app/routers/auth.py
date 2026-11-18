"""Typed route handlers; decorators register routes and Depends injects inputs."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, ConfigDict, EmailStr, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.limits import client_ip, enforce_limit
from app.models.domain import User
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    """Entrada validada para criação de usuário."""

    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    """Representação pública da conta que nunca contém o hash da senha."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr


class TokenResponse(BaseModel):
    """Resposta compatível com OAuth2 password bearer."""

    access_token: str
    token_type: str = "bearer"


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Valida entrada, persiste conta e trata email duplicado."""

    settings = get_settings()
    if not settings.registration_enabled:
        raise HTTPException(403, "O cadastro público está desativado.")
    enforce_limit(db, "register", client_ip(request), settings.rate_limit_register)
    normalized_email = str(payload.email).lower()
    if db.scalar(select(User.id).where(User.email == normalized_email)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado."
        )

    user = User(email=normalized_email, hashed_password=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado.",
        ) from error
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Verifica credenciais do formulário e emite JWT."""

    enforce_limit(db, "login", client_ip(request), get_settings().rate_limit_login)
    if len(form.username) > 254 or len(form.password) > 128:
        raise HTTPException(422, "Revise as credenciais informadas.")
    try:
        credentials = LoginRequest(email=form.username, password=form.password)
    except ValidationError as error:
        raise HTTPException(422, "Revise as credenciais informadas.") from error

    user = db.scalar(select(User).where(User.email == str(credentials.email).lower()))
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(str(user.id)))
