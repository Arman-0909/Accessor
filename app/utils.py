import secrets
import string
from datetime import datetime, timezone


def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


def mask_key(key: str) -> str:
    return key[:6] + "..." + key[-4:]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def is_expired(dt: datetime) -> bool:
    aware = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return aware < utc_now()
