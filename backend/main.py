"""
AgroMap Backend — FastAPI Application Entry Point.

Smart Plantation Planning backend for hackathon demo.
Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from models.schemas import HealthResponse
from routers import land, crops, plantation, nurseries, bookings, weather, water

# ─── App Setup ────────────────────────────────────────────────

app = FastAPI(
    title="AgroMap API",
    description="Smart Plantation Planning Backend — Hackathon Edition",
    version="hackathon-v1",
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc
)

# ─── CORS (allow all origins for hackathon) ───────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include All Routers under /api/v1 ───────────────────────

API_PREFIX = "/api/v1"

app.include_router(land.router, prefix=API_PREFIX)
app.include_router(crops.router, prefix=API_PREFIX)
app.include_router(plantation.router, prefix=API_PREFIX)
app.include_router(nurseries.router, prefix=API_PREFIX)
app.include_router(bookings.router, prefix=API_PREFIX)
app.include_router(weather.router, prefix=API_PREFIX)
app.include_router(water.router, prefix=API_PREFIX)


# ─── Health Check ─────────────────────────────────────────────

@app.get(f"{API_PREFIX}/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Confirm backend is alive and running."""
    return HealthResponse(status="ok", version="hackathon-v1")


# ─── Serve Test Frontend ─────────────────────────────────────

_STATIC_DIR = Path(__file__).resolve().parent / "static"

if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")

    @app.get("/", include_in_schema=False)
    async def serve_frontend():
        return FileResponse(str(_STATIC_DIR / "index.html"))
