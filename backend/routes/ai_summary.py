from fastapi import APIRouter
from models.schemas import AISummaryRequest, AISummaryResponse
from services import ai_summary

router = APIRouter(tags=["AI Summary"])


@router.post("/ai-summary", response_model=AISummaryResponse)
async def get_ai_summary(payload: AISummaryRequest):
    """
    Generate an AI-powered natural language summary of hazard analysis results.
    Includes automatic programmatic fallback if Gemini API is unavailable or unconfigured.
    """
    result = await ai_summary.generate_ai_summary(
        hazard_type=payload.hazard_type,
        start_year=payload.start_year,
        end_year=payload.end_year,
        total_events=payload.total_events,
        city_name=payload.city_name,
        insights=payload.insights,
        stats=payload.stats,
    )
    return AISummaryResponse(**result)
