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


class RainfallEvent(BaseModel):
    """
    Represents a detected heavy rainfall hazard event.
    """
    start_date: str = Field(..., description="Start date of the rainfall event (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date of the rainfall event (YYYY-MM-DD)")
    duration: int = Field(..., description="Duration in consecutive days")
    total_mm: float = Field(..., description="Total cumulative precipitation during event (mm)")
    peak_daily_mm: float = Field(..., description="Highest single-day precipitation during event (mm)")
    threshold_used: float = Field(..., description="Regional precipitation threshold used (mm)")
    event_type: str = Field(
        ...,
        description="Type of event: 'prolonged_heavy_rain' (3+ days) or 'extreme_downpour' (daily precip >= 50mm)",
    )
