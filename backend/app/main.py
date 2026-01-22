"""
FastAPI application for F1 Race Replay web backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routes import events, race, qualifying

app = FastAPI(
    title="F1 Race Replay API",
    description="API for F1 race telemetry and replay data",
    version="1.0.0",
)

# Configure CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(events.router)
app.include_router(race.router)
app.include_router(qualifying.router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "F1 Race Replay API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
