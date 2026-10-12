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
    summary: str = Field(..., description="Generated executive summary paragraph")
    source: str = Field(..., description="Name of the model or source used")
    is_ai_generated: bool = Field(..., description="Flag indicating whether content is AI-generated")
