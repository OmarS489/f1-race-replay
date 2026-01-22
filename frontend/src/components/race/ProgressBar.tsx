import { useState, useMemo, useCallback } from 'react';
import { usePlaybackStore } from '../../stores/playbackStore';
import type { PitStop, TrackStatus, RaceFrame } from '../../types';

interface ProgressBarProps {
  currentLap: number;
  totalLaps: number | null;
  pitStops?: PitStop[];
  trackStatuses?: TrackStatus[];
  frames?: RaceFrame[];
  driverColors?: Record<string, string>;
}

interface TooltipData {
  x: number;
  content: string;
  type: 'pit' | 'flag' | 'lap';
}

function getTrackStatusInfo(status: string): { label: string; color: string } {
  const statuses: Record<string, { label: string; color: string }> = {
    '1': { label: 'Green Flag', color: 'bg-green-500' },
    '2': { label: 'Yellow Flag', color: 'bg-yellow-500' },
    '4': { label: 'Safety Car', color: 'bg-orange-500' },
    '5': { label: 'Red Flag', color: 'bg-red-500' },
    '6': { label: 'VSC', color: 'bg-amber-500' },
    '7': { label: 'VSC Ending', color: 'bg-amber-400' },
  };
  return statuses[status] || { label: 'Unknown', color: 'bg-gray-500' };
}

export default function ProgressBar({
  currentLap,
  totalLaps,
  pitStops = [],
  trackStatuses = [],
  frames = [],
  driverColors = {},
}: ProgressBarProps) {
  const { frameIndex, totalFrames, setFrameIndex, setPaused } = usePlaybackStore();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progress = totalFrames > 0 ? (frameIndex / totalFrames) * 100 : 0;

  // Calculate lap markers positions
  const lapMarkers = useMemo(() => {
    if (!totalLaps || totalLaps <= 1 || frames.length === 0) return [];

    const markers: { lap: number; position: number }[] = [];
    let lastLap = 0;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (frame.lap !== lastLap && frame.lap > 1) {
        markers.push({
          lap: frame.lap,
          position: (i / frames.length) * 100,
        });
        lastLap = frame.lap;
      }
    }

    // Only show markers every N laps to avoid clutter
    const interval = totalLaps > 30 ? 5 : totalLaps > 15 ? 3 : 1;
    return markers.filter((m) => m.lap % interval === 0);
  }, [totalLaps, frames]);

  // Calculate pit stop marker positions
  const pitMarkers = useMemo(() => {
    if (pitStops.length === 0 || frames.length === 0) return [];

    const markers: { driver: string; lap: number; position: number; color: string }[] = [];

    for (const stop of pitStops) {
      // Find frame index for this pit stop lap
      const frameIdx = frames.findIndex((f) => f.lap === stop.lap);
      if (frameIdx >= 0) {
        markers.push({
          driver: stop.driver,
          lap: stop.lap,
          position: (frameIdx / frames.length) * 100,
          color: driverColors[stop.driver] || '#ffffff',
        });
      }
    }

    return markers;
  }, [pitStops, frames, driverColors]);

  // Calculate track status segments
  const statusSegments = useMemo(() => {
    if (trackStatuses.length === 0 || frames.length === 0) return [];

    const totalTime = frames[frames.length - 1]?.t || 1;
    const segments: { start: number; end: number; status: string }[] = [];

    for (const status of trackStatuses) {
      // Only show non-green flags
      if (status.status === '1') continue;

      const startPercent = (status.start_time / totalTime) * 100;
      const endPercent = status.end_time
        ? (status.end_time / totalTime) * 100
        : 100;

      segments.push({
        start: Math.max(0, startPercent),
        end: Math.min(100, endPercent),
        status: status.status,
      });
    }

    return segments;
  }, [trackStatuses, frames]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      const newFrame = Math.floor(percent * totalFrames);
      setFrameIndex(newFrame);
    },
    [totalFrames, setFrameIndex]
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    setPaused(true);
  }, [setPaused]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;

      if (isDragging) {
        const newFrame = Math.floor(percent * totalFrames);
        setFrameIndex(newFrame);
      }

      // Check for nearby markers
      const frameIdx = Math.floor(percent * frames.length);
      const frame = frames[frameIdx];

      if (frame) {
        // Check pit stops
        const nearbyPit = pitMarkers.find(
          (p) => Math.abs(p.position - percent * 100) < 1.5
        );
        if (nearbyPit) {
          setTooltip({
            x: x,
            content: `${nearbyPit.driver} pit - Lap ${nearbyPit.lap}`,
            type: 'pit',
          });
          return;
        }

        // Check track status
        const statusAtPosition = statusSegments.find(
          (s) => percent * 100 >= s.start && percent * 100 <= s.end
        );
        if (statusAtPosition) {
          const info = getTrackStatusInfo(statusAtPosition.status);
          setTooltip({
            x: x,
            content: info.label,
            type: 'flag',
          });
          return;
        }

        // Show lap number
        setTooltip({
          x: x,
          content: `Lap ${frame.lap}`,
          type: 'lap',
        });
      }
    },
    [isDragging, totalFrames, setFrameIndex, frames, pitMarkers, statusSegments]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setIsDragging(false);
  }, []);

  return (
    <div className="bg-f1-gray/95 backdrop-blur-sm rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">
          Lap {currentLap}
          {totalLaps && ` / ${totalLaps}`}
        </span>
        <span className="text-gray-400 text-sm font-mono">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar container */}
      <div
        className="relative h-6 bg-gray-700 rounded cursor-pointer overflow-visible"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Track status segments (background) */}
        {statusSegments.map((segment, idx) => {
          const info = getTrackStatusInfo(segment.status);
          return (
            <div
              key={idx}
              className={`absolute top-0 h-full ${info.color} opacity-40`}
              style={{
                left: `${segment.start}%`,
                width: `${segment.end - segment.start}%`,
              }}
            />
          );
        })}

        {/* Progress fill */}
        <div
          className="absolute top-0 h-full bg-f1-red rounded-l transition-all duration-75"
          style={{ width: `${progress}%` }}
        />

        {/* Lap markers */}
        {lapMarkers.map((marker) => (
          <div
            key={marker.lap}
            className="absolute top-0 h-full w-px bg-gray-500/50"
            style={{ left: `${marker.position}%` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 text-[10px] text-gray-500">
              {marker.lap}
            </span>
          </div>
        ))}

        {/* Pit stop markers */}
        {pitMarkers.map((pit, idx) => (
          <div
            key={`${pit.driver}-${pit.lap}-${idx}`}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:scale-125 transition-transform"
            style={{
              left: `${pit.position}%`,
              backgroundColor: pit.color,
              marginLeft: '-6px',
            }}
            title={`${pit.driver} pit - Lap ${pit.lap}`}
          >
            <span className="text-[8px] font-bold text-white drop-shadow-lg">P</span>
          </div>
        ))}

        {/* Current position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-f1-red shadow-lg transition-all duration-75"
          style={{ left: `${progress}%`, marginLeft: '-6px' }}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute -top-10 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none z-50"
            style={{ left: tooltip.x, transform: 'translateX(-50%)' }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* Legend */}
      {(statusSegments.length > 0 || pitMarkers.length > 0) && (
        <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
          {statusSegments.length > 0 && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-yellow-500" /> Yellow
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-orange-500" /> SC
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-red-500" /> Red
              </span>
            </>
          )}
          {pitMarkers.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white border border-gray-400" /> Pit
            </span>
          )}
        </div>
      )}
    </div>
  );
}
