from typing import Any, Dict, List, Optional, Union

from models.hazard_events import HeatwaveEvent, RainfallEvent

EventItem = Union[HeatwaveEvent, RainfallEvent, Dict[str, Any]]


def _get_attr(event: EventItem, key: str, default: Any = None) -> Any:
    """Helper to access attribute whether event is a Pydantic model or dict."""
    if isinstance(event, dict):
        return event.get(key, default)
    return getattr(event, key, default)


def calculate_yearly_counts(
    events: List[EventItem],
    start_year: int,
    end_year: int,
) -> Dict[str, int]:
    """
    Count the number of hazard events per year across [start_year, end_year].
    Every year in the range is initialized to 0.
    """
    yearly_counts: Dict[str, int] = {
        str(y): 0 for y in range(start_year, end_year + 1)
    }

    for event in events:
        start_date = _get_attr(event, "start_date")
        if start_date and len(start_date) >= 4:
            year_str = start_date[:4]
            if year_str in yearly_counts:
                yearly_counts[year_str] += 1

    return yearly_counts


def calculate_rolling_average(
    yearly_counts: Dict[str, int],
    window_size: int = 5,
) -> Dict[str, float]:
    """
    Compute a backward-looking rolling average over window_size years.
    If the total observation timeline has fewer years than window_size (e.g. < 5 years),
    returns an empty dict since a 5-year rolling window is undefined for shorter spans.
    """
    years = sorted(yearly_counts.keys(), key=int)
    if len(years) < window_size:
        return {}

    counts = [yearly_counts[y] for y in years]
    rolling_avg: Dict[str, float] = {}

    for i, year in enumerate(years):
        window = counts[max(0, i - window_size + 1) : i + 1]
        avg = sum(window) / len(window)
        rolling_avg[year] = round(avg, 2)

    return rolling_avg


def generate_insights(
    events: List[EventItem],
    yearly_counts: Dict[str, int],
    start_year: int,
    end_year: int,
    hazard_type: str = "heatwave",
) -> List[str]:
    """
    Generate data-driven programmatic insight strings from event history.
    """
    hazard_label = "heatwave" if "heat" in hazard_type.lower() else "heavy rainfall"
    insights: List[str] = []
    total_events = len(events)
    num_years = max(1, end_year - start_year + 1)
    annual_rate = total_events / num_years

    # 1. Total event frequency overview
    if total_events == 0:
        return [
            f"No {hazard_label} events meeting the criteria were detected between {start_year} and {end_year}."
        ]

    insights.append(
        f"A total of {total_events} {hazard_label} event{'s' if total_events != 1 else ''} "
        f"occurred between {start_year} and {end_year} (averaging {annual_rate:.2f} events/year)."
    )

    # 2. Peak activity year
    peak_year = max(yearly_counts, key=lambda y: yearly_counts[y])
    peak_count = yearly_counts[peak_year]
    if peak_count > 0:
        insights.append(
            f"Peak {hazard_label} activity was recorded in {peak_year} with {peak_count} event{'s' if peak_count != 1 else ''}."
        )

    # 3. Two-period comparison (First half vs Second half)
    if num_years >= 4:
        half_len = num_years // 2
        mid_year = start_year + half_len
        years_first_half = [str(y) for y in range(start_year, mid_year)]
        years_second_half = [str(y) for y in range(mid_year, end_year + 1)]

        count_first = sum(yearly_counts.get(y, 0) for y in years_first_half)
        count_second = sum(yearly_counts.get(y, 0) for y in years_second_half)

        rate_first = count_first / len(years_first_half)
        rate_second = count_second / len(years_second_half)

        first_period_label = f"{start_year}–{mid_year - 1}"
        second_period_label = f"{mid_year}–{end_year}"

        if rate_first > 0:
            pct_change = ((rate_second - rate_first) / rate_first) * 100
            if abs(pct_change) >= 5.0:
                direction = "increased" if pct_change > 0 else "decreased"
                insights.append(
                    f"{hazard_label.capitalize()} frequency {direction} by {abs(pct_change):.1f}% in the second half "
                    f"({second_period_label}) compared to the first half ({first_period_label})."
                )
            else:
                insights.append(
                    f"{hazard_label.capitalize()} frequency remained relatively stable between {first_period_label} and {second_period_label}."
                )
        elif count_second > 0:
            insights.append(
                f"Activity emerged in the latter half ({second_period_label}) with {count_second} events, after 0 events in {first_period_label}."
            )

    # 4. Severity & Intensity highlights
    max_duration = max(_get_attr(e, "duration", 1) for e in events)
    if "heat" in hazard_type.lower():
        peak_temp = max(_get_attr(e, "peak_temp", 0.0) for e in events)
        insights.append(
            f"The hottest event peaked at {peak_temp:.1f}°C, and the longest heatwave persisted for {max_duration} consecutive days."
        )
    else:
        max_daily_precip = max(_get_attr(e, "peak_daily_mm", 0.0) for e in events)
        max_total_precip = max(_get_attr(e, "total_mm", 0.0) for e in events)
        insights.append(
            f"The single most intense downpour reached {max_daily_precip:.1f} mm/day, with the highest single-event total of {max_total_precip:.1f} mm over {max_duration} day{'s' if max_duration != 1 else ''}."
        )

    # 5. Recent 5-year trend vs historical baseline
    if num_years >= 8:
        recent_years = [str(y) for y in range(end_year - 4, end_year + 1)]
        recent_count = sum(yearly_counts.get(y, 0) for y in recent_years)
        recent_rate = recent_count / 5.0

        if annual_rate > 0:
            ratio = recent_rate / annual_rate
            if ratio >= 1.25:
                insights.append(
                    f"The most recent 5-year period ({end_year - 4}–{end_year}) saw elevated activity ({recent_rate:.2f} events/year), "
                    f"{ratio:.1f}x higher than the long-term baseline."
                )
            elif ratio <= 0.75:
                insights.append(
                    f"The most recent 5-year period ({end_year - 4}–{end_year}) saw lower activity ({recent_rate:.2f} events/year) "
                    f"compared to the long-term baseline ({annual_rate:.2f} events/year)."
                )

    return insights


def analyze_trends(
    events: List[EventItem],
    start_year: int,
    end_year: int,
    hazard_type: str = "heatwave",
) -> Dict[str, Any]:
    """
    Perform trend analysis on hazard events:
    - Counts per year
    - 5-year rolling average
    - Programmatic insight strings

    Returns:
        Dict with keys: 'yearly_counts', 'rolling_avg', 'insights'
    """
    yearly_counts = calculate_yearly_counts(events, start_year, end_year)
    rolling_avg = calculate_rolling_average(yearly_counts, window_size=5)
    insights = generate_insights(events, yearly_counts, start_year, end_year, hazard_type)

    return {
        "yearly_counts": yearly_counts,
        "rolling_avg": rolling_avg,
        "insights": insights,
    }
