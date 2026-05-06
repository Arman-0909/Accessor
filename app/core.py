"""
core.py — Application Settings

Loads all configuration from environment variables (or .env file) via
pydantic-settings. Import `settings` from here wherever config is needed.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Database ---
    DATABASE_URL: str = "postgresql://neondb_owner:npg_qWMdvEk4ft7S@ep-spring-band-amna1p2j.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"

    # --- Auth / JWT ---
    SECRET_KEY: str = "accessor-super-secret-key-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Cache ---
    REDIS_URL: str = "redis://localhost:6379"

    # --- App identity ---
    APP_NAME: str = "Accessor"
    PROJECT_NAME: str = "Accessor API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # --- Runtime ---
    DEBUG: bool = True
    ENVIRONMENT: str = "development"  # development | staging | production
    CORS_ORIGINS: list[str] = ["*"]

    # --- DB connection pool ---
    MAX_CONNECTIONS_COUNT: int = 10
    MIN_CONNECTIONS_COUNT: int = 10

    class Config:
        env_file = ".env"


settings = Settings()