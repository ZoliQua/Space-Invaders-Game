import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSession, readStats, saveSession } from './arcade';
import { PLAYER_START_X } from './logic/constants';
import { createInitialState } from './logic/game';
import { toSaved, type SavedGame } from './logic/persist';
import { SpaceInvadersGame } from './SpaceInvadersGame';

/** A stand-in 2D context: jsdom has no canvas; we only count what is drawn. */
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

let ctx: ReturnType<typeof fakeContext>;

beforeEach(() => {
  localStorage.clear();
  ctx = fakeContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  );
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'Date',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const keyUp = (k: string) => fireEvent.keyUp(window, { key: k });
const saved = () => loadSession<SavedGame>('invaders', 1)?.data;

describe('<SpaceInvadersGame />', () => {
  it('starts with Space, pauses with P and reports status to the host', () => {
    const onStatusChange = vi.fn();
    render(<SpaceInvadersGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('dialog', { name: 'Space Invaders' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Space Invaders' })).toBeTruthy();
    act(() => key(' '));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    act(() => key('p'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
  });

  it('moves the cannon and fires from the keyboard', () => {
    const { unmount } = render(<SpaceInvadersGame />);
    act(() => key(' '));
    act(() => key('ArrowRight'));
    act(() => key(' '));
    act(() => vi.advanceTimersByTime(1000));
    act(() => {
      keyUp('ArrowRight');
      keyUp(' ');
    });
    unmount();
    const data = saved();
    expect(data?.playerX).toBeGreaterThan(PLAYER_START_X + 30);
    expect(data?.shotsFired).toBeGreaterThanOrEqual(1);
    expect(data?.tick).toBeGreaterThan(40);
  });

  it('autosaves a run in progress and restores it paused', () => {
    const { unmount } = render(<SpaceInvadersGame />);
    act(() => key(' '));
    act(() => vi.advanceTimersByTime(1200));
    unmount();
    const data = saved();
    expect(data).toMatchObject({ status: 'running' });
    expect(typeof data?.alive).toBe('string');
    expect(data?.bunkers).toHaveLength(4);

    render(<SpaceInvadersGame embedded />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('records the finished run once and clears the save', () => {
    const onGameOver = vi.fn();
    // Last cannon already exploding: the run ends a few ticks after resuming.
    const doomed = createInitialState({ status: 'running', lives: 0, phase: 'dying', phaseTicks: 3, score: 340, wave: 2 });
    saveSession('invaders', { schema: 1, data: toSaved(doomed), seconds: 30, score: 340 });
    render(<SpaceInvadersGame onGameOver={onGameOver} />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    act(() => key('p'));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('dialog', { name: 'Game over' })).toBeTruthy();
    act(() => vi.advanceTimersByTime(500));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(340);
    expect(readStats('invaders')).toMatchObject({ best: 340, plays: 1 });
    expect(loadSession('invaders', 1)).toBeNull();
  });

  it('discards a corrupt save', () => {
    saveSession('invaders', { schema: 1, data: { alive: 'nope' }, seconds: 5, score: 0 });
    render(<SpaceInvadersGame />);
    expect(screen.getByRole('dialog', { name: 'Space Invaders' })).toBeTruthy();
    expect(loadSession('invaders', 1)).toBeNull();
  });

  it('pauses by itself when the tab is hidden', () => {
    render(<SpaceInvadersGame />);
    act(() => key(' '));
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    visibility.mockRestore();
  });

  it('toggles and remembers the sound setting', () => {
    render(<SpaceInvadersGame />);
    expect(screen.getByRole('button', { name: 'On' }).getAttribute('aria-pressed')).toBe('true');
    act(() => key('m'));
    expect(screen.getByRole('button', { name: 'Off' }).getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('invaders.sound')).toBe('off');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'On' }));
    });
    expect(localStorage.getItem('invaders.sound')).toBe('on');
  });

  it('ignores hotkeys while typing in a field', () => {
    render(
      <>
        <input aria-label="nick" />
        <SpaceInvadersGame />
      </>,
    );
    const input = screen.getByLabelText('nick');
    act(() => {
      fireEvent.keyDown(input, { key: ' ' });
      fireEvent.keyDown(input, { key: 'r' });
    });
    expect(screen.getByRole('dialog', { name: 'Space Invaders' })).toBeTruthy();
  });

  it('paints the playfield on a canvas', () => {
    render(<SpaceInvadersGame />);
    expect(screen.getByRole('img', { name: 'Space Invaders playfield' })).toBeTruthy();
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
