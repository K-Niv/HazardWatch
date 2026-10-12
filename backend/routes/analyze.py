from typing import Literal
from fastapi import APIRouter, HTTPException, Query

from models.schemas import AnalyzeResponse, LocationInfo
from services import heatwave, rainfall, trends, weather

router = APIRouter(tags=["Analysis"])


@router.get("/analyze", response_model=AnalyzeResponse)
async def analyze_hazard(
    lat: float = Query(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude of the target location (-90.0 to 90.0)",
        examples=[28.61],
    ),
    lon: float = Query(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude of the target location (-180.0 to 180.0)",
        examples=[77.20],
    ),
    start_year: int = Query(
        default=1990,
        ge=1950,
        le=2025,
        description="Start year for analysis (1950 to 2025)",
        examples=[1990],
    ),
    end_year: int = Query(
        default=2020,
        ge=1950,
        le=2025,
        description="End year for analysis (1950 to 2025)",
        examples=[2020],
    ),
    hazard: Literal["heatwave", "rainfall", "heavy_rainfall"] = Query(
        default="heatwave",
        description="Hazard type to analyze ('heatwave' or 'rainfall')",
    ),
):
    """
    Primary analysis endpoint for HazardWatch.

    Pipeline:
    1. Validates coordinate bounds and year ranges (start_year < end_year).
    2. Retrieves historical weather data via MongoDB cache (falling back to Open-Meteo Archive API).
    3. Runs hazard event detection (Heatwave 95th percentile runs OR Heavy Rainfall wet-day R95p / downpours).
    4. Computes annual hazard counts, 5-year rolling averages, and programmatic trend insights.
    5. Returns structured JSON ready for frontend charts and insight cards.
    """
    if start_year >= end_year:
        raise HTTPException(
            status_code=400,
            detail=f"start_year ({start_year}) must be strictly earlier than end_year ({end_year}).",
        )

    # 1. Fetch weather data (checks MongoDB cache first)
    weather_data = await weather.get_weather_data(lat, lon, start_year, end_year)
    daily = weather_data.get("daily", {})
    dates = daily.get("time", [])

    if not dates:
        raise HTTPException(
            status_code=502,
            detail="No daily historical weather observations were returned for the requested coordinate and period.",
        )

    # 2. Detect hazard events based on requested hazard type
    normalized_hazard = "rainfall" if "rain" in hazard.lower() else "heatwave"

    if normalized_hazard == "heatwave":
        tmax = daily.get("temperature_2m_max", [])
        detection_result = heatwave.detect_heatwaves(dates, tmax)
    else:
        precip = daily.get("precipitation_sum", [])
        detection_result = rainfall.detect_heavy_rainfall(dates, precip)

    events = detection_result.get("events", [])
    threshold = detection_result.get("threshold", 0.0)

    # 3. Analyze trends (yearly counts, 5-year rolling average, insight strings)
    trend_results = trends.analyze_trends(
        events=events,
        start_year=start_year,
        end_year=end_year,
        hazard_type=normalized_hazard,
    )

    return AnalyzeResponse(
        hazard_type=normalized_hazard,
        location=LocationInfo(lat=lat, lon=lon),
        start_year=start_year,
        end_year=end_year,
        threshold=threshold,
        total_events=len(events),
        events=events,
        yearly_counts=trend_results["yearly_counts"],
        rolling_avg=trend_results["rolling_avg"],
        insights=trend_results["insights"],
        cached=weather_data.get("cached", False),
    )
