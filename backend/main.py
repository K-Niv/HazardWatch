from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import ai_summary, analyze, health
from services import weather

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
app.include_router(analyze.router, prefix="/api")
app.include_router(ai_summary.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Welcome to HazardWatch API. Visit /docs for interactive OpenAPI documentation.",
        "status": "online",
    }


@app.get("/weather/{lat}/{lon}/{start_year}/{end_year}")
async def get_weather(lat: float, lon: float, start_year: str, end_year: str):
    """
    Fetch historical weather data for a specific location.

    Args:
        lat: Latitude of the location
        lon: Longitude of the location
        start_year: Start year (e.g., 1990) or date (YYYY-MM-DD)
        end_year: End year (e.g., 2020) or date (YYYY-MM-DD)

    Returns:
        JSON containing historical weather data (daily tmax and precipitation)
    """
    return await weather.get_weather_data(lat, lon, start_year, end_year)
