import type { RaceFrame, DriverFrameData, SectorTimes } from '../../types';
import { getTyreCompound } from '../../utils/trackGeometry';
import { usePlaybackStore } from '../../stores/playbackStore';

interface DriverInfoPanelProps {
  frame: RaceFrame | null;
  driverColors: Record<string, string>;
  selectedDrivers: string[];
  sectorTimes: Record<string, Record<number, SectorTimes>>;
}

function getDrsStatus(drsValue: number): { status: string; color: string; bgColor: string } {
  // DRS values: 0=off, 8=eligible, 10-14=active
  if (drsValue >= 10) {
    return { status: 'ACTIVE', color: 'text-green-400', bgColor: 'bg-green-500' };
  } else if (drsValue === 8) {
    return { status: 'AVAILABLE', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
  }
  return { status: 'OFF', color: 'text-gray-400', bgColor: 'bg-gray-600' };
}

function SpeedometerBar({ speed, maxSpeed = 360 }: { speed: number; maxSpeed?: number }) {
  const percentage = Math.min(100, (speed / maxSpeed) * 100);

  // Color gradient based on speed
  const getSpeedColor = (pct: number) => {
    if (pct < 30) return 'from-green-500 to-green-400';
    if (pct < 60) return 'from-yellow-500 to-yellow-400';
    if (pct < 85) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-gray-400 text-xs uppercase tracking-wider">Speed</span>
        <span className="text-white text-2xl font-bold font-mono tabular-nums">
          {Math.round(speed)}
          <span className="text-xs text-gray-400 ml-1">km/h</span>
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getSpeedColor(percentage)} transition-all duration-100`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ThrottleBrakeBar({
  throttle,
  brake,
}: {
  throttle: number;
  brake: number;
}) {
  return (
    <div className="flex gap-3">
      {/* Throttle */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Throttle</span>
          <span className="text-green-400 text-sm font-mono">{Math.round(throttle)}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-75"
            style={{ width: `${throttle}%` }}
          />
        </div>
      </div>

      {/* Brake */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Brake</span>
          <span className="text-red-400 text-sm font-mono">{Math.round(brake * 100)}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-75"
            style={{ width: `${brake * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function GearIndicator({ gear }: { gear: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs uppercase tracking-wider">Gear</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
          <div
            key={g}
            className={`w-5 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
              g === gear
                ? 'bg-f1-red text-white'
                : g < gear
                ? 'bg-gray-600 text-gray-400'
                : 'bg-gray-700 text-gray-500'
            }`}
          >
            {g}
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverCard({
  code,
  data,
  color,
  sectorTimes,
  currentLap,
}: {
  code: string;
  data: DriverFrameData;
  color: string;
  sectorTimes?: Record<number, SectorTimes>;
  currentLap: number;
}) {
  const drsStatus = getDrsStatus(data.drs);
  const compound = getTyreCompound(Math.round(data.tyre));

  // Get current lap's sector times if available
  const currentSectors = sectorTimes?.[currentLap] || sectorTimes?.[currentLap - 1];

  const formatSectorTime = (time: number | null | undefined) => {
    if (time === null || time === undefined) return '--.-';
    return time.toFixed(1);
  };

  const getTyreColor = (c: string) => {
    switch (c) {
      case 'SOFT': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-400 text-black';
      case 'HARD': return 'bg-white text-black';
      case 'INTERMEDIATE': return 'bg-green-400';
      case 'WET': return 'bg-blue-400';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-f1-gray/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl">
      {/* Header with driver info */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: `${color}40` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg tracking-wider">{code}</span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold">P{data.position}</span>
          <span className="text-gray-300 text-xs">LAP {data.lap}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Speed */}
        <SpeedometerBar speed={data.speed} />

        {/* Gear indicator */}
        <GearIndicator gear={data.gear} />

        {/* DRS Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs uppercase tracking-wider">DRS</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${drsStatus.bgColor}`} />
            <span className={`text-sm font-bold ${drsStatus.color}`}>
              {drsStatus.status}
            </span>
          </div>
        </div>

        {/* Throttle & Brake */}
        <ThrottleBrakeBar throttle={data.throttle} brake={data.brake} />

        {/* Gap info */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700">
          <div>
            <span className="text-gray-500 text-[10px] uppercase">Gap Ahead</span>
            <p className="text-white text-sm font-mono">
              {data.interval ? `+${data.interval.toFixed(1)}s` : '---'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase">To Leader</span>
            <p className="text-white text-sm font-mono">
              {data.gap_to_leader ? `+${data.gap_to_leader.toFixed(1)}s` : '---'}
            </p>
          </div>
        </div>

        {/* Tyre info */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getTyreColor(compound)}`}>
              {compound[0]}
            </div>
            <span className="text-gray-400 text-xs">{compound}</span>
          </div>
          <div className="text-right">
            <span className="text-white text-sm font-mono">{data.tyre_age}</span>
            <span className="text-gray-400 text-xs ml-1">laps</span>
          </div>
        </div>

        {/* Sector times */}
        {currentSectors && (
          <div className="pt-2 border-t border-gray-700">
            <span className="text-gray-500 text-[10px] uppercase">Sector Times</span>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 bg-gray-700 rounded px-2 py-1 text-center">
                <span className="text-[10px] text-gray-400">S1</span>
                <p className="text-white text-xs font-mono">{formatSectorTime(currentSectors.s1)}</p>
              </div>
              <div className="flex-1 bg-gray-700 rounded px-2 py-1 text-center">
                <span className="text-[10px] text-gray-400">S2</span>
                <p className="text-white text-xs font-mono">{formatSectorTime(currentSectors.s2)}</p>
              </div>
              <div className="flex-1 bg-gray-700 rounded px-2 py-1 text-center">
                <span className="text-[10px] text-gray-400">S3</span>
                <p className="text-white text-xs font-mono">{formatSectorTime(currentSectors.s3)}</p>
              </div>
            </div>
          </div>
        )}

        {/* In pit indicator */}
        {data.in_pit && (
          <div className="bg-orange-500/20 border border-orange-500/50 rounded px-3 py-2 text-center">
            <span className="text-orange-400 text-sm font-bold">IN PIT LANE</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverInfoPanel({
  frame,
  driverColors,
  selectedDrivers,
  sectorTimes,
}: DriverInfoPanelProps) {
  const { selectDriver } = usePlaybackStore();

  if (!frame || selectedDrivers.length === 0) {
    return null;
  }

  // Limit to 3 drivers max
  const displayedDrivers = selectedDrivers.slice(0, 3);

  return (
    <div className="space-y-3">
      {displayedDrivers.map((code) => {
        const data = frame.drivers[code];
        if (!data) return null;

        return (
          <div key={code} className="relative">
            <DriverCard
              code={code}
              data={data}
              color={driverColors[code] || '#ffffff'}
              sectorTimes={sectorTimes[code]}
              currentLap={data.lap}
            />
            {/* Close button */}
            <button
              className="absolute top-2 right-2 w-5 h-5 rounded bg-gray-700/50 hover:bg-gray-600 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              onClick={() => selectDriver(code)}
              title="Deselect driver"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {selectedDrivers.length > 3 && (
        <p className="text-gray-400 text-xs text-center">
          +{selectedDrivers.length - 3} more selected
        </p>
      )}
    </div>
  );
}
