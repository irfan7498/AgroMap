"""
Plantation layout generator.
Creates a regular grid of planting points that fall inside a given polygon.
Uses Shapely for robust point-in-polygon testing.
"""

import math
from typing import List, Dict
from shapely.geometry import Polygon, Point


def _offset_lat(lat: float, meters: float) -> float:
    """Offset latitude by a given number of meters."""
    # 1 degree latitude ≈ 111,320 meters
    return lat + (meters / 111320.0)


def _offset_lng(lat: float, lng: float, meters: float) -> float:
    """Offset longitude by a given number of meters at a given latitude."""
    # 1 degree longitude ≈ 111,320 * cos(lat) meters
    return lng + (meters / (111320.0 * math.cos(math.radians(lat))))


def generate_layout(polygon_coords: List[List[float]], spacing_m: float) -> Dict:
    """
    Generate a regular grid of planting points inside the polygon.

    Args:
        polygon_coords: List of [lat, lng] pairs defining the land boundary.
        spacing_m: Distance between plants in meters (used for both row and column).

    Returns:
        Dict with 'count' and 'points' (list of {lat, lng}).

    Algorithm:
        1. Compute bounding box of the polygon.
        2. Generate a grid of candidate points with the specified spacing.
        3. Keep only points that fall inside the polygon (Shapely).
    """
    # Shapely uses (x, y) = (lng, lat)
    shapely_coords = [(coord[1], coord[0]) for coord in polygon_coords]
    poly = Polygon(shapely_coords)

    if not poly.is_valid:
        # Try to fix self-intersecting polygons
        poly = poly.buffer(0)

    # Bounding box: (min_lng, min_lat, max_lng, max_lat)
    min_lng, min_lat, max_lng, max_lat = poly.bounds

    points = []
    current_lat = min_lat

    while current_lat <= max_lat:
        current_lng = min_lng
        while current_lng <= max_lng:
            pt = Point(current_lng, current_lat)
            if poly.contains(pt):
                points.append({"lat": round(current_lat, 6), "lng": round(current_lng, 6)})
            # Move east by spacing_m
            current_lng = _offset_lng(current_lat, current_lng, spacing_m)
        # Move north by spacing_m
        current_lat = _offset_lat(current_lat, spacing_m)

    return {
        "count": len(points),
        "points": points
    }
