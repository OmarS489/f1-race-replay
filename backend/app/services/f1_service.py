"""
F1 Service - Thin wrapper around src/f1_data.py functions for the web API.
"""
import sys
import os

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from src.f1_data import (
    enable_cache,
    load_session,
    get_race_weekends_by_year,
    get_race_telemetry,
    get_quali_telemetry,
    get_driver_colors,
    get_circuit_rotation,
)
from src.ui_components import build_track_from_example_lap
import fastf1
from typing import Optional
import numpy as np

# Initialize cache on module load
enable_cache()


def get_available_years() -> list[int]:
    """Return list of available F1 seasons (2018-2025)."""
    return list(range(2018, 2026))


def get_events_for_year(year: int) -> list[dict]:
    """Get all race events for a given year."""
    return get_race_weekends_by_year(year)


def get_available_sessions(year: int, round_number: int) -> list[str]:
    """
    Get available session types for a given event.
    Returns list of session codes: Q, SQ, S, R
    """
    try:
        schedule = fastf1.get_event_schedule(year)
        event = schedule[schedule['RoundNumber'] == round_number].iloc[0]
        event_format = event['EventFormat']

        # Base sessions available for all events
        sessions = ['Q', 'R']

        # Sprint weekend formats have additional sessions
        if event_format in ['sprint_qualifying', 'sprint_shootout', 'sprint']:
            sessions = ['SQ', 'Q', 'S', 'R']

        return sessions
    except Exception as e:
        print(f"Error getting sessions: {e}")
        return ['Q', 'R']


def get_session_metadata(year: int, round_number: int, session_type: str) -> dict:
    """Get metadata for a session (event name, drivers, colors, rotation, total_laps)."""
    session = load_session(year, round_number, session_type)

    driver_colors = get_driver_colors(session)
    # Convert RGB tuples to hex strings for JSON serialization
    driver_colors_hex = {
        code: f"#{r:02x}{g:02x}{b:02x}"
        for code, (r, g, b) in driver_colors.items()
    }

    circuit_rotation = get_circuit_rotation(session)

    # Get total laps for race sessions
    total_laps = None
    if session_type in ['R', 'S']:
        try:
            total_laps = int(session.laps['LapNumber'].max())
        except:
            total_laps = None

    return {
        'event_name': session.event.get('EventName', ''),
        'circuit_name': session.event.get('Location', ''),
        'country': session.event.get('Country', ''),
        'date': str(session.event.get('EventDate', '').date()) if session.event.get('EventDate') else '',
        'drivers': list(session.drivers),
        'driver_colors': driver_colors_hex,
        'circuit_rotation': float(circuit_rotation) if circuit_rotation else 0.0,
        'total_laps': total_laps,
    }


def get_track_data(year: int, round_number: int, session_type: str) -> dict:
    """Get track geometry data (inner/outer boundaries, DRS zones)."""
    session = load_session(year, round_number, session_type)

    # Get example lap for track layout
    example_lap = None
    try:
        # Prefer qualifying lap for DRS zones
        quali_session = load_session(year, round_number, 'Q')
        if quali_session is not None and len(quali_session.laps) > 0:
            fastest_quali = quali_session.laps.pick_fastest()
            if fastest_quali is not None:
                quali_telemetry = fastest_quali.get_telemetry()
                if 'DRS' in quali_telemetry.columns:
                    example_lap = quali_telemetry
    except:
        pass

    # Fallback to fastest race/session lap
    if example_lap is None:
        fastest_lap = session.laps.pick_fastest()
        if fastest_lap is not None:
            example_lap = fastest_lap.get_telemetry()

    if example_lap is None:
        return {'error': 'No valid laps found'}

    # Build track geometry
    (plot_x_ref, plot_y_ref,
     x_inner, y_inner,
     x_outer, y_outer,
     x_min, x_max,
     y_min, y_max, drs_zones) = build_track_from_example_lap(example_lap)

    # Convert to lists for JSON serialization
    inner_points = list(zip(x_inner.tolist(), y_inner.tolist()))
    outer_points = list(zip(x_outer.tolist(), y_outer.tolist()))

    # Format DRS zones
    formatted_drs_zones = []
    for zone in drs_zones:
        formatted_drs_zones.append({
            'start_index': zone['start']['index'],
            'end_index': zone['end']['index'],
        })

    return {
        'inner_points': inner_points,
        'outer_points': outer_points,
        'drs_zones': formatted_drs_zones,
        'bounds': {
            'x_min': float(x_min),
            'x_max': float(x_max),
            'y_min': float(y_min),
            'y_max': float(y_max),
        }
    }


def get_race_frames(year: int, round_number: int, session_type: str) -> dict:
    """Get all race telemetry frames for playback."""
    session = load_session(year, round_number, session_type)
    telemetry_data = get_race_telemetry(session, session_type=session_type)

    # Convert driver colors to hex
    driver_colors = telemetry_data.get('driver_colors', {})
    driver_colors_hex = {
        code: f"#{r:02x}{g:02x}{b:02x}"
        for code, (r, g, b) in driver_colors.items()
    }

    return {
        'frames': telemetry_data['frames'],
        'driver_colors': driver_colors_hex,
        'track_statuses': telemetry_data.get('track_statuses', []),
        'total_laps': telemetry_data.get('total_laps', 0),
        'total_frames': len(telemetry_data['frames']),
        # New metadata
        'pit_stops': telemetry_data.get('pit_stops', []),
        'lap_times': telemetry_data.get('lap_times', {}),
        'sector_times': telemetry_data.get('sector_times', {}),
        'tyre_stints': telemetry_data.get('tyre_stints', {}),
    }


def get_qualifying_results(year: int, round_number: int, session_type: str) -> list[dict]:
    """Get qualifying results with lap times."""
    session = load_session(year, round_number, session_type)
    quali_data = get_quali_telemetry(session, session_type=session_type)

    # Convert colors to hex in results
    results = quali_data.get('results', [])
    for result in results:
        if 'color' in result and isinstance(result['color'], (tuple, list)):
            r, g, b = result['color']
            result['color'] = f"#{r:02x}{g:02x}{b:02x}"

    return results


def get_qualifying_driver_telemetry(year: int, round_number: int, session_type: str,
                                     driver_code: str, segment: str) -> dict:
    """Get telemetry frames for a specific driver's qualifying segment."""
    session = load_session(year, round_number, session_type)
    quali_data = get_quali_telemetry(session, session_type=session_type)

    telemetry_store = quali_data.get('telemetry', {})
    driver_data = telemetry_store.get(driver_code, {})
    segment_data = driver_data.get(segment, {})

    if not segment_data or not segment_data.get('frames'):
        return {'frames': [], 'error': 'No telemetry data found'}

    return {
        'frames': segment_data.get('frames', []),
        'drs_zones': segment_data.get('drs_zones', []),
        'max_speed': segment_data.get('max_speed', 0),
        'min_speed': segment_data.get('min_speed', 0),
        'sector_times': segment_data.get('sector_times', {}),
        'compound': segment_data.get('compound', 0),
    }
