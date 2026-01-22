# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

F1 Race Replay is a Python desktop application that visualizes Formula 1 race telemetry and replays race events interactively. It uses Arcade (2D graphics engine) for race visualization and PySide6 (Qt) for the menu system, with FastF1 as the data source.

## Commands

```bash
# Setup (using uv - recommended)
uv sync

# Setup (using pip)
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Run application modes
python main.py                                    # GUI menu (default, PySide6)
python main.py --cli                              # CLI menu (terminal-based)
python main.py --web                              # Web mode (browser-based)
python main.py --viewer --year 2025 --round 12   # Direct viewer (race)
python main.py --viewer --year 2025 --round 12 --sprint
python main.py --viewer --year 2025 --round 12 --qualifying
python main.py --viewer --year 2025 --round 12 --sprint-qualifying
python main.py --viewer --year 2025 --round 12 --no-hud
python main.py --viewer --year 2025 --round 12 --refresh-data
python main.py --list-rounds 2025

# Web mode (browser-based)
python main.py --web                              # Start backend on port 8000
python main.py --web --port 8080                  # Custom port
cd frontend && npm install && npm run dev         # Start frontend on port 5173
# Then open http://localhost:5173 in browser
```

No test suite exists currently.

## Architecture

### Entry Point & Data Flow
1. **main.py** - CLI argument parsing, routes to GUI/CLI menu or direct viewer
2. **src/f1_data.py** - Core data layer: FastF1 API integration, telemetry extraction via multiprocessing, frame generation (FPS=25), caching
3. **src/interfaces/race_replay.py** - F1RaceReplayWindow: main Arcade window for race visualization
4. **src/interfaces/qualifying.py** - QualifyingReplay: qualifying visualization with telemetry charts
5. **src/ui_components.py** - Reusable Arcade UI components (LeaderboardComponent, WeatherComponent, etc.) inheriting from BaseComponent

### Key Modules
- **src/f1_data.py** (~900 lines) - Data processing, multiprocessing for parallel driver telemetry extraction, pickle/JSON caching
- **src/ui_components.py** (~2000 lines) - All UI components: leaderboard, weather, legend, driver info, progress bar, controls popup, session info, lap times
- **src/gui/race_selection.py** - PySide6 menu window, spawns viewer via subprocess
- **src/cli/race_selection.py** - Terminal menu using Questionary & Rich

### Web Mode Architecture (browser-based)
- **backend/app/main.py** - FastAPI application with CORS
- **backend/app/routes/** - API endpoints for events, race data, qualifying data
- **backend/app/services/f1_service.py** - Thin wrapper around src/f1_data.py
- **frontend/** - React + TypeScript + Vite application
- **frontend/src/pages/** - SelectionPage, RaceViewer, QualifyingViewer
- **frontend/src/components/race/** - Pixi.js track canvas, leaderboard, weather, controls
- **frontend/src/components/qualifying/** - Telemetry charts (Recharts), lap time leaderboard
- **frontend/src/stores/playbackStore.ts** - Zustand store for playback state

### Session Types
- Race (R), Sprint (S), Qualifying (Q), Sprint Qualifying (SQ)

### Caching
- `.fastf1-cache/` - FastF1 API response cache (auto-created)
- `computed_data/` - Preprocessed telemetry data as pickle/JSON (auto-created)

## Key Technical Details

- Python 3.12+ required
- Multiprocessing in f1_data.py for parallel driver telemetry extraction
- GUI menu spawns viewer via subprocess with ready-file signaling for IPC
- Track customization (width, colors) in src/arcade_replay.py
- Telemetry processing adjustments in src/f1_data.py

## Known Limitations

- Leaderboard inaccuracy in first corners and during pit stops (telemetry data limitations)
- Performance optimization needed for lower-end devices during race replay rendering
