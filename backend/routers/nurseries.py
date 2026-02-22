"""
Router: Nursery Locator.
GET /nurseries/nearby — Find nurseries within radius, optionally filtered by crop.
"""

import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query
from models.schemas import NurseryResponse, NurseryItem
from services.geo import haversine_distance

router = APIRouter(prefix="/nurseries", tags=["Nurseries"])

# Load nursery data once
_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "nurseries.json"
with open(_DATA_PATH, "r") as f:
    _NURSERIES_DATA = json.load(f)["nurseries"]


@router.get("/nearby", response_model=NurseryResponse)
async def nearby_nurseries(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(50, description="Search radius in km"),
    crop: Optional[str] = Query(None, description="Filter by crop availability")
):
    """
    Return nurseries within the given radius of the user's location.
    Optionally filter by crop availability.
    """
    results = []
    for n in _NURSERIES_DATA:
        dist = haversine_distance(lat, lng, n["lat"], n["lng"])
        if dist > radius_km:
            continue

        # If crop filter is specified, check inventory
        if crop and crop.lower() not in {k.lower() for k in n["inventory"]}:
            continue

        # Sum available plants (all crops or specific crop)
        if crop:
            available = n["inventory"].get(crop.lower(), 0)
        else:
            available = sum(n["inventory"].values())

        results.append(NurseryItem(
            id=n["id"],
            name=n["name"],
            lat=n["lat"],
            lng=n["lng"],
            distance_km=round(dist, 2),
            available_plants=available,
            contact=n["contact"]
        ))

    # Sort by distance
    results.sort(key=lambda x: x.distance_km)
    return NurseryResponse(nurseries=results)
