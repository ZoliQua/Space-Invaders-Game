import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, loadSession } from './arcade';
import { SpaceInvadersGame } from './SpaceInvadersGame';
import { installGameEnv, restoreGameEnv } from './test/gameEnv';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  installGameEnv();
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  setCoarsePointer(true);
});
afterEach(() => restoreGameEnv());

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const board = () => document.querySelector('.arc-board-touch') as HTMLElement;
const canvas = () => screen.getByRole('img', { name: 'Space Invaders playfield' });
const saved = () => loadSession<{ playerX: number; shotsFired: number }>('invaders', 1)?.data;
const rect = { left: 0, top: 0, width: 224, height: 240, right: 224, bottom: 240, x: 0, y: 0, toJSON: () => ({}) };

function setup() {
  const view = render(<SpaceInvadersGame />);
  act(() => key(' '));
  canvas().getBoundingClientRect = () => rect as DOMRect;
  return view;
}
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('Space Invaders touch controls', () => {
  it('marks the board as a gesture board', () => {
    render(<SpaceInvadersGame />);
    expect(board()).toBeTruthy();
    expect(board().contains(canvas())).toBe(true);
  });

  it('dragging on the board moves the cannon without firing', () => {
    const { unmount } = setup();
    fireEvent.pointerDown(canvas(), { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 200, buttons: 1, button: 0 });
    fireEvent.pointerMove(canvas(), { pointerId: 1, pointerType: 'touch', clientX: 150, clientY: 200, buttons: 1 });
    advance(1200);
    fireEvent.pointerUp(canvas(), { pointerId: 1, pointerType: 'touch', clientX: 150, clientY: 200 });
    unmount();
    const data = saved();
    expect(data!.playerX).toBeGreaterThan(60);
    expect(data!.shotsFired).toBe(0);
  });

  it('the Fire button fires, and holding it keeps firing', () => {
    const { unmount } = setup();
    const fire = screen.getByRole('button', { name: 'Fire' });
    fireEvent.pointerDown(fire, { pointerId: 2, pointerType: 'touch', button: 0 });
    advance(2500);
    fireEvent.pointerUp(fire, { pointerId: 2, pointerType: 'touch' });
    unmount();
    expect(saved()!.shotsFired).toBeGreaterThanOrEqual(3);
  });

  it('a single tap on Fire fires one shot', () => {
    const { unmount } = setup();
    const fire = screen.getByRole('button', { name: 'Fire' });
    fireEvent.pointerDown(fire, { pointerId: 2, pointerType: 'touch', button: 0 });
    fireEvent.pointerUp(fire, { pointerId: 2, pointerType: 'touch' });
    advance(400);
    unmount();
    expect(saved()!.shotsFired).toBe(1);
  });

  it('shows touch help instead of keys', () => {
    render(<SpaceInvadersGame />);
    expect(screen.getByText('Drag')).toBeTruthy();
  });

  it('the full-screen button toggles the immersive mode', () => {
    render(<SpaceInvadersGame />);
    fireEvent.click(screen.getByRole('button', { name: /Full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /Exit full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });
});
