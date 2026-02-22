"""
Pydantic models for all API request/response schemas.
Organized by feature for readability.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


# ─── Land / Area ──────────────────────────────────────────────

class AreaRequest(BaseModel):
    """Polygon coordinates as list of [lat, lng] pairs."""
    coordinates: List[List[float]] = Field(
        ..., min_length=3,
        description="Polygon vertices as [[lat, lng], ...]. Minimum 3 points."
    )


class AreaValues(BaseModel):
    sqft: float
    hectares: float
    acres: float


class AreaResponse(BaseModel):
    area: AreaValues


# ─── Crops ────────────────────────────────────────────────────

class SpacingInfo(BaseModel):
    min: float
    max: float
    recommended: float


class CropItem(BaseModel):
    id: str
    name: str
    spacing: SpacingInfo
    water_lpd: float  # liters per day per plant


class CropsResponse(BaseModel):
    crops: List[CropItem]


# ─── Plantation Estimation ────────────────────────────────────

class EstimateRequest(BaseModel):
    area_sqft: float = Field(..., gt=0)
    spacing_row_m: float = Field(..., gt=0)
    spacing_col_m: float = Field(..., gt=0)


class EstimateResponse(BaseModel):
    min_plants: int
    max_plants: int
    recommended: int


# ─── Plantation Layout ────────────────────────────────────────

class LayoutRequest(BaseModel):
    polygon: List[List[float]] = Field(..., min_length=3)
    spacing_m: float = Field(..., gt=0)


class LayoutPoint(BaseModel):
    lat: float
    lng: float


class LayoutResponse(BaseModel):
    count: int
    points: List[LayoutPoint]


# ─── Nurseries ────────────────────────────────────────────────

class NurseryItem(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    distance_km: float
    available_plants: int
    contact: str


class NurseryResponse(BaseModel):
    nurseries: List[NurseryItem]


# ─── Bookings ─────────────────────────────────────────────────

class BookingRequest(BaseModel):
    nursery_id: str
    crop: str
    quantity: int = Field(..., gt=0)


class BookingResponse(BaseModel):
    booking_id: str
    status: str


class BookingDetail(BaseModel):
    booking_id: str
    nursery_id: str
    crop: str
    quantity: int
    status: str


# ─── Weather ──────────────────────────────────────────────────

class WeatherResponse(BaseModel):
    temperature_c: float
    humidity: float
    rain_probability: float
    condition: str


# ─── Water ────────────────────────────────────────────────────

class WaterRequest(BaseModel):
    crop: str
    plants: int = Field(..., gt=0)


class WaterResponse(BaseModel):
    water_per_day_l: float
    water_per_month_l: float


# ─── Health ───────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
