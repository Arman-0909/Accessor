import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlmodel import Session
from app.database import engine
from app.models import UsageLog


class UsageTrackingMiddleware(BaseHTTPMiddleware):
    """
    Times every request and logs usage for API-key-authenticated calls.
    Key validation and rate limiting are handled upstream by the
    validate_api_key dependency, which stores the key ID in request.state.
    """
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        elapsed_ms = round((time.time() - start) * 1000, 2)

        api_key_id = getattr(request.state, "api_key_id", None)
        if api_key_id:
            with Session(engine) as session:
                session.add(UsageLog(
                    endpoint=request.url.path,
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=elapsed_ms,
                    api_key_id=api_key_id,
                ))
                session.commit()

        return response