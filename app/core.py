from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://neondb_owner:npg_qWMdvEk4ft7S@ep-spring-band-amna1p2j.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
    SECRET_KEY: str = "accessor-super-secret-key-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REDIS_URL: str = "redis://localhost:6379"
    APP_NAME: str = "Accessor"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = ["*"]
    MAX_CONNECTIONS_COUNT: int = 10
    MIN_CONNECTIONS_COUNT: int = 10
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Accessor API"

    class Config:
        env_file = ".env"


settings = Settings()