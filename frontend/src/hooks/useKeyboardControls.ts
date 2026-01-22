import { useEffect, useRef } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';

export function useKeyboardControls() {
  const pausedBeforeHold = useRef(false);

  const {
    togglePause,
    increaseSpeed,
    decreaseSpeed,
    setSpeed,
    startRewind,
    stopRewind,
    startForward,
    stopForward,
    restart,
    toggleDriverLabel,
    toggleDrsZones,
    toggleGapDisplayMode,
    toggleTimingTower,
    paused,
    setPaused,
  } = usePlaybackStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          pausedBeforeHold.current = paused;
          startForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          pausedBeforeHold.current = paused;
          startRewind();
          break;
        case 'ArrowUp':
          e.preventDefault();
          increaseSpeed();
          break;
        case 'ArrowDown':
          e.preventDefault();
          decreaseSpeed();
          break;
        case 'Digit1':
          setSpeed(0.5);
          break;
        case 'Digit2':
          setSpeed(1.0);
          break;
        case 'Digit3':
          setSpeed(2.0);
          break;
        case 'Digit4':
          setSpeed(4.0);
          break;
        case 'KeyR':
          restart();
          break;
        case 'KeyD':
          toggleDrsZones();
          break;
        case 'KeyL':
          toggleDriverLabel();
          break;
        case 'KeyT':
          toggleGapDisplayMode();
          break;
        case 'KeyB':
          toggleTimingTower();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowRight':
          stopForward();
          setPaused(pausedBeforeHold.current);
          break;
        case 'ArrowLeft':
          stopRewind();
          setPaused(pausedBeforeHold.current);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    togglePause,
    increaseSpeed,
    decreaseSpeed,
    setSpeed,
    startRewind,
    stopRewind,
    startForward,
    stopForward,
    restart,
    toggleDriverLabel,
    toggleDrsZones,
    toggleGapDisplayMode,
    toggleTimingTower,
    paused,
    setPaused,
  ]);
}
