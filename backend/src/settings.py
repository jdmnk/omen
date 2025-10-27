from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized application settings loaded from environment variables.

    Uses pydantic-settings to automatically load from:
    1. Environment variables
    2. .env file (if present)
    """

    # Database
    database_url: str

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # API Configuration
    api_env: str = "dev"

    # Polymarket
    polymarket_private_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )


# Global settings instance
settings = Settings()
