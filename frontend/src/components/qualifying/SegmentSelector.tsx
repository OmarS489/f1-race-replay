import type { QualifyingResult } from '../../types';

interface SegmentSelectorProps {
  driver: QualifyingResult;
  onSelect: (segment: string) => void;
  onClose: () => void;
}

function formatLapTime(seconds: string | null): string {
  if (!seconds) return 'No time';
  const secs = parseFloat(seconds);
  const mins = Math.floor(secs / 60);
  const remainder = secs % 60;
  return `${mins}:${remainder.toFixed(3).padStart(6, '0')}`;
}

export default function SegmentSelector({
  driver,
  onSelect,
  onClose,
}: SegmentSelectorProps) {
  const segments = [
    { key: 'Q1', time: driver.Q1, color: 'bg-gray-600' },
    { key: 'Q2', time: driver.Q2, color: 'bg-yellow-600' },
    { key: 'Q3', time: driver.Q3, color: 'bg-purple-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-f1-gray rounded-xl p-6 w-96 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-xl font-bold">
            {driver.code} - Select Session
          </h3>
          <button
            className="text-gray-400 hover:text-white text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <p className="text-gray-400 mb-4">{driver.full_name}</p>
        <div className="space-y-3">
          {segments.map(({ key, time, color }) => (
            <button
              key={key}
              disabled={!time}
              className={`w-full py-4 px-4 rounded-lg flex items-center justify-between transition-all ${
                time
                  ? `${color} hover:opacity-90 text-white`
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              onClick={() => time && onSelect(key)}
            >
              <span className="font-bold text-lg">{key}</span>
              <span className="font-mono">{formatLapTime(time)}</span>
            </button>
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-4 text-center">
          Click a session to view telemetry
        </p>
      </div>
    </div>
  );
}
