"""
Router: Weather (cached, with mock fallback).
GET /weather — Return weather for given lat/lng.

Requires OPENWEATHER_API_KEY env var for real data.
Falls back to realistic mock data if key is not set — perfect for demos.
"""

import os
import random
from fastapi import APIRouter, Query
from models.schemas import WeatherResponse
from services.cache import weather_cache

router = APIRouter(tags=["Weather"])

# Optional: set OPENWEATHER_API_KEY in your environment for live data
_API_KEY = os.environ.get("OPENWEATHER_API_KEY")


async def _fetch_live_weather(lat: float, lng: float) -> dict:
    """Call OpenWeatherMap API for current weather."""
    import httpx
    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lng}&appid={_API_KEY}&units=metric"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

    return {
        "temperature_c": round(data["main"]["temp"], 1),
        "humidity": data["main"]["humidity"],
        "rain_probability": round(data.get("clouds", {}).get("all", 0) / 100, 2),
        "condition": data["weather"][0]["main"]
    }


def _mock_weather() -> dict:
    """Generate realistic mock weather data for demo purposes."""
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear"]
    return {
        "temperature_c": round(random.uniform(24, 36), 1),
        "humidity": random.randint(40, 85),
        "rain_probability": round(random.uniform(0, 0.6), 2),
        "condition": random.choice(conditions)
    }


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude")
):
    """
    Return current weather for the given location.
    Results are cached for 10 minutes to avoid API rate limits.
    Falls back to mock data if OPENWEATHER_API_KEY is not set.
    """
    cache_key = f"{round(lat, 2)},{round(lng, 2)}"

    # Check cache first
    cached = weather_cache.get(cache_key)
    if cached:
        return WeatherResponse(**cached)

    # Fetch weather (live or mock)
    if _API_KEY:
        try:
            data = await _fetch_live_weather(lat, lng)
        except Exception:
            # Fallback to mock if API call fails
            data = _mock_weather()
    else:
        data = _mock_weather()

    # Cache for 10 minutes (600 seconds)
    weather_cache.set(cache_key, data, ttl_seconds=600)

    return WeatherResponse(**data)
