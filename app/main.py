from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from app.core import settings
from app.database import create_db_and_tables
from app.middleware.tracking import UsageTrackingMiddleware
from app.auth.router import router as auth_router
from app.keys.router import router as keys_router
from app.analytics.router import router as analytics_router


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="API Key Management & Usage Tracking System"
)

app.add_middleware(UsageTrackingMiddleware)

app.include_router(auth_router)
app.include_router(keys_router)
app.include_router(analytics_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/status")
def status():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }

os.makedirs("app/static", exist_ok=True)
app.mount("/", StaticFiles(directory="app/static", html=True), name="static")