import { describe, expect, it } from 'vitest';
import { aimPoint, chooseInput, ticksToHit } from './autopilot';
import { COLS, PLAYER_W, PLAYER_Y } from './constants';
import { aliveCount } from './formation';
import { createInitialState, runTicks } from './game';
import type { GameState } from './types';

const running = (over: Partial<GameState> & { seed?: number } = {}) =>
  createInitialState({ status: 'running', ...over });
const centre = (s: GameState) => s.playerX + PLAYER_W / 2;

describe('autopilot', () => {
  it('stands still when the game is not running', () => {
    expect(chooseInput(createInitialState())).toMatchObject({ left: false, right: false, fire: false });
  });

  it('slides under the nearest column and fires once aligned', () => {
    const s = running({ playerX: 8, bombTimer: 10_000 });
    const first = chooseInput(s);
    expect(first.right).toBe(true);
    expect(first.fire).toBe(false);
    let t = s;
    for (let i = 0; i < 60 && !chooseInput(t).fire; i += 1) t = runTicks(t, 1, chooseInput);
    expect(Math.abs(aimPoint(t)! - centre(t))).toBeLessThanOrEqual(2);
    expect(chooseInput(t).fire).toBe(true);
  });

  it('steps out from under a bomb that is about to land', () => {
    const s = running({ playerX: 100, bombTimer: 10_000, alive: Array.from({ length: COLS * 5 }, (_, i) => i === 5) });
    const bomb = { x: 105, y: PLAYER_Y - 30, kind: 'plunger' as const, age: 0 };
    const threatened = { ...s, bombs: [bomb] };
    expect(ticksToHit(threatened, threatened.playerX)).toBeLessThan(Infinity);
    const move = chooseInput(threatened);
    expect(move.left || move.right).toBe(true);
    // Following the pilot, the cannon survives the bomb.
    const after = runTicks(threatened, 60, chooseInput);
    expect(after.phase).toBe('play');
    expect(after.lives).toBe(3);
  });

  it('clears most of a wave within a minute of play', () => {
    const s = runTicks(running({ seed: 4 }), 60 * 60, chooseInput);
    expect(s.score).toBeGreaterThanOrEqual(400);
    expect(s.wave > 1 || aliveCount(s.alive) <= 25).toBe(true);
  });
});
