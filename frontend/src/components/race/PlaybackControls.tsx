import { usePlaybackStore } from '../../stores/playbackStore';

export default function PlaybackControls() {
  const {
    paused,
    playbackSpeed,
    togglePause,
    increaseSpeed,
    decreaseSpeed,
    restart,
  } = usePlaybackStore();

  return (
    <div className="bg-f1-gray/90 rounded-lg p-4 flex items-center justify-center gap-4">
      {/* Restart */}
      <button
        className="w-10 h-10 flex items-center justify-center text-white hover:text-f1-red transition-colors"
        onClick={restart}
        title="Restart (R)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* Speed Down */}
      <button
        className="w-10 h-10 flex items-center justify-center text-white hover:text-f1-red transition-colors"
        onClick={decreaseSpeed}
        title="Decrease Speed (Down Arrow)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
          />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        className="w-14 h-14 flex items-center justify-center bg-f1-red rounded-full text-white hover:bg-red-700 transition-colors"
        onClick={togglePause}
        title="Play/Pause (Space)"
      >
        {paused ? (
          <svg
            className="w-6 h-6 ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </button>

      {/* Speed Up */}
      <button
        className="w-10 h-10 flex items-center justify-center text-white hover:text-f1-red transition-colors"
        onClick={increaseSpeed}
        title="Increase Speed (Up Arrow)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
          />
        </svg>
      </button>

      {/* Speed Display */}
      <div className="ml-2 text-white text-sm font-mono bg-black/30 px-3 py-1 rounded">
        {playbackSpeed}x
      </div>
    </div>
  );
}
