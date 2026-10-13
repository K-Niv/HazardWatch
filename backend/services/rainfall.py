from datetime import datetime
from typing import Any, Dict, List, Optional
import numpy as np

from models.hazard_events import RainfallEvent


def calculate_rainfall_percentile(
    precipitation: List[Optional[float]],
    percentile: float = 95.0,
    wet_day_threshold: float = 1.0,
) -> float:
    """
    Calculate the regional extreme precipitation threshold (R95p).

    Standard WMO methodology:
    Calculates the 95th percentile among wet days (daily precipitation >= wet_day_threshold).
    This avoids distortion from the large proportion of dry days (0 mm).
    If there are insufficient wet days, falls back to a sensible minimum (10.0 mm).
    """
    wet_days = [
        float(p) for p in precipitation
        if p is not None and not np.isnan(p) and p >= wet_day_threshold
    ]
    if not wet_days:
        return 15.0  # Fallback for hyper-arid regions with almost zero rain
    return max(float(np.percentile(wet_days, percentile)), 10.0)


def detect_heavy_rainfall(
    dates: List[str],
    precipitation: List[Optional[float]],
    threshold: Optional[float] = None,
    percentile: float = 95.0,
    single_day_threshold: float = 50.0,
    min_consecutive_days: int = 3,
) -> Dict[str, Any]:
    """
    Detect heavy rainfall hazard events from historical daily precipitation data.

    Criteria for an event:
    1. Prolonged Heavy Rainfall: 3 or more consecutive days with daily precipitation
       exceeding the regional 95th percentile wet-day threshold.
    2. Extreme Single-Day Downpour: Any event with single-day precipitation >= single_day_threshold (50mm).

    Args:
        dates: List of ISO date strings ('YYYY-MM-DD').
        precipitation: List of daily precipitation sums in millimeters.
        threshold: Optional pre-computed regional threshold (mm). If None, calculated via percentile.
        percentile: Percentile of wet days to use as threshold (default 95.0).
        single_day_threshold: Single-day rainfall amount qualifying as extreme downpour in mm (default 50.0).
        min_consecutive_days: Minimum streak length for prolonged heavy rain (default 3).

    Returns:
        Dict containing:
            - 'threshold': The regional wet-day threshold used (mm)
            - 'single_day_threshold': The single-day threshold used (mm)
            - 'total_events': Number of rainfall hazard events detected
            - 'events': List of RainfallEvent objects
    """
    if not dates or not precipitation or len(dates) != len(precipitation):
        return {
            "threshold": 0.0,
            "single_day_threshold": single_day_threshold,
            "total_events": 0,
            "events": [],
        }

    # 1. Compute regional threshold if not provided
    if threshold is None:
        threshold = calculate_rainfall_percentile(precipitation, percentile)

    threshold = round(threshold, 2)
    events: List[RainfallEvent] = []

    current_streak_dates: List[str] = []
    current_streak_precip: List[float] = []

    def _flush_streak():
        nonlocal current_streak_dates, current_streak_precip
        if not current_streak_dates:
            return

        duration = len(current_streak_dates)
        peak_daily = round(float(max(current_streak_precip)), 2)
        total_precip = round(float(sum(current_streak_precip)), 2)

        # Qualifies if 3+ consecutive days OR peak single-day >= single_day_threshold
        is_prolonged = duration >= min_consecutive_days
        is_extreme_downpour = peak_daily >= single_day_threshold

        if is_prolonged or is_extreme_downpour:
            event_type = (
                "prolonged_extreme_rain" if is_prolonged and is_extreme_downpour
                else "extreme_downpour" if is_extreme_downpour
                else "prolonged_heavy_rain"
            )
            event = RainfallEvent(
                start_date=current_streak_dates[0],
                end_date=current_streak_dates[-1],
                duration=duration,
                total_mm=total_precip,
                peak_daily_mm=peak_daily,
                threshold_used=threshold,
                event_type=event_type,
            )
            events.append(event)

        current_streak_dates = []
        current_streak_precip = []

    # 2. Iterate daily records
    prev_date = None
    for date_str, precip in zip(dates, precipitation):
        try:
            curr_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            _flush_streak()
            prev_date = None
            continue

        is_consecutive_day = (prev_date is None) or ((curr_date - prev_date).days == 1)
        prev_date = curr_date

        # Qualifies as a wet candidate day if it exceeds regional threshold or single-day downpour threshold
        is_candidate_day = (
            precip is not None
            and not np.isnan(precip)
            and (precip >= threshold or precip >= single_day_threshold)
        )

        if is_candidate_day:
            if not is_consecutive_day and current_streak_dates:
                _flush_streak()

            current_streak_dates.append(date_str)
            current_streak_precip.append(float(precip))
        else:
            _flush_streak()

    # Flush any active streak ending on the final day
    _flush_streak()

    return {
        "threshold": threshold,
        "single_day_threshold": single_day_threshold,
        "total_events": len(events),
        "events": events,
    }
