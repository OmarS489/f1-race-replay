import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useSessionMetadata, useTrackData, useRaceFrames } from '../hooks/useEvents';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { usePlaybackStore } from '../stores/playbackStore';
import { formatTime } from '../utils/trackGeometry';
import TrackCanvas from '../components/race/TrackCanvas';
import TimingTower from '../components/race/TimingTower';
import DriverInfoPanel from '../components/race/DriverInfoPanel';
import WeatherPanel from '../components/race/WeatherPanel';
import ProgressBar from '../components/race/ProgressBar';
import PlaybackControls from '../components/race/PlaybackControls';

export default function RaceViewer() {
  const { year, round, session } = useParams<{
    year: string;
    round: string;
    session: string;
  }>();
  const navigate = useNavigate();

  const yearNum = parseInt(year || '2024');
  const roundNum = parseInt(round || '1');
  const sessionType = session || 'R';

  const { metadata, loading: metaLoading } = useSessionMetadata(yearNum, roundNum, sessionType);
  const { trackData, loading: trackLoading } = useTrackData(yearNum, roundNum, sessionType);
  const { raceData, loading: raceLoading } = useRaceFrames(yearNum, roundNum, sessionType);

  // Initialize keyboard controls
  useKeyboardControls();

  const {
    frameIndex,
    playbackSpeed,
    paused,
    selectedDrivers,
    selectDriver,
  } = usePlaybackStore();

  const isLoading = metaLoading || trackLoading || raceLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-f1-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-f1-red mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading race data...</p>
          <p className="text-gray-400 mt-2">
            {metadata?.event_name || 'Preparing telemetry data'}
          </p>
        </div>
      </div>
    );
  }

  if (!trackData || !raceData || !metadata) {
    return (
      <div className="min-h-screen bg-f1-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">Failed to load race data</p>
          <button
            className="mt-4 bg-f1-red text-white px-4 py-2 rounded"
            onClick={() => navigate('/')}
          >
            Back to Selection
          </button>
        </div>
      </div>
    );
  }

  const currentFrame = raceData.frames[Math.floor(frameIndex)] || raceData.frames[0];

  // Track previous frame for position change detection (1 second ago)
  const previousFrame = useMemo(() => {
    const prevIndex = Math.max(0, Math.floor(frameIndex) - 25); // 25 FPS, so ~1 second ago
    return raceData.frames[prevIndex] || null;
  }, [raceData.frames, frameIndex]);

  return (
    <div className="min-h-screen bg-f1-black flex flex-col">
      {/* Header */}
      <header className="bg-f1-gray-dark/95 backdrop-blur-sm border-b border-gray-700/50 py-2 px-4 flex items-center justify-between shadow-lg">
        <button
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-center">
          <h1 className="text-white font-bold tracking-wide">
            {metadata.event_name}
            <span className="text-f1-red ml-2">
              {sessionType === 'S' ? 'SPRINT' : 'RACE'}
            </span>
          </h1>
          <p className="text-gray-400 text-sm">
            {metadata.circuit_name} | {metadata.country}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white font-mono text-lg tabular-nums">
            {formatTime(currentFrame?.t || 0)}
          </p>
          <p className="text-gray-400 text-sm">
            <span className="text-f1-red font-medium">{playbackSpeed}x</span>
            {paused && <span className="ml-2 text-yellow-400">PAUSED</span>}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Panel - Info */}
        <div className="absolute left-4 top-4 z-10 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Lap/Time Display */}
          <div className="bg-f1-gray/90 rounded-lg p-4">
            <div className="text-white">
              <p className="text-2xl font-bold">
                Lap {currentFrame?.lap || 1}
                {metadata.total_laps && ` / ${metadata.total_laps}`}
              </p>
              <p className="text-gray-400">
                Race Time: {formatTime(currentFrame?.t || 0)}
              </p>
            </div>
          </div>
          <WeatherPanel weather={currentFrame?.weather || null} />
          {/* Driver Info Panel - shows when drivers are selected */}
          <DriverInfoPanel
            frame={currentFrame}
            driverColors={raceData.driver_colors}
            selectedDrivers={selectedDrivers}
            sectorTimes={raceData.sector_times || {}}
          />
        </div>

        {/* Track Canvas */}
        <div className="flex-1">
          <TrackCanvas
            trackData={trackData}
            frames={raceData.frames}
            driverColors={raceData.driver_colors}
            trackStatuses={raceData.track_statuses}
            circuitRotation={metadata.circuit_rotation}
          />
        </div>

        {/* Right Panel - Timing Tower */}
        <div className="absolute right-4 top-4 z-10">
          <TimingTower
            frame={currentFrame}
            driverColors={raceData.driver_colors}
            selectedDrivers={selectedDrivers}
            onDriverSelect={selectDriver}
            pitStops={raceData.pit_stops || []}
            previousFrame={previousFrame}
          />
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-2xl px-4 space-y-2">
          <ProgressBar
            currentLap={currentFrame?.lap || 1}
            totalLaps={metadata.total_laps}
            pitStops={raceData.pit_stops}
            trackStatuses={raceData.track_statuses}
            frames={raceData.frames}
            driverColors={raceData.driver_colors}
          />
          <PlaybackControls />
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 z-10 bg-f1-gray/80 rounded-lg p-3 text-xs text-gray-400">
        <p className="font-medium text-white mb-1">Keyboard Shortcuts</p>
        <p>Space: Play/Pause | Arrows: Seek/Speed</p>
        <p>1-4: Set Speed | R: Restart</p>
        <p>D: DRS Zones | L: Labels | T: Gap Mode | B: Tower</p>
      </div>
    </div>
  );
}
