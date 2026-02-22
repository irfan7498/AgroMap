"""
Router: Crop Metadata.
GET /crops — Return static crop data from JSON.
"""

import json
from pathlib import Path
from fastapi import APIRouter
from models.schemas import CropsResponse

router = APIRouter(tags=["Crops"])

# Load crop data once at module import
_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "crops.json"
with open(_DATA_PATH, "r") as f:
    _CROPS_DATA = json.load(f)


@router.get("/crops", response_model=CropsResponse)
async def get_crops():
    """Return all available crops with spacing and water info."""
    return _CROPS_DATA
