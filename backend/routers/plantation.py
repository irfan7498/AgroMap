"""
Router: Plantation estimation & layout.
POST /plantation/estimate — Calculate plant count from area + spacing.
POST /plantation/layout  — Generate planting grid inside polygon.
"""

import math
from fastapi import APIRouter
from models.schemas import (
    EstimateRequest, EstimateResponse,
    LayoutRequest, LayoutResponse, LayoutPoint
)
from services.layout import generate_layout

router = APIRouter(prefix="/plantation", tags=["Plantation"])


@router.post("/estimate", response_model=EstimateResponse)
async def estimate_plants(req: EstimateRequest):
    """
    Estimate how many plants fit in the given area at the given spacing.

    Formula:
        Convert sqft → sqm first (1 sqft = 0.0929 sqm)
        recommended = floor(area_sqm / (row_spacing * col_spacing))
        max = recommended * 1.10   (allow 10% denser packing)
        min = recommended * 0.90   (allow 10% sparser)
    """
    area_sqm = req.area_sqft * 0.092903  # convert sqft to sqm for calculation
    cell_area = req.spacing_row_m * req.spacing_col_m
    recommended = math.floor(area_sqm / cell_area)
    return EstimateResponse(
        min_plants=math.floor(recommended * 0.90),
        max_plants=math.ceil(recommended * 1.10),
        recommended=recommended
    )


@router.post("/layout", response_model=LayoutResponse)
async def plantation_layout(req: LayoutRequest):
    """
    Generate a grid of planting positions inside the polygon.
    Each point is a lat/lng where a plant should be placed.
    """
    result = generate_layout(req.polygon, req.spacing_m)
    points = [LayoutPoint(**p) for p in result["points"]]
    return LayoutResponse(count=result["count"], points=points)
