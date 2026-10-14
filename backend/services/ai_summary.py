import json
import logging
from typing import Any, Dict, List, Optional
import httpx

from config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior climatologist and municipal risk intelligence analyst writing an executive climate risk briefing for HazardWatch.
Your task is to analyze multi-decadal historical climate hazard observations and provide an authoritative, highly actionable risk briefing for municipal leaders, civil defense, urban planners, and engineers.

Return a valid JSON object matching this schema:
{
  "risk_level": "Critical" | "High" | "Elevated" | "Moderate",
  "summary": "A deep, authoritative 2-3 sentence executive synopsis explaining the structural climate regime shift, frequency acceleration, and what this trajectory portends for the region.",
  "impacts": [
    "3 to 4 specific, tangible sectoral vulnerability assessments covering: (1) Public health & heat exhaustion / flash flood inundation, (2) Critical infrastructure & energy cooling load / stormwater conveyance, (3) Water security / transport disruption."
  ],
  "recommendations": [
    "3 to 4 concrete, actionable resilience and adaptation interventions (e.g., cool roof mandates, early warning trigger thresholds, permeable pavements, detention basins, load-shedding contingency protocols)."
  ]
}
Output ONLY valid JSON."""


def _generate_deterministic_briefing(
    hazard_type: str,
    start_year: int,
    end_year: int,
    total_events: int,
    city_name: Optional[str] = None,
    insights: Optional[List[str]] = None,
    stats: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Produces an authoritative, highly detailed deterministic climate risk brief
    when cloud AI services are unconfigured, rate-limited, or unavailable.
    """
    location_str = f" for {city_name}" if city_name else ""
    is_heatwave = "heat" in hazard_type.lower()
    hazard_label = "Heatwave" if is_heatwave else "Heavy Rainfall"

    # Evaluate risk tier based on event frequency and trend direction
    insights_str = " ".join(insights or []).lower()
    has_acceleration = "increased" in insights_str or "elevated activity" in insights_str
    has_extreme_severity = "peaked" in insights_str or "45." in insights_str or "100." in insights_str

    if total_events >= 20 or (has_acceleration and has_extreme_severity):
        risk_level = "Critical"
    elif total_events >= 10 or has_acceleration:
        risk_level = "High"
    elif total_events >= 4:
        risk_level = "Elevated"
    else:
        risk_level = "Moderate"

    if total_events == 0:
        summary = (
            f"Over the {start_year}–{end_year} observation window{location_str}, no extreme {hazard_label.lower()} "
            f"events satisfied the rigorous WMO R95p / P95 climatological threshold criteria, indicating baseline atmospheric stability."
        )
        impacts = [
            f"Climatological Baseline: No anomalous {hazard_label.lower()} runs recorded during this observation window.",
            "Municipal Monitoring: Routine climate hazard surveillance remains sufficient under current baseline conditions.",
        ]
        recommendations = [
            "Maintain continuous historical station tracking to detect early-stage climate regime departures.",
            "Incorporate forward-looking regional climate projections (CMIP6) into 2030 municipal master planning.",
        ]
        return {
            "summary": summary,
            "risk_level": "Moderate",
            "impacts": impacts,
            "recommendations": recommendations,
            "source": "Deterministic Climate Intelligence Engine",
            "is_ai_generated": False,
        }

    # Synthesize multi-decadal synopsis
    lead_insight = insights[0] if insights and len(insights) > 0 else f"{total_events} events recorded."
    trend_insight = insights[1] if insights and len(insights) > 1 else ""
    summary = (
        f"Multi-decadal meteorological analysis{location_str} over {start_year}–{end_year} reveals an acute "
        f"{risk_level.lower()}-tier trajectory with {total_events} distinct {hazard_label.lower()} occurrences. "
        f"{lead_insight} {trend_insight} This systematic escalation signifies a fundamental transition in the local "
        f"extreme weather regime rather than isolated cyclical variation."
    )

    if is_heatwave:
        impacts = [
            "Public Health & Mortality: Prolonged elevated thermal runs heighten acute heat-exhaustion risk, cardiovascular morbidity, and nocturnal cooling deficit across dense urban wards.",
            "Energy Grid Resilience: Concurrently spiking refrigeration and air conditioning demands induce severe transformer overheating and localized distribution brownout hazards.",
            "Water & Ecological Stress: Accelerated evaporative deficit compounds municipal reservoir drawdowns and deepens urban soil moisture depletion.",
        ]
        recommendations = [
            "Institutionalize heat-health early warning triggers calibrated directly to localized wet-bulb temperature thresholds.",
            "Mandate high-albedo cool roofing standards and vegetative shading corridors along major arterial pedestrian pathways.",
            "Establish decentralized municipal cooling shelters equipped with independent auxiliary power across vulnerable neighborhoods.",
            "Implement peak-hour electrical demand management protocols for high-consumption industrial and commercial facilities.",
        ]
    else:
        impacts = [
            "Urban Inundation & Flash Flooding: Short-duration torrential downpours rapidly overwhelm legacy storm sewer capacity, submerging arterial roads and subterranean transit assets.",
            "Structural & Soil Degradation: Sustained soil moisture saturation induces foundation shifting, embankment scour, and severe road surface washouts.",
            "Sanitation & Water Contamination: Stormwater runoff surcharge risks sewer line overflow, compromising clean water distribution networks and amplifying post-flood vector risks.",
        ]
        recommendations = [
            "Retrofit critical conveyance corridors with Sustainable Urban Drainage Systems (SuDS) and distributed retention basins.",
            "Mandate permeable pavement ratios for new commercial parking facilities and municipal open plazas.",
            "Deploy IoT telemetry stage sensors at known hydrologic choke points for automated real-time flood warning broadcasts.",
            "Establish flood-proofing standards and backflow prevention mandates for municipal electrical substations and basements.",
        ]

    return {
        "summary": summary,
        "risk_level": risk_level,
        "impacts": impacts,
        "recommendations": recommendations,
        "source": "Deterministic Climate Intelligence Engine",
        "is_ai_generated": False,
    }


