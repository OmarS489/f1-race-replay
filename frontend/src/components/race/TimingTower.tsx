import { useMemo } from 'react';
import type { RaceFrame, DriverFrameData, PitStop } from '../../types';
import { getTyreCompound } from '../../utils/trackGeometry';
import { usePlaybackStore, type GapDisplayMode } from '../../stores/playbackStore';

interface TimingTowerProps {
  frame: RaceFrame | null;
  driverColors: Record<string, string>;
  selectedDrivers: string[];
  onDriverSelect: (code: string) => void;
  pitStops: PitStop[];
  previousFrame?: RaceFrame | null;
}

function formatGap(
  seconds: number | null,
  distance: number | null,
  mode: GapDisplayMode,
  lapsDown?: number | null
): string {
  if (lapsDown && lapsDown > 0) {
    return lapsDown === 1 ? '+1 LAP' : `+${lapsDown} LAPS`;
  }

  if (mode === 'time') {
    if (seconds === null || seconds === undefined) return '---';
    if (seconds < 0.001) return '---';
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = (seconds % 60).toFixed(1);
      return `+${mins}:${secs.padStart(4, '0')}`;
    }
    return `+${seconds.toFixed(1)}s`;
  } else {
    if (distance === null || distance === undefined) return '---';
    if (distance < 1) return '---';
    if (distance >= 1000) {
      return `+${(distance / 1000).toFixed(2)}km`;
    }
    return `+${Math.round(distance)}m`;
  }
}

function getPositionBackground(position: number): string {
  switch (position) {
    case 1:
      return 'bg-gradient-to-r from-yellow-600 to-yellow-700';
    case 2:
      return 'bg-gradient-to-r from-gray-400 to-gray-500';
    case 3:
      return 'bg-gradient-to-r from-amber-700 to-amber-800';
    default:
      return 'bg-gray-700';
  }
}

function getTyreColor(compound: string): string {
  switch (compound) {
    case 'SOFT':
      return 'bg-red-500';
    case 'MEDIUM':
      return 'bg-yellow-400';
    case 'HARD':
      return 'bg-white';
    case 'INTERMEDIATE':
      return 'bg-green-400';
    case 'WET':
      return 'bg-blue-400';
    default:
      return 'bg-gray-500';
  }
}

function getTyreTextColor(compound: string): string {
  return compound === 'MEDIUM' || compound === 'HARD' ? 'text-black' : 'text-white';
}

interface TimingRowProps {
  code: string;
  data: DriverFrameData;
  color: string;
  isSelected: boolean;
  onClick: () => void;
  gapMode: GapDisplayMode;
  pitCount: number;
  positionChange: number;
}

