import type { WeatherData } from '../../types';
import { formatWindDirection } from '../../utils/trackGeometry';

interface WeatherPanelProps {
  weather: WeatherData | null;
}

export default function WeatherPanel({ weather }: WeatherPanelProps) {
  if (!weather) {
    return null;
  }

  return (
    <div className="bg-f1-gray/90 rounded-lg p-4 w-64">
      <h3 className="text-white font-bold mb-3">Weather</h3>
      <div className="space-y-2 text-sm">
        <WeatherRow
          label="Track"
          value={weather.track_temp !== null ? `${weather.track_temp.toFixed(1)}°C` : 'N/A'}
        />
        <WeatherRow
          label="Air"
          value={weather.air_temp !== null ? `${weather.air_temp.toFixed(1)}°C` : 'N/A'}
        />
        <WeatherRow
          label="Humidity"
          value={weather.humidity !== null ? `${weather.humidity.toFixed(0)}%` : 'N/A'}
        />
        <WeatherRow
          label="Wind"
          value={
            weather.wind_speed !== null
              ? `${weather.wind_speed.toFixed(1)} km/h ${formatWindDirection(weather.wind_direction)}`
              : 'N/A'
          }
        />
        <WeatherRow
          label="Rain"
          value={weather.rain_state || 'N/A'}
          highlight={weather.rain_state === 'RAINING'}
        />
      </div>
    </div>
  );
}

function WeatherRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className={highlight ? 'text-blue-400' : 'text-white'}>{value}</span>
    </div>
  );
}
