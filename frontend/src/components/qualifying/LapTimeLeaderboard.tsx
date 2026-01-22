import type { QualifyingResult } from '../../types';

interface LapTimeLeaderboardProps {
  results: QualifyingResult[];
  selectedDriver: string | null;
  onDriverSelect: (code: string) => void;
}

function formatLapTime(seconds: string | null): string {
  if (!seconds) return '-';
  const secs = parseFloat(seconds);
  const mins = Math.floor(secs / 60);
  const remainder = secs % 60;
  return `${mins}:${remainder.toFixed(3).padStart(6, '0')}`;
}

export default function LapTimeLeaderboard({
  results,
  selectedDriver,
  onDriverSelect,
}: LapTimeLeaderboardProps) {
  return (
    <div className="bg-f1-gray/90 rounded-lg p-4 w-72 max-h-[80vh] overflow-y-auto">
      <h3 className="text-white font-bold mb-3 text-lg">Lap Times</h3>
      <div className="space-y-1">
        {results.map((result) => (
          <button
            key={result.code}
            className={`w-full text-left px-3 py-2 rounded transition-colors ${
              selectedDriver === result.code
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
            onClick={() => onDriverSelect(result.code)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-5 text-sm">
                  {result.position}.
                </span>
                <span
                  className="font-medium"
                  style={{
                    color: selectedDriver === result.code ? '#ffffff' : result.color,
                  }}
                >
                  {result.code}
                </span>
              </div>
              <div className="text-right text-xs font-mono">
                {result.Q3 ? (
                  <span className="text-purple-400">{formatLapTime(result.Q3)}</span>
                ) : result.Q2 ? (
                  <span className="text-yellow-400">{formatLapTime(result.Q2)}</span>
                ) : result.Q1 ? (
                  <span className="text-gray-400">{formatLapTime(result.Q1)}</span>
                ) : (
                  <span className="text-gray-600">No time</span>
                )}
              </div>
            </div>
            {/* Segment times */}
            <div className="flex gap-2 mt-1 text-xs">
              <span className={`${result.Q1 ? 'text-gray-400' : 'text-gray-600'}`}>
                Q1: {formatLapTime(result.Q1)}
              </span>
              <span className={`${result.Q2 ? 'text-yellow-400/70' : 'text-gray-600'}`}>
                Q2: {formatLapTime(result.Q2)}
              </span>
              <span className={`${result.Q3 ? 'text-purple-400/70' : 'text-gray-600'}`}>
                Q3: {formatLapTime(result.Q3)}
              </span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-gray-500 text-xs mt-4">
        Click a driver to view their lap telemetry
      </p>
    </div>
  );
}
