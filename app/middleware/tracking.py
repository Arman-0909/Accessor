from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlmodel import Session, select
from app.database import engine
from app.models import UsageLog, APIKey
from app.core import settings
import time
import redis.asyncio as redis
from datetime import datetime, timezone

if settings.REDIS_URL.startswith("rediss://"):
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True, ssl_cert_reqs="none")
else:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class UsageTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        api_key = request.headers.get("X-API-Key")
        key_id = None
        
        if api_key:
            with Session(engine) as session:
                key = session.exec(select(APIKey).where(APIKey.key == api_key)).first()
                if not key or not key.is_active:
                    return JSONResponse(status_code=401, content={"detail": "Invalid or inactive API Key"})
                
                if key.expires_at and key.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
                    return JSONResponse(status_code=403, content={"detail": "API Key has expired"})
                
                minute = int(time.time() // 60)
                redis_key = f"rate_limit:{key.key}:{minute}"
                
                try:
                    current_requests = await redis_client.incr(redis_key)
                    if current_requests == 1:
                        await redis_client.expire(redis_key, 60)
                        
                    if current_requests > key.rate_limit:
                        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
                except Exception as e:
                    # Do not swallow the error. If Redis is down, return 500 to alert the user.
                    return JSONResponse(status_code=500, content={"detail": f"Redis Error: {str(e)}"})
                
                key_id = key.id

        start_time = time.time()
        response = await call_next(request)
        response_time_ms = (time.time() - start_time) * 1000

        if key_id:
            with Session(engine) as session:
                log = UsageLog(
                    endpoint=str(request.url.path),
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=round(response_time_ms, 2),
                    api_key_id=key_id
                )
                session.add(log)
                session.commit()

        return response