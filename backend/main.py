from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import health

app = FastAPI(
    title=settings.APP_NAME,
    description="Climate Hazard Trend Analyzer API - Heatwave & Heavy Rainfall Analysis",
    version="0.1.0",
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


@app.get("/")
async def root():
    return {
        "message": "Welcome to HazardWatch API. Visit /docs for interactive OpenAPI documentation.",
        "status": "online",
    }
