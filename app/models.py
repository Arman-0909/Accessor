from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)

class APIKey(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    key: str = Field(index=True, unique=True)
    is_active: bool = Field(default=True)
    rate_limit: int = Field(default=100)
    expires_at: Optional[datetime] = Field(default=None)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=get_utc_now)

class UsageLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    api_key_id: Optional[int] = Field(default=None, foreign_key="apikey.id")
    timestamp: datetime = Field(default_factory=get_utc_now)
