import type { RaceFrame, DriverFrameData } from '../../types';
import { getTyreCompound } from '../../utils/trackGeometry';

interface LeaderboardProps {
  frame: RaceFrame | null;
  driverColors: Record<string, string>;
  selectedDrivers: string[];
  onDriverSelect: (code: string) => void;
}

export default function Leaderboard({
  frame,
  driverColors,
  selectedDrivers,
  onDriverSelect,
}: LeaderboardProps) {
  if (!frame) {
    return (
      <div className="bg-f1-gray/90 rounded-lg p-4 w-64">
        <h3 className="text-white font-bold mb-2">Leaderboard</h3>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  // Sort drivers by position (which is based on lap and distance)
  const sortedDrivers = Object.entries(frame.drivers).sort(
    ([, a], [, b]) => a.position - b.position
  );

  return (
    <div className="bg-f1-gray/90 rounded-lg p-4 w-64 max-h-[80vh] overflow-y-auto">
      <h3 className="text-white font-bold mb-3 text-lg">Leaderboard</h3>
      <div className="space-y-1">
        {sortedDrivers.map(([code, data]) => (
          <LeaderboardRow
            key={code}
            code={code}
            data={data}
            color={driverColors[code] || '#ffffff'}
            isSelected={selectedDrivers.includes(code)}
            onClick={() => onDriverSelect(code)}
          />
        ))}
      </div>
      {frame.lap === 1 && (
        <p className="text-yellow-400 text-xs mt-3">
          May be inaccurate during Lap 1
        </p>
      )}
    </div>
  );
}

interface LeaderboardRowProps {
  code: string;
  data: DriverFrameData;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

function LeaderboardRow({
  code,
  data,
  color,
  isSelected,
  onClick,
}: LeaderboardRowProps) {
  const isDrsActive = data.drs >= 10;
  const tyreCompound = getTyreCompound(Math.round(data.tyre));

  return (
    <button
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-colors ${
        isSelected
          ? 'bg-white/20'
          : 'hover:bg-white/10'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-5 text-sm">{data.position}.</span>
        <span
          className="font-medium"
          style={{ color: isSelected ? '#ffffff' : color }}
        >
          {code}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* DRS indicator */}
        <div
          className={`w-2 h-2 rounded-full ${
            isDrsActive ? 'bg-green-500' : 'bg-gray-600'
          }`}
          title={isDrsActive ? 'DRS Active' : 'DRS Inactive'}
        />
        {/* Tyre indicator */}
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            tyreCompound === 'SOFT'
              ? 'bg-red-600'
              : tyreCompound === 'MEDIUM'
              ? 'bg-yellow-500 text-black'
              : tyreCompound === 'HARD'
              ? 'bg-white text-black'
              : tyreCompound === 'INTERMEDIATE'
              ? 'bg-green-500'
              : tyreCompound === 'WET'
              ? 'bg-blue-500'
              : 'bg-gray-500'
          }`}
        >
          {tyreCompound[0]}
        </span>
      </div>
    </button>
  );
}
