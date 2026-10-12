from pydantic import BaseModel, Field


class HeatwaveEvent(BaseModel):
    """
    Represents a detected heatwave hazard event.
    """
    start_date: str = Field(..., description="Start date of the heatwave (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date of the heatwave (YYYY-MM-DD)")
    duration: int = Field(..., description="Duration in consecutive days (>= 3)")
    peak_temp: float = Field(..., description="Highest daily max temperature during event (°C)")
    avg_temp: float = Field(..., description="Average daily max temperature during event (°C)")
    threshold: float = Field(..., description="Regional 95th percentile temperature threshold (°C)")
