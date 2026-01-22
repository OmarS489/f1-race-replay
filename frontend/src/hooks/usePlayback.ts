import { useEffect, useRef } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';

/**
 * Hook to run the playback animation loop
 */
export function usePlayback() {
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number>();

  const { tick } = usePlaybackStore();

  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      tick(deltaTime);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [tick]);
}
