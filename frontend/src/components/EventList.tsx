import type { F1Event } from '../types';

interface EventListProps {
  events: F1Event[];
  selectedRound: number | null;
  onSelect: (roundNumber: number) => void;
  loading?: boolean;
}

export default function EventList({
  events,
  selectedRound,
  onSelect,
  loading,
}: EventListProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Select a year to see available races
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Race ({events.length} events)
      </label>
      <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-600">
        {events.map((event) => (
          <button
            key={event.round_number}
            className={`w-full text-left px-4 py-3 border-b border-gray-700 last:border-b-0 hover:bg-f1-gray transition-colors ${
              selectedRound === event.round_number
                ? 'bg-f1-red text-white'
                : 'bg-f1-black text-white'
            }`}
            onClick={() => onSelect(event.round_number)}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-400 mr-2">R{event.round_number}</span>
                <span className="font-medium">{event.event_name}</span>
              </div>
              <div className="text-sm text-gray-400">
                {event.country} - {event.date}
              </div>
            </div>
            {event.type.includes('sprint') && (
              <span className="inline-block mt-1 text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                Sprint Weekend
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
