from typing import Any, Dict, Union
from fastapi import HTTPException
import httpx

ARCHIVE_API_BASE_URL = "https://archive-api.open-meteo.com/v1/archive"


def _format_date(val: Union[int, str], is_end: bool = False) -> str:
    """Format year integer or date string into YYYY-MM-DD."""
    s = str(val).strip()
    if len(s) == 4 and s.isdigit():
        return f"{s}-12-31" if is_end else f"{s}-01-01"
    return s


async def get_weather_data(
    lat: float,
    lon: float,
    start_year: Union[int, str],
    end_year: Union[int, str],
) -> Dict[str, Any]:
    """
    Fetch historical daily weather data from Open-Meteo Historical Archive API.

    Args:
        lat: Latitude of location
        lon: Longitude of location
        start_year: Start year (e.g. 1990) or date string (YYYY-MM-DD)
        end_year: End year (e.g. 2020) or date string (YYYY-MM-DD)

    Returns:
        Dict containing daily weather arrays (time, temperature_2m_max, precipitation_sum)
    """
    start_date = _format_date(start_year, is_end=False)
    end_date = _format_date(end_year, is_end=True)

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": ["temperature_2m_max", "precipitation_sum"],
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(ARCHIVE_API_BASE_URL, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            detail = (
                e.response.json().get("reason", e.response.text)
                if "application/json" in e.response.headers.get("content-type", "")
                else e.response.text
            )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Open-Meteo Historical API error: {detail}",
            )
        except httpx.RequestException as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error connecting to Open-Meteo API: {str(e)}",
            )