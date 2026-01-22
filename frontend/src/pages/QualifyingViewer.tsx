import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useSessionMetadata,
  useTrackData,
  useQualifyingResults,
  useQualifyingTelemetry,
} from '../hooks/useEvents';
import { formatTime } from '../utils/trackGeometry';
import LapTimeLeaderboard from '../components/qualifying/LapTimeLeaderboard';
import TelemetryCharts from '../components/qualifying/TelemetryCharts';
import SegmentSelector from '../components/qualifying/SegmentSelector';

export default function QualifyingViewer() {
  const { year, round, session } = useParams<{
    year: string;
    round: string;
    session: string;
  }>();
  const navigate = useNavigate();

  const yearNum = parseInt(year || '2024');
  const roundNum = parseInt(round || '1');
  const sessionType = session || 'Q';

  const { metadata, loading: metaLoading } = useSessionMetadata(yearNum, roundNum, sessionType);
  const { loading: trackLoading } = useTrackData(yearNum, roundNum, sessionType);
  const { results, loading: resultsLoading } = useQualifyingResults(yearNum, roundNum, sessionType);
  const { telemetry, loading: telemetryLoading, fetchTelemetry } = useQualifyingTelemetry();

  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [paused, setPaused] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Animation loop
  useEffect(() => {
    if (paused || !telemetry?.frames.length) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        const nextIndex = prev + playbackSpeed;
        if (nextIndex >= telemetry.frames.length - 1) {
          setPaused(true);
          return telemetry.frames.length - 1;
        }
        return nextIndex;
      });
    }, 40); // ~25 FPS

    return () => clearInterval(interval);
  }, [paused, playbackSpeed, telemetry?.frames.length]);

  // Handle driver selection
  const handleDriverSelect = useCallback((code: string) => {
    setSelectedDriver(code);
    setShowSegmentModal(true);
  }, []);

  // Handle segment selection
  const handleSegmentSelect = useCallback(
    async (segment: string) => {
      if (!selectedDriver) return;
      setSelectedSegment(segment);
      setShowSegmentModal(false);
      setFrameIndex(0);
      setPaused(true);
      await fetchTelemetry(yearNum, roundNum, sessionType, selectedDriver, segment);
      setPaused(false);
    },
    [selectedDriver, yearNum, roundNum, sessionType, fetchTelemetry]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setPaused((p) => !p);
          break;
        case 'ArrowUp':
          setPlaybackSpeed((s) => Math.min(s * 2, 64));
          break;
        case 'ArrowDown':
          setPlaybackSpeed((s) => Math.max(s / 2, 0.25));
          break;
        case 'KeyR':
          setFrameIndex(0);
          setPaused(true);
          break;
        case 'Escape':
          if (showSegmentModal) {
            setShowSegmentModal(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSegmentModal]);

  const isLoading = metaLoading || trackLoading || resultsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-f1-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-f1-red mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading qualifying data...</p>
        </div>
      </div>
    );
  }

  const selectedDriverData = results.find((r) => r.code === selectedDriver);
  const currentFrame = telemetry?.frames[Math.floor(frameIndex)];

  return (
    <div className="min-h-screen bg-f1-black flex flex-col">
      {/* Header */}
      <header className="bg-f1-gray/90 border-b border-gray-700 py-2 px-4 flex items-center justify-between">
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate('/')}
        >
          &larr; Back
        </button>
        <div className="text-center">
          <h1 className="text-white font-bold">
            {metadata?.event_name} - {sessionType === 'SQ' ? 'Sprint Qualifying' : 'Qualifying'}
          </h1>
          <p className="text-gray-400 text-sm">
            {metadata?.circuit_name}, {metadata?.country}
          </p>
        </div>
        <div className="text-right">
          {currentFrame && (
            <p className="text-white font-mono">{formatTime(currentFrame.t)}</p>
          )}
          <p className="text-gray-400 text-sm">{playbackSpeed}x</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Results */}
        <div className="p-4">
          <LapTimeLeaderboard
            results={results}
            selectedDriver={selectedDriver}
            onDriverSelect={handleDriverSelect}
          />
        </div>

        {/* Center - Telemetry Charts */}
        <div className="flex-1 p-4 overflow-auto">
          {telemetry && telemetry.frames.length > 0 ? (
            <div className="space-y-4">
              {/* Driver info */}
              <div className="bg-f1-gray/90 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {selectedDriverData?.full_name || selectedDriver}
                    </h3>
                    <p className="text-gray-400">
                      {selectedSegment} - Fastest Lap
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono text-xl">
                      {formatTime(telemetry.frames[telemetry.frames.length - 1]?.t || 0)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Max Speed: {telemetry.max_speed.toFixed(0)} km/h
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <TelemetryCharts
                frames={telemetry.frames}
                currentIndex={Math.floor(frameIndex)}
                drsZones={telemetry.drs_zones}
                minSpeed={telemetry.min_speed}
                maxSpeed={telemetry.max_speed}
              />

              {/* Playback controls */}
              <div className="bg-f1-gray/90 rounded-lg p-4 flex items-center justify-center gap-4">
                <button
                  className="text-white hover:text-f1-red"
                  onClick={() => {
                    setFrameIndex(0);
                    setPaused(true);
                  }}
                  title="Restart"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  className="w-12 h-12 bg-f1-red rounded-full flex items-center justify-center text-white"
                  onClick={() => setPaused((p) => !p)}
                >
                  {paused ? (
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  )}
                </button>
                <span className="text-white font-mono">{playbackSpeed}x</span>
              </div>

              {/* Progress bar */}
              <div className="bg-f1-gray/90 rounded-lg p-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-f1-red transition-all"
                    style={{
                      width: `${(frameIndex / (telemetry.frames.length - 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : telemetryLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red mx-auto mb-2"></div>
                <p className="text-gray-400">Loading telemetry...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-lg">
                Select a driver to view their lap telemetry
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Segment Selector Modal */}
      {showSegmentModal && selectedDriverData && (
        <SegmentSelector
          driver={selectedDriverData}
          onSelect={handleSegmentSelect}
          onClose={() => setShowSegmentModal(false)}
        />
      )}

      {/* Keyboard shortcuts */}
      <div className="absolute bottom-4 left-4 z-10 bg-f1-gray/80 rounded-lg p-3 text-xs text-gray-400">
        <p className="font-medium text-white mb-1">Keyboard Shortcuts</p>
        <p>Space: Play/Pause | Up/Down: Speed</p>
        <p>R: Restart | Esc: Close modal</p>
      </div>
    </div>
  );
}
