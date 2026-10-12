# Backend runtime — matches the local dev/test environment (Python 3.14).
FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code (secrets come from platform env vars, never baked in)
COPY . .

# Never run as root
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# $PORT is injected by Render/Railway; 8000 fallback for local docker runs.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
