import { create } from 'zustand';

const PLAYBACK_SPEEDS = [0.1, 0.2, 0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0];
const FPS = 25;

export type GapDisplayMode = 'time' | 'distance';

interface PlaybackState {
  frameIndex: number;
  paused: boolean;
  playbackSpeed: number;
  totalFrames: number;
  isRewinding: boolean;
  isForwarding: boolean;
  selectedDrivers: string[];
  showDriverLabels: boolean;
  showDrsZones: boolean;
  gapDisplayMode: GapDisplayMode;
  showTimingTower: boolean;

  // Actions
  setFrameIndex: (index: number) => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  increaseSpeed: () => void;
  decreaseSpeed: () => void;
  setSpeed: (speed: number) => void;
  setTotalFrames: (total: number) => void;
  startRewind: () => void;
  stopRewind: () => void;
  startForward: () => void;
  stopForward: () => void;
  restart: () => void;
  selectDriver: (code: string | null) => void;
  toggleDriverLabel: () => void;
  toggleDrsZones: () => void;
  toggleGapDisplayMode: () => void;
  toggleTimingTower: () => void;
  tick: (deltaTime: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  frameIndex: 0,
  paused: false,
  playbackSpeed: 1.0,
  totalFrames: 0,
  isRewinding: false,
  isForwarding: false,
  selectedDrivers: [],
  showDriverLabels: false,
  showDrsZones: true,
  gapDisplayMode: 'time' as GapDisplayMode,
  showTimingTower: true,

  setFrameIndex: (index) =>
    set({ frameIndex: Math.max(0, Math.min(index, get().totalFrames - 1)) }),

  togglePause: () => set((state) => ({ paused: !state.paused })),

  setPaused: (paused) => set({ paused }),

  increaseSpeed: () =>
    set((state) => {
      const currentIndex = PLAYBACK_SPEEDS.indexOf(state.playbackSpeed);
      if (currentIndex < PLAYBACK_SPEEDS.length - 1) {
        return { playbackSpeed: PLAYBACK_SPEEDS[currentIndex + 1] };
      }
      return state;
    }),

  decreaseSpeed: () =>
    set((state) => {
      const currentIndex = PLAYBACK_SPEEDS.indexOf(state.playbackSpeed);
      if (currentIndex > 0) {
        return { playbackSpeed: PLAYBACK_SPEEDS[currentIndex - 1] };
      }
      return state;
    }),

  setSpeed: (speed) => {
    if (PLAYBACK_SPEEDS.includes(speed)) {
      set({ playbackSpeed: speed });
    }
  },

  setTotalFrames: (total) => set({ totalFrames: total }),

  startRewind: () => set({ isRewinding: true, paused: true }),
  stopRewind: () => set({ isRewinding: false }),

  startForward: () => set({ isForwarding: true, paused: true }),
  stopForward: () => set({ isForwarding: false }),

  restart: () => set({ frameIndex: 0, playbackSpeed: 1.0, paused: false }),

  selectDriver: (code) =>
    set((state) => {
      if (!code) {
        return { selectedDrivers: [] };
      }
      if (state.selectedDrivers.includes(code)) {
        return { selectedDrivers: state.selectedDrivers.filter((c) => c !== code) };
      }
      return { selectedDrivers: [...state.selectedDrivers, code] };
    }),

  toggleDriverLabel: () =>
    set((state) => ({ showDriverLabels: !state.showDriverLabels })),

  toggleDrsZones: () =>
    set((state) => ({ showDrsZones: !state.showDrsZones })),

  toggleGapDisplayMode: () =>
    set((state) => ({
      gapDisplayMode: state.gapDisplayMode === 'time' ? 'distance' : 'time',
    })),

  toggleTimingTower: () =>
    set((state) => ({ showTimingTower: !state.showTimingTower })),

  tick: (deltaTime) =>
    set((state) => {
      const seekSpeed = 3.0 * Math.max(1.0, state.playbackSpeed);

      if (state.isRewinding) {
        const newIndex = Math.max(0, state.frameIndex - deltaTime * FPS * seekSpeed);
        return { frameIndex: newIndex };
      }

      if (state.isForwarding) {
        const newIndex = Math.min(
          state.totalFrames - 1,
          state.frameIndex + deltaTime * FPS * seekSpeed
        );
        return { frameIndex: newIndex };
      }

      if (state.paused) {
        return state;
      }

      const newIndex = state.frameIndex + deltaTime * FPS * state.playbackSpeed;
      if (newIndex >= state.totalFrames) {
        return { frameIndex: state.totalFrames - 1, paused: true };
      }

      return { frameIndex: newIndex };
    }),
}));
