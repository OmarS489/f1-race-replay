import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TelemetryFrame } from '../../types';

interface TelemetryChartsProps {
  frames: TelemetryFrame[];
  currentIndex: number;
  drsZones: { zone_start: number; zone_end: number }[];
  minSpeed: number;
  maxSpeed: number;
}

export default function TelemetryCharts({
  frames,
  currentIndex,
  drsZones,
  minSpeed,
  maxSpeed,
}: TelemetryChartsProps) {
  // Prepare data up to current frame for animated chart
  const chartData = frames.slice(0, currentIndex + 1).map((frame) => ({
    distance: frame.telemetry.rel_dist,
    speed: frame.telemetry.speed,
    gear: frame.telemetry.gear,
    throttle: frame.telemetry.throttle,
    brake: frame.telemetry.brake,
  }));

  const currentFrame = frames[currentIndex];

  return (
    <div className="space-y-4">
      {/* Speed Chart */}
      <div className="bg-f1-gray/90 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium">Speed (km/h)</h4>
          <span className="text-white font-mono">
            {currentFrame?.telemetry.speed.toFixed(0)} km/h
          </span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="distance"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10 }}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <YAxis
                domain={[Math.floor(minSpeed * 0.9), Math.ceil(maxSpeed * 1.1)]}
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10 }}
                width={40}
              />
              {/* DRS zones as reference areas */}
              {drsZones.map((zone, i) => (
                <ReferenceLine
                  key={i}
                  segment={[
                    { x: zone.zone_start, y: minSpeed },
                    { x: zone.zone_end, y: maxSpeed },
                  ]}
                  stroke="#00ff00"
                  strokeOpacity={0.3}
                />
              ))}
              <Line
                type="monotone"
                dataKey="speed"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gear Chart */}
      <div className="bg-f1-gray/90 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium">Gear</h4>
          <span className="text-white font-mono">
            Gear {currentFrame?.telemetry.gear}
          </span>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="distance"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10 }}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <YAxis
                domain={[0, 8]}
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10 }}
                width={30}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
              />
              <Line
                type="stepAfter"
                dataKey="gear"
                stroke="#888888"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Throttle/Brake Chart */}
      <div className="bg-f1-gray/90 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium">Throttle / Brake</h4>
          <div className="flex gap-4 text-sm">
            <span className="text-green-500">
              T: {currentFrame?.telemetry.throttle.toFixed(0)}%
            </span>
            <span className="text-red-500">
              B: {currentFrame?.telemetry.brake.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="distance"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10 }}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#666"
                tick={{ fill: '#666', fontSize: 10 }}
                width={30}
              />
              <Line
                type="monotone"
                dataKey="throttle"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="brake"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <div className="w-3 h-1 bg-green-500 rounded"></div> Throttle
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-1 bg-red-500 rounded"></div> Brake
          </span>
        </div>
      </div>
    </div>
  );
}
