"""
Router: Plant Booking (in-memory).
POST /bookings           — Create a new booking.
GET  /bookings/{id}      — Retrieve booking details.
"""

import uuid
from fastapi import APIRouter, HTTPException
from models.schemas import BookingRequest, BookingResponse, BookingDetail

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# In-memory booking store (dict keyed by booking_id)
_bookings = {}


@router.post("", response_model=BookingResponse)
async def create_booking(req: BookingRequest):
    """
    Create a new plant booking.
    Generates a short unique ID and stores in memory.
    """
    booking_id = "BK" + uuid.uuid4().hex[:6].upper()
    _bookings[booking_id] = {
        "booking_id": booking_id,
        "nursery_id": req.nursery_id,
        "crop": req.crop,
        "quantity": req.quantity,
        "status": "CONFIRMED"
    }
    return BookingResponse(booking_id=booking_id, status="CONFIRMED")


@router.get("/{booking_id}", response_model=BookingDetail)
async def get_booking(booking_id: str):
    """Retrieve a booking by its ID."""
    if booking_id not in _bookings:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found")
    return BookingDetail(**_bookings[booking_id])
