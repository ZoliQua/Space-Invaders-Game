import { vi } from 'vitest';

/** A stand-in 2D context: jsdom has no canvas; we only need drawing calls not to throw. */
function fakeContext() {
  return {
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    imageSmoothingEnabled: true,
  };
}

/** Fake canvas + fake timers (including requestAnimationFrame) for component tests. */
export function installGameEnv(): void {
  window.scrollTo = (() => {}) as typeof window.scrollTo; // jsdom: the kit's full-screen mode scrolls to top
  const ctx = fakeContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as unknown as CanvasRenderingContext2D);
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
  });
}

export function restoreGameEnv(): void {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
}
