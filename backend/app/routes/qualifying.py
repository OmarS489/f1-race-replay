"""
Qualifying data API routes.
"""
from fastapi import APIRouter, HTTPException
from backend.app.services.f1_service import (
    get_qualifying_results,
    get_qualifying_driver_telemetry,
)

router = APIRouter(prefix="/api/years/{year}/rounds/{round_number}/sessions/{session}", tags=["qualifying"])


def validate_qualifying_session(session: str):
    """Validate that session is a qualifying type."""
    valid_sessions = ['Q', 'SQ']
    if session not in valid_sessions:
        raise HTTPException(status_code=400, detail=f"Qualifying endpoints only available for Q or SQ sessions")


@router.get("/qualifying/results")
async def get_results(year: int, round_number: int, session: str):
    """Get qualifying results with lap times for each segment."""
    validate_qualifying_session(session)
    try:
        return get_qualifying_results(year, round_number, session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/qualifying/{driver}/{segment}")
async def get_driver_telemetry(year: int, round_number: int, session: str, driver: str, segment: str):
    """Get telemetry frames for a specific driver's qualifying segment (Q1, Q2, Q3)."""
    validate_qualifying_session(session)

    if segment not in ['Q1', 'Q2', 'Q3']:
        raise HTTPException(status_code=400, detail="Segment must be Q1, Q2, or Q3")

    try:
        return get_qualifying_driver_telemetry(year, round_number, session, driver, segment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
