from datetime import datetime, timedelta
import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

# Meteorological physical plausibility bounds
TEMP_MIN_BOUND = -90.0   # World record minimum ~ -89.2°C (Vostok, Antarctica)
TEMP_MAX_BOUND = 60.0    # World record maximum ~ 56.7°C (Death Valley)
PRECIP_MIN_BOUND = 0.0   # Precipitation cannot be negative
PRECIP_MAX_BOUND = 2000.0  # World record 24h rainfall ~ 1825mm (Réunion)


def clean_weather_data(
    dates: List[str],
    tmax: List[Optional[float]],
    precip: List[Optional[float]],
) -> Dict[str, Any]:
    """
    Cleans daily weather data by:
    1. Detecting and filling gaps in the date sequence (full daily continuity).
    2. Filtering / interpolating physical temperature outliers (< -90°C or > 60°C).
    3. Clamping negative precipitation to 0.0 and capping unphysical spikes.
    4. Computing and logging data quality metrics.

    Args:
        dates: List of ISO date strings ('YYYY-MM-DD').
        tmax: Daily maximum temperatures (°C).
        precip: Daily precipitation sums (mm).

    Returns:
        Dict with keys:
            - 'dates': List[str] (guaranteed continuous chronological sequence)
            - 'tmax': List[float]
            - 'precip': List[float]
            - 'metrics': Dict[str, Any] quality summary
    """
    if not dates:
        return {
            "dates": [],
            "tmax": [],
            "precip": [],
            "metrics": {
                "total_days": 0,
                "missing_days_filled": 0,
                "temp_outliers_fixed": 0,
                "precip_outliers_fixed": 0,
                "completeness_pct": 100.0,
            },
        }

    # 1. Map existing records by parsed date
    records: Dict[str, Tuple[Optional[float], Optional[float]]] = {}
    temp_outliers_fixed = 0
    precip_outliers_fixed = 0

    for d_str, t, p in zip(dates, tmax, precip):
        cleaned_t = t
        cleaned_p = p

        # Temperature outlier check
        if cleaned_t is not None and not np.isnan(cleaned_t):
            if cleaned_t < TEMP_MIN_BOUND or cleaned_t > TEMP_MAX_BOUND:
                logger.warning("Unphysical temperature outlier at %s: %.1f°C - filtering.", d_str, cleaned_t)
                cleaned_t = None
                temp_outliers_fixed += 1

        # Precipitation outlier check
        if cleaned_p is not None and not np.isnan(cleaned_p):
            if cleaned_p < PRECIP_MIN_BOUND:
                cleaned_p = 0.0
                precip_outliers_fixed += 1
            elif cleaned_p > PRECIP_MAX_BOUND:
                logger.warning("Unphysical precipitation spike at %s: %.1f mm - clamping.", d_str, cleaned_p)
                cleaned_p = PRECIP_MAX_BOUND
                precip_outliers_fixed += 1

        records[d_str] = (cleaned_t, cleaned_p)

    # 2. Reconstruct complete day-by-day continuous timeline
    start_dt = datetime.strptime(dates[0], "%Y-%m-%d").date()
    end_dt = datetime.strptime(dates[-1], "%Y-%m-%d").date()

    continuous_dates: List[str] = []
    continuous_tmax: List[Optional[float]] = []
    continuous_precip: List[float] = []
    missing_days_filled = 0

    curr_dt = start_dt
    one_day = timedelta(days=1)

    while curr_dt <= end_dt:
        d_str = curr_dt.isoformat()
        continuous_dates.append(d_str)

        if d_str in records:
            t_val, p_val = records[d_str]
            continuous_tmax.append(t_val)
            continuous_precip.append(p_val if p_val is not None else 0.0)
        else:
            missing_days_filled += 1
            continuous_tmax.append(None)
            continuous_precip.append(0.0)  # Missing precip assumed dry to avoid inventing hazards

        curr_dt += one_day

    # 3. Linear interpolation for missing / filtered temperatures
    n = len(continuous_tmax)
    filled_tmax: List[float] = [0.0] * n

    # Find first valid temperature as initial anchor
    first_valid = next((t for t in continuous_tmax if t is not None), 20.0)

    last_val = first_valid
    for i in range(n):
        if continuous_tmax[i] is not None:
            last_val = continuous_tmax[i]
            filled_tmax[i] = round(float(last_val), 2)
        else:
            # Look ahead for next valid value to interpolate
            next_valid = None
            next_idx = i + 1
            while next_idx < n:
                if continuous_tmax[next_idx] is not None:
                    next_valid = continuous_tmax[next_idx]
                    break
                next_idx += 1

            if next_valid is not None:
                # Linear interpolation
                weight = 1.0 / (next_idx - i + 1)
                interpolated = last_val + (next_valid - last_val) * weight
                filled_tmax[i] = round(float(interpolated), 2)
            else:
                filled_tmax[i] = round(float(last_val), 2)

    total_days = len(continuous_dates)
    valid_original_count = total_days - missing_days_filled - temp_outliers_fixed
    completeness_pct = round((valid_original_count / max(1, total_days)) * 100.0, 2)

    metrics = {
        "total_days": total_days,
        "missing_days_filled": missing_days_filled,
        "temp_outliers_fixed": temp_outliers_fixed,
        "precip_outliers_fixed": precip_outliers_fixed,
        "completeness_pct": completeness_pct,
    }

    logger.info(
        "Data Quality: %d days processed, %d missing filled, %d temp outliers, %d precip outliers (%.1f%% complete)",
        total_days,
        missing_days_filled,
        temp_outliers_fixed,
        precip_outliers_fixed,
        completeness_pct,
    )

    return {
        "dates": continuous_dates,
        "tmax": filled_tmax,
        "precip": continuous_precip,
        "metrics": metrics,
    }
