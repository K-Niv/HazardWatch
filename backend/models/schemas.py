from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


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
