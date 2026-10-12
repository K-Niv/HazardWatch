import logging
from typing import Any, Dict, List, Optional
import httpx

from config import settings

logger = logging.getLogger(__name__)

GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = "gemini-flash-lite-latest"


def _generate_fallback_summary(
    hazard_type: str,
    start_year: int,
    end_year: int,
    total_events: int,
    city_name: Optional[str] = None,
    insights: Optional[List[str]] = None,
) -> str:
    """
    Produce a deterministic, programmatic summary when the AI service is unavailable.
    """
    location_str = f" for {city_name}" if city_name else ""
    hazard_label = "heatwave" if "heat" in hazard_type.lower() else "heavy rainfall"

    if total_events == 0:
        return (
            f"Over the {start_year}–{end_year} period{location_str}, no extreme {hazard_label} "
            f"events were identified that met the threshold criteria."
        )

    sentences = [
        f"Between {start_year} and {end_year}{location_str}, a total of {total_events} {hazard_label} "
        f"hazard events were recorded."
    ]

    if insights:
        # Include top insights
        for insight in insights[:2]:
            sentences.append(insight)

    return " ".join(sentences)


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
    Generate an executive summary using Google Gemini API with graceful programmatic fallback.

    Returns:
        Dict with keys:
            - 'summary': str
            - 'source': str
            - 'is_ai_generated': bool
    """
    # 1. Fallback if API key is not configured
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY is not configured; using fallback summary.")
        fallback = _generate_fallback_summary(
            hazard_type, start_year, end_year, total_events, city_name, insights
        )
        return {
            "summary": fallback,
            "source": "Programmatic Fallback (GEMINI_API_KEY missing)",
            "is_ai_generated": False,
        }

    # 2. Build structured prompt
    location_name = city_name or "the selected coordinate"
    hazard_label = "Heatwave" if "heat" in hazard_type.lower() else "Heavy Rainfall"
    insights_bullets = "\n".join(f"- {i}" for i in (insights or []))

    prompt = (
        f"You are a climate hazard analyst writing an executive summary for the HazardWatch application.\n"
        f"Provide a clear, objective 2-3 sentence summary of the following hazard analysis.\n\n"
        f"Location: {location_name}\n"
        f"Period: {start_year} to {end_year}\n"
        f"Hazard Type: {hazard_label}\n"
        f"Total Events Detected: {total_events}\n"
        f"Key Programmatic Insights:\n{insights_bullets}\n\n"
        f"Instructions:\n"
        f"- Focus strictly on the data and climate trends provided.\n"
        f"- Highlight changes in frequency, severity, or peak years.\n"
        f"- Do NOT use markdown headings or bullet points; return only 1 concise paragraph of 2-3 sentences."
    )

    url = f"{GEMINI_API_BASE_URL}/{DEFAULT_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"

    # 3. Call Gemini REST API
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])

            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts and "text" in parts[0]:
                    summary_text = parts[0]["text"].strip()
                    return {
                        "summary": summary_text,
                        "source": f"Google Gemini ({DEFAULT_MODEL})",
                        "is_ai_generated": True,
                    }

    except Exception as e:
        logger.warning("Gemini API call failed (%s); returning programmatic fallback.", e)

    # 4. Graceful fallback on API error or timeout
    fallback = _generate_fallback_summary(
        hazard_type, start_year, end_year, total_events, city_name, insights
    )
    return {
        "summary": fallback,
        "source": "Programmatic Fallback (Gemini API unavailable)",
        "is_ai_generated": False,
    }
