import time
import redis
from fastapi import Depends, Header, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.database import get_session
from app.core import settings
from app.models import User, APIKey

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Sync Redis — FastAPI runs sync dependencies in a thread pool, so this is safe
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.get(User, int(user_id))
    if user is None:
        raise credentials_exception
    return user


def validate_api_key(
    request: Request,
    x_api_key: str = Header(default=None),
    session: Session = Depends(get_session),
) -> APIKey | None:
    """
    Optional API key validation. If no X-API-Key header is present, passes through.
    On success, stores the key ID in request.state for the logging middleware.
    """
    if not x_api_key:
        return None

    key = session.exec(select(APIKey).where(APIKey.key == x_api_key)).first()
    if not key or not key.is_active:
        raise HTTPException(status_code=401, detail="Invalid or inactive API Key")

    if key.expires_at and key.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="API Key has expired")

    minute = int(time.time() // 60)
    redis_key = f"rate_limit:{key.key}:{minute}"
    try:
        count = redis_client.incr(redis_key)
        if count == 1:
            redis_client.expire(redis_key, 60)
        if count > key.rate_limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redis error: {e}")

    request.state.api_key_id = key.id
    return key
