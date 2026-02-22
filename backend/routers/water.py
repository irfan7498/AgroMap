"""
Router: Water Requirement Calculator.
POST /water/calculate — Daily & monthly water needs for a crop + plant count.
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from models.schemas import WaterRequest, WaterResponse

router = APIRouter(prefix="/water", tags=["Water"])

# Load crop data for water_lpd lookup
_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "crops.json"
with open(_DATA_PATH, "r") as f:
    _CROPS = {c["id"]: c for c in json.load(f)["crops"]}


@router.post("/calculate", response_model=WaterResponse)
async def calculate_water(req: WaterRequest):
    """
    Calculate daily and monthly water requirements.

    Formula:
        daily  = water_lpd (liters per plant per day) × number of plants
        monthly = daily × 30
    """
    crop_id = req.crop.lower()
    if crop_id not in _CROPS:
        raise HTTPException(
            status_code=404,
            detail=f"Crop '{req.crop}' not found. Available: {list(_CROPS.keys())}"
        )

    water_lpd = _CROPS[crop_id]["water_lpd"]
    daily = water_lpd * req.plants
    monthly = daily * 30

    return WaterResponse(
        water_per_day_l=round(daily, 2),
        water_per_month_l=round(monthly, 2)
    )
