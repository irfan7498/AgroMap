"""
Geospatial calculation utilities.
- Geodesic polygon area using pyproj
- Haversine distance between two GPS points
"""

import math
from typing import List, Tuple
from pyproj import Geod


# WGS84 ellipsoid for accurate geodesic calculations
_geod = Geod(ellps="WGS84")


def calculate_geodesic_area(coordinates: List[List[float]]) -> float:
    """
    Calculate the geodesic area of a polygon on the WGS84 ellipsoid.

    Args:
        coordinates: List of [lat, lng] pairs defining the polygon.

    Returns:
        Area in square meters (always positive).
    """
    # pyproj expects (lon, lat) order
    lons = [coord[1] for coord in coordinates]
    lats = [coord[0] for coord in coordinates]

    # polygon_area_perimeter returns (area_m2, perimeter_m)
    # area is signed (positive = counter-clockwise), so we take abs
    area, _ = _geod.polygon_area_perimeter(lons, lats)
    return abs(area)


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth.

    Args:
        lat1, lng1: First point latitude and longitude in degrees.
        lat2, lng2: Second point latitude and longitude in degrees.

    Returns:
        Distance in kilometers.
    """
    R = 6371.0  # Earth radius in km

    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
