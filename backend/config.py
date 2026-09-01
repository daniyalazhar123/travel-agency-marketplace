"""Application settings loaded from backend/.env via pydantic-settings."""
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # --- External AI providers ---
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    cohere_api_key: str = Field(default="", alias="COHERE_API_KEY")

    @property
    def async_database_url(self) -> str:
        """Ensure the URL uses the asyncpg driver required by SQLAlchemy async engine."""
        url = self.database_url
        if not url:
            return ""
        if url.startswith("postgresql+asyncpg://"):
            return url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in ("production", "prod")


@lru_cache
def get_settings() -> Settings:
    return Settings()
