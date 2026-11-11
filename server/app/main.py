"""FastAPI 入口：uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .routers.community import router as community_router
from .routers.saved_trips import router as saved_trips_router
from .routers.trip import router

app = FastAPI(title="途灵 TripGenie API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(saved_trips_router)
app.include_router(community_router)


@app.get("/health")
def health() -> dict:
    settings = Settings.from_env()
    return {"status": "ok", "engine": settings.resolve_engine()}
