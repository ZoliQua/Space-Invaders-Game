import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, loadSession, saveSession } from './arcade';
import { createInitialState } from './logic/game';
import { toSaved } from './logic/persist';
import { SpaceInvadersGame } from './SpaceInvadersGame';
import { installGameEnv, restoreGameEnv } from './test/gameEnv';

beforeEach(() => {
  localStorage.clear();
  installGameEnv();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
});
afterEach(() => {
  restoreGameEnv();
  applyLang('en', { silent: true });
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const finishBtn = () => screen.queryByRole('button', { name: 'Befejezés' });

function saveRun(score: number) {
  const run = createInitialState({ status: 'running', score, wave: 2 });
  saveSession('invaders', { schema: 1, data: toSaved(run), seconds: 10, score });
}

describe('Space Invaders finish early', () => {
  it('is hidden before the run starts and visible after the first move', () => {
    render(<SpaceInvadersGame />);
    expect(finishBtn()).toBeNull();
    act(() => key(' '));
    expect(finishBtn()).toBeTruthy();
  });

  it('confirms with the Score value, ranks it once and shows the finished card', () => {
    saveRun(340);
    const onGameOver = vi.fn();
    render(<SpaceInvadersGame onGameOver={onGameOver} />);
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('340 pont kerül a ranglistára');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(340, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
    expect(loadSession('invaders', 1)).toBeNull();
    act(() => vi.advanceTimersByTime(2000));
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('finishing at score 0 still ranks it', () => {
    const onGameOver = vi.fn();
    render(<SpaceInvadersGame onGameOver={onGameOver} />);
    act(() => key(' '));
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('0 pont kerül a ranglistára');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
  });

  it('Cancel changes nothing', () => {
    saveRun(340);
    const onGameOver = vi.fn();
    render(<SpaceInvadersGame onGameOver={onGameOver} />);
    const before = screen.getByText('Pont').parentElement!.textContent;
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.getByText('Pont').parentElement!.textContent).toBe(before);
    expect(screen.getByRole('dialog', { name: 'Üdv újra!' })).toBeTruthy();
  });

  it('stops the simulation while the confirm is open', () => {
    render(<SpaceInvadersGame />);
    act(() => key(' '));
    act(() => vi.advanceTimersByTime(300));
    fireEvent.click(finishBtn()!);
    act(() => vi.advanceTimersByTime(100));
    const t0 = loadTick();
    act(() => vi.advanceTimersByTime(3000));
    expect(loadTick()).toBe(t0);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    act(() => vi.advanceTimersByTime(1500));
    expect(loadTick()).toBeGreaterThan(t0);
  });
});

/** Ticks simulated so far, read from the autosave (flushed on every state sync). */
function loadTick(): number {
  act(() => vi.advanceTimersByTime(1100));
  return (loadSession<{ tick: number }>('invaders', 1)?.data.tick) ?? 0;
}
