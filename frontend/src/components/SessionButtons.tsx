interface SessionButtonsProps {
  sessions: string[];
  onSelect: (session: string) => void;
  loading?: boolean;
}

const SESSION_LABELS: Record<string, string> = {
  Q: 'Qualifying',
  SQ: 'Sprint Qualifying',
  S: 'Sprint Race',
  R: 'Race',
};

const SESSION_COLORS: Record<string, string> = {
  Q: 'bg-blue-600 hover:bg-blue-700',
  SQ: 'bg-purple-600 hover:bg-purple-700',
  S: 'bg-yellow-600 hover:bg-yellow-700',
  R: 'bg-f1-red hover:bg-red-700',
};

export default function SessionButtons({
  sessions,
  onSelect,
  loading,
}: SessionButtonsProps) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-f1-red mx-auto"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Session
      </label>
      <div className="grid grid-cols-2 gap-3">
        {sessions.map((session) => (
          <button
            key={session}
            className={`${SESSION_COLORS[session] || 'bg-gray-600 hover:bg-gray-700'} text-white font-medium py-3 px-4 rounded-lg transition-colors`}
            onClick={() => onSelect(session)}
          >
            {SESSION_LABELS[session] || session}
          </button>
        ))}
      </div>
    </div>
  );
}
