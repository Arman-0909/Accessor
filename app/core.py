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

    class Config:
        env_file = ".env"


settings = Settings()