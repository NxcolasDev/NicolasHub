# Imagem enxuta: instala dependências e executa a API sem copiar configurações secretas.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY backend/ /app/
COPY src/ /app/src/
RUN useradd --create-home hub && chown hub /app
USER hub

EXPOSE 8080
CMD ["sh", "-c", "if [ \"${RUN_MIGRATIONS:-false}\" = true ]; then alembic upgrade head || exit 1; fi; exec uvicorn app.main:app --host 0.0.0.0 --port \"${PORT:-8080}\""]
