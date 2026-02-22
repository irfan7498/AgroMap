"""
Router: Land & Area calculation.
POST /land/area — Compute geodesic polygon area.
"""

from fastapi import APIRouter
from models.schemas import AreaRequest, AreaResponse, AreaValues
from services.geo import calculate_geodesic_area

router = APIRouter(prefix="/land", tags=["Land"])


@router.post("/area", response_model=AreaResponse)
async def compute_area(req: AreaRequest):
    """
    Accept polygon coordinates and return the geodesic area
    in square meters, hectares, and acres.
    """
    sqm = calculate_geodesic_area(req.coordinates)
    sqft = sqm * 10.7639  # 1 sqm = 10.7639 sqft
    return AreaResponse(
        area=AreaValues(
            sqft=round(sqft, 2),
            hectares=round(sqm / 10000, 3),
            acres=round(sqm / 4046.86, 2)
        )
    )