function TimingRow({
  code,
  data,
  color,
  isSelected,
  onClick,
  gapMode,
  pitCount,
  positionChange,
}: TimingRowProps) {
  const compound = getTyreCompound(Math.round(data.tyre));
  const isDrsActive = data.drs >= 10;

  return (
    <button
      className={`w-full flex items-center gap-1 px-1.5 py-1 rounded transition-all duration-150 ${
        isSelected
          ? 'bg-white/20 ring-1 ring-white/40'
          : 'hover:bg-white/10'
      } ${data.in_pit ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      {/* Position */}
      <div
        className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-white ${getPositionBackground(
          data.position
        )}`}
      >
        {data.position}
      </div>

      {/* Position change indicator */}
      <div className="w-4 flex items-center justify-center">
        {positionChange > 0 && (
          <span className="text-green-400 text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
        {positionChange < 0 && (
          <span className="text-red-400 text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {/* Driver code */}
      <div className="w-12 flex items-center">
        <span
          className="font-bold text-sm tracking-tight"
          style={{ color: isSelected ? '#ffffff' : color }}
        >
          {code}
        </span>
      </div>

      {/* Interval (gap to car ahead) */}
      <div className="w-16 text-right text-xs font-mono text-gray-300">
        {formatGap(data.interval, data.interval_dist, gapMode)}
      </div>

      {/* Gap to leader */}
      <div className="w-20 text-right text-xs font-mono text-gray-400">
        {formatGap(data.gap_to_leader, data.gap_to_leader_dist, gapMode, data.laps_behind)}
      </div>

      {/* Tyre compound + age */}
      <div className="flex items-center gap-0.5">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getTyreColor(
            compound
          )} ${getTyreTextColor(compound)}`}
        >
          {compound[0]}
        </div>
        <span className="text-xs text-gray-400 w-4 text-right">
          {data.tyre_age}
        </span>
      </div>

      {/* Pit count */}
      {pitCount > 0 && (
        <div className="w-4 h-4 rounded-full bg-f1-red/80 flex items-center justify-center text-[10px] font-bold text-white">
          {pitCount}
        </div>
      )}

      {/* DRS indicator */}
      <div
        className={`w-2 h-2 rounded-full ml-auto ${
          isDrsActive ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-gray-600'
        }`}
        title={isDrsActive ? 'DRS Active' : 'DRS Inactive'}
      />

      {/* In pit indicator */}
      {data.in_pit && (
        <div className="text-[10px] font-bold text-orange-400 ml-1">PIT</div>
      )}
    </button>
  );
}

export default function TimingTower({
  frame,
  driverColors,
  selectedDrivers,
  onDriverSelect,
  pitStops,
  previousFrame,
}: TimingTowerProps) {
  const { gapDisplayMode, toggleGapDisplayMode, showTimingTower, toggleTimingTower } = usePlaybackStore();

  // Calculate pit counts per driver
  const pitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!frame) return counts;

    const currentLap = frame.lap;
    for (const stop of pitStops) {
      if (stop.lap <= currentLap) {
        counts[stop.driver] = (counts[stop.driver] || 0) + 1;
      }
    }
    return counts;
  }, [pitStops, frame?.lap]);

  // Calculate position changes from previous frame
  const positionChanges = useMemo(() => {
    const changes: Record<string, number> = {};
    if (!frame || !previousFrame) return changes;

    for (const [code, data] of Object.entries(frame.drivers)) {
      const prevData = previousFrame.drivers[code];
      if (prevData) {
        changes[code] = prevData.position - data.position;
      }
    }
    return changes;
  }, [frame, previousFrame]);

  if (!frame) {
    return (
      <div className="bg-f1-gray/95 backdrop-blur-sm rounded-lg p-3 w-72">
        <h3 className="text-white font-bold mb-2 text-sm">Timing Tower</h3>
        <p className="text-gray-400 text-xs">Loading...</p>
      </div>
    );
  }

  // Sort drivers by position
  const sortedDrivers = Object.entries(frame.drivers).sort(
    ([, a], [, b]) => a.position - b.position
  );

  if (!showTimingTower) {
    return (
      <button
        className="bg-f1-gray/95 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-f1-gray transition-colors"
        onClick={toggleTimingTower}
        title="Show Timing Tower"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
    );
  }

  return (
    <div className="bg-f1-gray/95 backdrop-blur-sm rounded-lg overflow-hidden w-72 max-h-[85vh] flex flex-col shadow-xl">
      {/* Header */}
      <div className="bg-f1-black/50 px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm tracking-wide">TIMING TOWER</h3>
        <div className="flex items-center gap-2">
          {/* Gap mode toggle */}
          <button
            className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            onClick={toggleGapDisplayMode}
            title={`Showing ${gapDisplayMode === 'time' ? 'time' : 'distance'} gaps. Click to toggle.`}
          >
            {gapDisplayMode === 'time' ? 'TIME' : 'DIST'}
          </button>
          {/* Collapse button */}
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={toggleTimingTower}
            title="Hide Timing Tower"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-gray-500 uppercase tracking-wider bg-f1-black/30 border-b border-gray-700/50">
        <div className="w-6 text-center">P</div>
        <div className="w-4"></div>
        <div className="w-12">DRV</div>
        <div className="w-16 text-right">INT</div>
        <div className="w-20 text-right">GAP</div>
        <div className="w-10 text-center">TYRE</div>
        <div className="flex-1"></div>
      </div>

      {/* Driver list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
        {sortedDrivers.map(([code, data]) => (
          <TimingRow
            key={code}
            code={code}
            data={data}
            color={driverColors[code] || '#ffffff'}
            isSelected={selectedDrivers.includes(code)}
            onClick={() => onDriverSelect(code)}
            gapMode={gapDisplayMode}
            pitCount={pitCounts[code] || 0}
            positionChange={positionChanges[code] || 0}
          />
        ))}
      </div>

      {/* Footer with warnings */}
      {frame.lap === 1 && (
        <div className="px-3 py-1.5 bg-yellow-900/30 border-t border-yellow-700/50">
          <p className="text-yellow-400 text-[10px]">
            Positions may be inaccurate during Lap 1
          </p>
        </div>
      )}
    </div>
  );
}
