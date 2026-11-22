"""Create or reset a Hub account through an authorized database connection."""

from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.domain import User
from app.security import hash_password


def main() -> None:
    url = getpass("URL do banco Neon (entrada oculta): ").strip()
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if not url.startswith("postgresql+psycopg://"):
        raise SystemExit("Informe uma URL PostgreSQL válida.")
    try:
        email = str(TypeAdapter(EmailStr).validate_python(input("E-mail: "))).lower()
    except ValidationError:
        raise SystemExit("E-mail inválido.") from None
    password = getpass("Nova senha (12 a 128 caracteres): ")
    if not 12 <= len(password) <= 128 or password != getpass("Confirme a senha: "):
        raise SystemExit("A senha precisa ter de 12 a 128 caracteres e coincidir.")
    try:
        engine = create_engine(url, hide_parameters=True)
        with Session(engine) as db:
            user = db.scalar(select(User).where(User.email == email))
            if user is None:
                db.add(User(email=email, hashed_password=hash_password(password)))
            else:
                user.hashed_password = hash_password(password)
            db.commit()
    except (SQLAlchemyError, ValueError):
        raise SystemExit(
            "Falha ao atualizar a conta. Confira a URL e as migrações."
        ) from None
    print("Conta atualizada. Entre com o e-mail, a nova senha e a chave do Render.")


if __name__ == "__main__":
    main()
