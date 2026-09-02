"""Application settings loaded from backend/.env via pydantic-settings."""
from functools import lru_cache
from urllib.parse import urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _asyncpg_url(raw: str) -> str:
    """Convert a libpq-style DATABASE_URL to an asyncpg-ready URL.

    - swaps the driver to postgresql+asyncpg
    - strips libpq-only query params (sslmode, channel_binding, sslrootcertificate)
      that asyncpg does not understand (asyncpg verifies TLS by default)
    """
    url = raw.strip()
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    parts = urlsplit(url)
    if parts.query:
        kept = [
            kv
            for kv in parts.query.split("&")
            if not kv.lower().startswith(("sslmode=", "channel_binding=", "sslrootcertificate="))
        ]
        url = urlunsplit((parts.scheme, parts.netloc, parts.path, "&".join(kept), parts.fragment))
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Environment ---
    environment: str = Field(default="development", alias="ENVIRONMENT")

    # --- Security ---
    api_key: str = Field(default="", alias="API_KEY")
    jwt_secret: str = Field(default="change-me-in-production", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # --- Database ---
    database_url: str = Field(default="", alias="DATABASE_URL")
    db_pool_size: int = Field(default=5, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=10, alias="DB_MAX_OVERFLOW")

    # --- CORS ---
    frontend_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="FRONTEND_ORIGINS",
    )

    # --- Email (Resend) ---
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    email_from: str = Field(default="Travel Agency <onboarding@resend.dev>", alias="EMAIL_FROM")
    app_base_url: str = Field(default="http://localhost:3000", alias="APP_BASE_URL")
    email_verification_expire_minutes: int = Field(default=30, alias="EMAIL_VERIFICATION_EXPIRE_MINUTES")
    require_email_verification: bool = Field(default=True, alias="REQUIRE_EMAIL_VERIFICATION")

    # --- External AI providers ---
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    cohere_api_key: str = Field(default="", alias="COHERE_API_KEY")

    @property
    def async_database_url(self) -> str:
        """Convert the libpq-style DATABASE_URL to an asyncpg-ready URL."""
        return _asyncpg_url(self.database_url) if self.database_url else ""

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in ("production", "prod")


@lru_cache
def get_settings() -> Settings:
    return Settings()
