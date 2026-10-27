import { useEffect, useRef } from 'react';
import { MAX_FRAME_MS } from '../logic/constants';

/**
 * requestAnimationFrame loop while `active`. Hands the callback the elapsed
 * milliseconds since the previous frame, clamped to `MAX_FRAME_MS` (the first
 * frame after (re)starting reports 0), so a backgrounded tab or a long pause
 * never makes the simulation jump.
 */
export function useAnimationFrame(active: boolean, onFrame: (dtMs: number) => void): void {
  const callbackRef = useRef(onFrame);
  useEffect(() => {
    callbackRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!active) return;
    const raf =
      typeof window.requestAnimationFrame === 'function'
        ? (cb: FrameRequestCallback) => window.requestAnimationFrame(cb)
        : (cb: FrameRequestCallback) => window.setTimeout(() => cb(Date.now()), 16);
    const cancel =
      typeof window.cancelAnimationFrame === 'function'
        ? (id: number) => window.cancelAnimationFrame(id)
        : (id: number) => window.clearTimeout(id);
    let last: number | null = null;
    let stopped = false;
    let id = 0;
    const loop = (t: number) => {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min(MAX_FRAME_MS, Math.max(0, t - last));
      last = t;
      callbackRef.current(dt);
      if (!stopped) id = raf(loop);
    };
    id = raf(loop);
    return () => {
      stopped = true;
      cancel(id);
    };
  }, [active]);
}
