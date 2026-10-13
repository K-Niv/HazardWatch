import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import ai_summary, analyze, health

# Configure logging so INFO/DEBUG messages from services are visible
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle handler."""
    from database import init_db, close_db

    init_db()
    yield
    close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="Climate Hazard Trend Analyzer API - Heatwave & Heavy Rainfall Analysis",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(ai_summary.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Welcome to HazardWatch API. Visit /docs for interactive OpenAPI documentation.",
        "status": "online",
    }

