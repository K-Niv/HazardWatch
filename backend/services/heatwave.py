from datetime import datetime
from typing import Any, Dict, List, Optional
import numpy as np

from models.hazard_events import HeatwaveEvent


def calculate_percentile(temperatures: List[Optional[float]], percentile: float = 95.0) -> float:
    """
    Calculate the Nth percentile threshold from a list of maximum temperatures,
    filtering out None or NaN values.
    """
    valid_temps = [t for t in temperatures if t is not None and not np.isnan(t)]
    if not valid_temps:
        return 0.0
    return float(np.percentile(valid_temps, percentile))


def detect_heatwaves(
    dates: List[str],
    tmax: List[Optional[float]],
    threshold: Optional[float] = None,
    percentile: float = 95.0,
    min_consecutive_days: int = 3,
) -> Dict[str, Any]:
    """
    Detect heatwave events from historical daily maximum temperatures.

    Definition:
    A run of 3 or more consecutive days where the daily maximum temperature
    exceeds the 95th percentile historical threshold for that region.

    Args:
        dates: List of ISO date strings ('YYYY-MM-DD').
        tmax: List of daily maximum temperatures in Celsius.
        threshold: Optional pre-computed temperature threshold (°C). If None, calculated via percentile.
        percentile: Percentile to compute threshold when threshold is None (default 95.0).
        min_consecutive_days: Minimum streak length to qualify as a heatwave (default 3).

    Returns:
        Dict containing:
            - 'threshold': The temperature threshold used (°C)
            - 'total_events': Number of heatwave events detected
            - 'events': List of HeatwaveEvent objects
    """
    if not dates or not tmax or len(dates) != len(tmax):
        return {"threshold": 0.0, "total_events": 0, "events": []}

    # 1. Compute 95th percentile threshold if not provided
    if threshold is None:
        threshold = calculate_percentile(tmax, percentile)

    threshold = round(threshold, 2)
    events: List[HeatwaveEvent] = []

    current_streak_dates: List[str] = []
    current_streak_temps: List[float] = []

    def _flush_streak():
        nonlocal current_streak_dates, current_streak_temps
        if len(current_streak_dates) >= min_consecutive_days:
            event = HeatwaveEvent(
                start_date=current_streak_dates[0],
                end_date=current_streak_dates[-1],
                duration=len(current_streak_dates),
                peak_temp=round(float(max(current_streak_temps)), 2),
                avg_temp=round(float(np.mean(current_streak_temps)), 2),
                threshold=threshold,
            )
            events.append(event)
        current_streak_dates = []
        current_streak_temps = []

    # 2. Iterate through daily records and identify consecutive streaks
    prev_date = None
    for date_str, temp in zip(dates, tmax):
        try:
            curr_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            # Malformed date string resets streak
            _flush_streak()
            prev_date = None
            continue

        is_consecutive_day = (prev_date is None) or ((curr_date - prev_date).days == 1)
        prev_date = curr_date

        if temp is not None and not np.isnan(temp) and temp > threshold:
            # If there was a date gap (e.g. missing days in sequence), flush previous streak
            if not is_consecutive_day and current_streak_dates:
                _flush_streak()

            current_streak_dates.append(date_str)
            current_streak_temps.append(float(temp))
        else:
            _flush_streak()

    # Flush any active streak ending on the final day
    _flush_streak()

    return {
        "threshold": threshold,
        "total_events": len(events),
        "events": events,
    }
