from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

# --- API Key Schemas ---
class APIKeyCreate(BaseModel):
    name: str
    rate_limit: Optional[int] = 100
    expires_at: Optional[datetime] = None

class APIKeyUpdate(BaseModel):
    name: Optional[str] = None
    rate_limit: Optional[int] = None
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    id: int
    name: str
    key: str
    is_active: bool
    rate_limit: int
    expires_at: Optional[datetime]
    user_id: Optional[int]
    created_at: datetime

# --- Analytics Schemas ---
class UsageLogResponse(BaseModel):
    id: int
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    api_key_id: Optional[int]
    timestamp: datetime

class AnalyticsSummary(BaseModel):
    key_name: str
    total_requests: int
    success_rate: float
    error_rate: float
    avg_response_time_ms: float
