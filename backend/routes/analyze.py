from typing import Literal
from fastapi import APIRouter, HTTPException, Query

from models.schemas import (
    AnalyzeResponse,
    DataQualityMetrics,
    HazardDetail,
    LocationInfo,
)
from services import data_quality, heatwave, rainfall, trends, weather

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
    3. Runs data quality hygiene (fills missing days, clamps/filters physical outliers).
    4. Runs hazard event detection (Heatwave 95th percentile runs OR Heavy Rainfall wet-day R95p / downpours).
    5. Computes annual hazard counts, 5-year rolling averages, and programmatic trend insights.
    6. Returns structured JSON ready for frontend charts, insight cards, and quality metrics.
    """
    if start_year >= end_year:
        raise HTTPException(
            status_code=400,
            detail=f"start_year ({start_year}) must be strictly earlier than end_year ({end_year}).",
        )

    # 1. Fetch weather data (checks MongoDB cache first)
    weather_data = await weather.get_weather_data(lat, lon, start_year, end_year)
    daily = weather_data.get("daily", {})
    raw_dates = daily.get("time", [])
    raw_tmax = daily.get("temperature_2m_max", [])
    raw_precip = daily.get("precipitation_sum", [])

    if not raw_dates:
        raise HTTPException(
            status_code=502,
            detail="No daily historical weather observations were returned for the requested coordinate and period.",
        )

    # 2. Data quality handling: fill sequence gaps and filter physical outliers
    cleaned = data_quality.clean_weather_data(raw_dates, raw_tmax, raw_precip)
    dates = cleaned["dates"]
    tmax = cleaned["tmax"]
    precip = cleaned["precip"]
    quality_metrics = cleaned["metrics"]

    # 3. Detect both Heatwave and Heavy Rainfall hazards in parallel
    # A. Heatwaves
    hw_detection = heatwave.detect_heatwaves(dates, tmax)
    hw_events = hw_detection.get("events", [])
    hw_threshold = hw_detection.get("threshold", 0.0)
    hw_trends = trends.analyze_trends(
        events=hw_events,
        start_year=start_year,
        end_year=end_year,
        hazard_type="heatwave",
    )
    hw_detail = HazardDetail(
        hazard_type="heatwave",
        threshold=hw_threshold,
        total_events=len(hw_events),
        events=hw_events,
        yearly_counts=hw_trends["yearly_counts"],
        rolling_avg=hw_trends["rolling_avg"],
        insights=hw_trends["insights"],
    )

    # B. Heavy Rainfall
    rf_detection = rainfall.detect_heavy_rainfall(dates, precip)
    rf_events = rf_detection.get("events", [])
    rf_threshold = rf_detection.get("threshold", 0.0)
    rf_trends = trends.analyze_trends(
        events=rf_events,
        start_year=start_year,
        end_year=end_year,
        hazard_type="rainfall",
    )
    rf_detail = HazardDetail(
        hazard_type="rainfall",
        threshold=rf_threshold,
        total_events=len(rf_events),
        events=rf_events,
        yearly_counts=rf_trends["yearly_counts"],
        rolling_avg=rf_trends["rolling_avg"],
        insights=rf_trends["insights"],
    )

    hazards_dict = {
        "heatwave": hw_detail,
        "rainfall": rf_detail,
    }

    # Selected active hazard (for backward compatibility)
    normalized_hazard = "rainfall" if "rain" in hazard.lower() else "heatwave"
    active_detail = hazards_dict[normalized_hazard]

    return AnalyzeResponse(
        hazard_type=normalized_hazard,
        location=LocationInfo(lat=lat, lon=lon),
        start_year=start_year,
        end_year=end_year,
        threshold=active_detail.threshold,
        total_events=active_detail.total_events,
        events=active_detail.events,
        yearly_counts=active_detail.yearly_counts,
        rolling_avg=active_detail.rolling_avg,
        insights=active_detail.insights,
        cached=weather_data.get("cached", False),
        data_quality=DataQualityMetrics(**quality_metrics),
        hazards=hazards_dict,
    )
