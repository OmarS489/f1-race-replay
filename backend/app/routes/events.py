"""
Event-related API routes.
"""
from fastapi import APIRouter, HTTPException
from backend.app.services.f1_service import (
    get_available_years,
    get_events_for_year,
    get_available_sessions,
)

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/years")
async def list_years():
    """Get list of available F1 seasons."""
    return get_available_years()


@router.get("/years/{year}/events")
async def list_events(year: int):
    """Get all race events for a given year."""
    if year < 2018 or year > 2025:
        raise HTTPException(status_code=400, detail="Year must be between 2018 and 2025")
    try:
        return get_events_for_year(year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/years/{year}/rounds/{round_number}/sessions")
async def list_sessions(year: int, round_number: int):
    """Get available session types for a given event."""
    if year < 2018 or year > 2025:
        raise HTTPException(status_code=400, detail="Year must be between 2018 and 2025")
    if round_number < 1 or round_number > 24:
        raise HTTPException(status_code=400, detail="Invalid round number")
    try:
        return get_available_sessions(year, round_number)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
