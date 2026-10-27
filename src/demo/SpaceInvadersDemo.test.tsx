import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStats } from '../arcade';
import { SpaceInvadersDemo } from './SpaceInvadersDemo';

let paints = 0;

beforeEach(() => {
  localStorage.clear();
  paints = 0;
  const ctx = {
    setTransform: () => {
      paints += 1;
    },
    fillRect: () => undefined,
    fillText: () => undefined,
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  );
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('<SpaceInvadersDemo />', () => {
  it('plays by itself without touching stats, saves or the keyboard', () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    const { container } = render(<SpaceInvadersDemo />);
    const demo = container.querySelector('.arc-demo');
    expect(demo).toBeTruthy();
    expect(demo?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    const before = paints;
    // 30 demo frames of 100 ms, each a new engine state painted on the canvas.
    for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(100));
    expect(paints - before).toBeGreaterThanOrEqual(25);
    expect(addListener.mock.calls.some(([type]) => type === 'keydown')).toBe(false);
    expect(readStats('invaders').plays).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    render(<SpaceInvadersDemo active={false} />);
    const before = paints;
    for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(100));
    expect(paints).toBe(before);
  });
});
