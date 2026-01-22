import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import YearSelector from '../components/YearSelector';
import EventList from '../components/EventList';
import SessionButtons from '../components/SessionButtons';
import { useYears, useEvents, useSessions } from '../hooks/useEvents';

export default function SelectionPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const { years, loading: yearsLoading } = useYears();
  const { events, loading: eventsLoading } = useEvents(selectedYear);
  const { sessions, loading: sessionsLoading } = useSessions(selectedYear, selectedRound);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setSelectedRound(null);
  };

  const handleRoundSelect = (round: number) => {
    setSelectedRound(round);
  };

  const handleSessionSelect = (session: string) => {
    if (!selectedYear || !selectedRound) return;

    // Navigate to the appropriate viewer
    if (session === 'Q' || session === 'SQ') {
      navigate(`/qualifying/${selectedYear}/${selectedRound}/${session}`);
    } else {
      navigate(`/race/${selectedYear}/${selectedRound}/${session}`);
    }
  };

  const selectedEvent = events.find((e) => e.round_number === selectedRound);

  return (
    <div className="min-h-screen bg-f1-black flex flex-col">
      {/* Header */}
      <header className="bg-f1-gray border-b border-gray-700 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-f1-red">F1</span>
            Race Replay
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-f1-gray rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6">
              Select a Session to View
            </h2>

            <YearSelector
              years={years}
              selectedYear={selectedYear}
              onSelect={handleYearSelect}
              loading={yearsLoading}
            />

            <EventList
              events={events}
              selectedRound={selectedRound}
              onSelect={handleRoundSelect}
              loading={eventsLoading}
            />

            {selectedEvent && (
              <div className="mt-4 p-4 bg-f1-black rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">
                  {selectedEvent.event_name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {selectedEvent.country} - {selectedEvent.date}
                </p>
              </div>
            )}

            <SessionButtons
              sessions={sessions}
              onSelect={handleSessionSelect}
              loading={sessionsLoading}
            />
          </div>

          {/* Info Section */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>
              View historical F1 race replays with real telemetry data.
            </p>
            <p className="mt-1">
              Data provided by FastF1.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-f1-gray border-t border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          F1 Race Replay - Built with FastF1, React, and Pixi.js
        </div>
      </footer>
    </div>
  );
}
