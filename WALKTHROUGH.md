# AgroMap Backend — Walkthrough

## What Was Built

A complete FastAPI backend for the Smart Plantation Planning app with **9 endpoints**, all running and verified at `http://localhost:8000`.

## Project Structure

```
backend/
├── main.py              ← FastAPI app, CORS, router mounts, health check
├── requirements.txt
├── data/
│   ├── crops.json       ← 10 crops with spacing & water data
│   └── nurseries.json   ← 7 nurseries in Maharashtra with GPS + inventory
├── models/
│   └── schemas.py       ← All Pydantic request/response models
├── routers/
│   ├── land.py          ← POST /land/area
│   ├── crops.py         ← GET /crops
│   ├── plantation.py    ← POST /plantation/estimate, /plantation/layout
│   ├── nurseries.py     ← GET /nurseries/nearby
│   ├── bookings.py      ← POST /bookings, GET /bookings/{id}
│   ├── weather.py       ← GET /weather (cached, mock fallback)
│   └── water.py         ← POST /water/calculate
├── services/
│   ├── geo.py           ← Geodesic area (pyproj), Haversine distance
│   ├── layout.py        ← Grid generator (Shapely point-in-polygon)
│   └── cache.py         ← TTL cache for weather
└── static/
    └── index.html       ← Test frontend console (dark theme)
```

## Test Results (All ✅)

| # | Endpoint | Method | Result |
|---|---|---|---|
| 1 | `/api/v1/health` | GET | `{"status":"ok","version":"hackathon-v1"}` |
| 2 | `/api/v1/crops` | GET | 10 crops returned |
| 3 | `/api/v1/land/area` | POST | 9233.01 sqm / 0.923 ha / 2.28 acres |
| 4 | `/api/v1/plantation/estimate` | POST | min:137, max:169, recommended:153 |
| 5 | `/api/v1/plantation/layout` | POST | 10 points at 30m spacing |
| 6 | `/api/v1/nurseries/nearby` | GET | Nurseries filtered by distance + crop |
| 7 | `/api/v1/bookings` | POST | BK4A140B — CONFIRMED |
| 7b | `/api/v1/bookings/{id}` | GET | Full booking detail returned |
| 8 | `/api/v1/weather` | GET | 33.5°C, 51% humidity, Cloudy (mock) |
| 9 | `/api/v1/water/calculate` | POST | 2960 L/day, 88800 L/month |

## How to Run

```bash
cd d:\Projects\AgroMap\backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Then open:
- **Test Console**: http://localhost:8000/
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Keys

| Service | Required? | How to Set |
|---|---|---|
| **OpenWeather** | ❌ Optional | Set `OPENWEATHER_API_KEY` env var for live weather. Without it, mock data is returned — demo works either way. |
| **Google Maps** | ❌ Frontend only | Not needed by backend at all. |

> No other API keys are needed. The backend is fully self-contained for demo purposes.
