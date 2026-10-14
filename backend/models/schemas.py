from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field

from models.hazard_events import HeatwaveEvent, RainfallEvent


class HazardType(str, Enum):
    HEATWAVE = "heatwave"
    RAINFALL = "rainfall"
    HEAVY_RAINFALL = "heavy_rainfall"


class LocationInfo(BaseModel):
    lat: float
    lon: float


class DataQualityMetrics(BaseModel):
    total_days: int = Field(..., description="Total days in sequence")
    missing_days_filled: int = Field(..., description="Count of missing days interpolated/filled")
    temp_outliers_fixed: int = Field(..., description="Count of temperature outliers corrected")
    precip_outliers_fixed: int = Field(..., description="Count of precipitation outliers clamped")
    completeness_pct: float = Field(..., description="Percentage of original valid daily records")


class HazardDetail(BaseModel):
    """
    Detailed results for a specific hazard type (heatwave or rainfall).
    """
    hazard_type: str = Field(..., description="Hazard type ('heatwave' or 'rainfall')")
    threshold: float = Field(..., description="Regional threshold used for hazard detection")
    total_events: int = Field(..., description="Total hazard events identified")
    events: List[Union[HeatwaveEvent, RainfallEvent]] = Field(..., description="List of detected hazard events")
    yearly_counts: Dict[str, int] = Field(..., description="Annual count of hazard events")
    rolling_avg: Dict[str, float] = Field(..., description="5-year rolling average of annual events")
    insights: List[str] = Field(..., description="Programmatic insights and trend conclusions")


class AnalyzeResponse(BaseModel):
    """
    Response schema for the /api/analyze endpoint.
    """
    hazard_type: str = Field(..., description="Hazard type analyzed ('heatwave' or 'rainfall')")
    location: LocationInfo = Field(..., description="Geographical coordinates")
    start_year: int = Field(..., description="Start year of analyzed window")
    end_year: int = Field(..., description="End year of analyzed window")
    threshold: float = Field(..., description="Regional threshold used for hazard detection")
    total_events: int = Field(..., description="Total hazard events identified")
    events: List[Union[HeatwaveEvent, RainfallEvent]] = Field(..., description="List of detected hazard events")
    yearly_counts: Dict[str, int] = Field(..., description="Annual count of hazard events")
    rolling_avg: Dict[str, float] = Field(..., description="5-year rolling average of annual events")
    insights: List[str] = Field(..., description="Programmatic insights and trend conclusions")
    cached: bool = Field(default=False, description="Whether data was served from MongoDB cache")
    data_quality: Optional[DataQualityMetrics] = Field(default=None, description="Data quality metrics")
    hazards: Optional[Dict[str, HazardDetail]] = Field(
        default=None,
        description="Dual hazard analysis dictionary containing both heatwave and rainfall datasets",
    )


class AISummaryRequest(BaseModel):
    """
    Payload for requesting an AI-generated summary of hazard trends.
    """
    hazard_type: str = Field(default="heatwave", description="Hazard type: 'heatwave' or 'rainfall'")
    start_year: int = Field(..., description="Start year of the analysis")
    end_year: int = Field(..., description="End year of the analysis")
    total_events: int = Field(..., description="Total hazard events detected")
    city_name: Optional[str] = Field(default=None, description="Optional city or location name")
    insights: List[str] = Field(default_factory=list, description="Computed programmatic insight strings")
    stats: Optional[Dict[str, Any]] = Field(default=None, description="Additional statistical metadata")


class AISummaryResponse(BaseModel):
    """
    Response schema for the AI summary endpoint.
    """
    summary: str = Field(..., description="Generated executive summary narrative")
    source: str = Field(..., description="Name of the model or source used")
    is_ai_generated: bool = Field(..., description="Flag indicating whether content is AI-generated")
    risk_level: Optional[str] = Field(default="Elevated Risk", description="Threat level tier: Critical, High, Elevated, Moderate")
    impacts: Optional[List[str]] = Field(default_factory=list, description="Sectoral vulnerability and urban impacts")
    recommendations: Optional[List[str]] = Field(default_factory=list, description="Actionable adaptation and policy recommendations")