async def _call_groq(prompt: str, api_key: str) -> Optional[Dict[str, Any]]:
    """
    Queries Groq Cloud's ultra-fast LPU inference engine.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
    }
    models_to_try = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
        "qwen/qwen3.8-27b",
    ]

    for model in models_to_try:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.25,
                "max_tokens": 1024,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    raw_content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(raw_content)
                    return {
                        "summary": parsed.get("summary", "").strip(),
                        "risk_level": parsed.get("risk_level", "Elevated Risk"),
                        "impacts": parsed.get("impacts", []),
                        "recommendations": parsed.get("recommendations", []),
                        "source": f"Groq Cloud ({model})",
                        "is_ai_generated": True,
                    }
                else:
                    logger.warning("Groq model %s returned status %s", model, res.status_code)
        except Exception as e:
            logger.warning("Groq call for model %s failed: %s", model, e)

    return None


async def generate_ai_summary(
    hazard_type: str,
    start_year: int,
    end_year: int,
    total_events: int,
    city_name: Optional[str] = None,
    insights: Optional[List[str]] = None,
    stats: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generates a structured executive climate risk briefing:
    1. Groq Cloud (Llama 3.3 70B Versatile) if GROQ_API_KEY is configured
    2. Deterministic Climate Intelligence Engine (Rule-based domain fallback)
    """
    location_name = city_name or "the selected location"
    hazard_label = "Heatwave" if "heat" in hazard_type.lower() else "Heavy Rainfall"
    insights_bullets = "\n".join(f"- {i}" for i in (insights or []))

    user_prompt = (
        f"Location: {location_name}\n"
        f"Observation Window: {start_year} to {end_year} ({end_year - start_year + 1} Years)\n"
        f"Hazard Category: {hazard_label}\n"
        f"Total Recorded Extreme Events: {total_events}\n"
        f"Empirical Time Series Insights:\n{insights_bullets}\n"
    )

    # Primary: Try Groq Cloud (Llama 3.3 70B) if key is set
    if getattr(settings, "GROQ_API_KEY", None) and settings.GROQ_API_KEY.strip():
        try:
            logger.info("Attempting AI synthesis via Groq Cloud (Llama 3.3 70B)...")
            result = await _call_groq(user_prompt, settings.GROQ_API_KEY)
            if result and result.get("summary"):
                return result
        except Exception as e:
            logger.warning("Groq Cloud synthesis encountered an error: %s", e)

    # Fallback: Deterministic Climate Intelligence Engine
    logger.info("Engaging Deterministic Climate Intelligence Engine fallback.")
    return _generate_deterministic_briefing(
        hazard_type=hazard_type,
        start_year=start_year,
        end_year=end_year,
        total_events=total_events,
        city_name=city_name,
        insights=insights,
        stats=stats,
    )
