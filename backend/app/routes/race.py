"""
Race data API routes.
"""
from fastapi import APIRouter, HTTPException
from backend.app.services.f1_service import (
    get_session_metadata,
    get_track_data,
    get_race_frames,
)

router = APIRouter(prefix="/api/years/{year}/rounds/{round_number}/sessions/{session}", tags=["race"])


def validate_session(session: str):
    """Validate session type."""
    valid_sessions = ['R', 'S', 'Q', 'SQ']
    if session not in valid_sessions:
        raise HTTPException(status_code=400, detail=f"Session must be one of: {valid_sessions}")


@router.get("/metadata")
async def get_metadata(year: int, round_number: int, session: str):
    """Get session metadata (event name, drivers, colors, rotation, total_laps)."""
    validate_session(session)
    try:
        return get_session_metadata(year, round_number, session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/track")
async def get_track(year: int, round_number: int, session: str):
    """Get track geometry (inner/outer boundaries, DRS zones, bounds)."""
    validate_session(session)
    try:
        return get_track_data(year, round_number, session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/frames")
async def get_frames(year: int, round_number: int, session: str):
    """Get all telemetry frames for race/sprint playback."""
    if session not in ['R', 'S']:
        raise HTTPException(status_code=400, detail="Frames endpoint only available for Race (R) or Sprint (S) sessions")
    try:
        return get_race_frames(year, round_number, session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
