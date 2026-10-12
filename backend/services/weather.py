import bisect
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional, Union

from fastapi import HTTPException
import httpx

from database import weather_cache_collection

logger = logging.getLogger(__name__)

ARCHIVE_API_BASE_URL = "https://archive-api.open-meteo.com/v1/archive"


def _format_date(val: Union[int, str], is_end: bool = False) -> str:
    """Format year integer or date string into YYYY-MM-DD."""
    s = str(val).strip()
    if len(s) == 4 and s.isdigit():
        return f"{s}-12-31" if is_end else f"{s}-01-01"
    return s


def _get_from_cache(
    lat: float,
    lon: float,
    req_start_date: str,
    req_end_date: str,
) -> Optional[Dict[str, Any]]:
    """
    Search MongoDB for a cached document whose date range encloses [req_start_date, req_end_date].
    If found, returns the sliced daily weather dataset.
    """
    try:
        query = {
            "lat": lat,
            "lon": lon,
            "start_date": {"$lte": req_start_date},
            "end_date": {"$gte": req_end_date},
        }
        doc = weather_cache_collection.find_one(query)
        if not doc or "daily" not in doc:
            return None

        daily = doc["daily"]
        times = daily.get("time", [])
        if not times:
            return None

        # Slice matching dates using bisect
        start_idx = bisect.bisect_left(times, req_start_date)
        end_idx = bisect.bisect_right(times, req_end_date)

        if start_idx >= len(times) or end_idx <= start_idx:
            return None

        sliced_daily = {
            "time": times[start_idx:end_idx],
            "temperature_2m_max": daily.get("temperature_2m_max", [])[start_idx:end_idx],
            "precipitation_sum": daily.get("precipitation_sum", [])[start_idx:end_idx],
        }

        return {
            "latitude": doc.get("latitude", lat),
            "longitude": doc.get("longitude", lon),
            "timezone": doc.get("timezone", "auto"),
            "daily": sliced_daily,
            "cached": True,
        }
    except Exception as e:
        logger.warning("Error reading from MongoDB weather cache: %s", e)
        return None


def _save_to_cache(
    lat: float,
    lon: float,
    start_date: str,
    end_date: str,
    data: Dict[str, Any],
) -> None:
    """
    Upsert raw weather data into MongoDB weather cache.
    """
    try:
        cache_doc = {
            "lat": lat,
            "lon": lon,
            "latitude": data.get("latitude", lat),
            "longitude": data.get("longitude", lon),
            "timezone": data.get("timezone", "auto"),
            "start_date": start_date,
            "end_date": end_date,
            "daily": data.get("daily", {}),
            "updated_at": datetime.now(timezone.utc),
        }
        weather_cache_collection.update_one(
            {
                "lat": lat,
                "lon": lon,
                "start_date": start_date,
                "end_date": end_date,
            },
            {"$set": cache_doc},
            upsert=True,
        )
    except Exception as e:
        logger.warning("Error writing to MongoDB weather cache: %s", e)


async def get_weather_data(
    lat: float,
    lon: float,
    start_year: Union[int, str],
    end_year: Union[int, str],
) -> Dict[str, Any]:
    """
    Fetch historical daily weather data from MongoDB cache or Open-Meteo Archive API.

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

    rounded_lat = round(lat, 2)
    rounded_lon = round(lon, 2)

    # 1. Check cache first (superset match + slicing)
    cached_data = _get_from_cache(rounded_lat, rounded_lon, start_date, end_date)
    if cached_data is not None:
        return cached_data

    # 2. Fetch fresh data from Open-Meteo Archive API on cache miss
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
            data = response.json()
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

    # 3. Cache the newly fetched data in MongoDB
    _save_to_cache(rounded_lat, rounded_lon, start_date, end_date, data)
    data["cached"] = False

    return data