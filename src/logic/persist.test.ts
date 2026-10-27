import { describe, expect, it } from 'vitest';
import { chooseInput } from './autopilot';
import { createInitialState, runTicks } from './game';
import { fromSaved, isSavedInvaders, toSaved } from './persist';

const midRun = () => runTicks(createInitialState({ status: 'running', seed: 9 }), 60 * 20, chooseInput);

describe('persist', () => {
  it('round-trips a run in progress through a compact JSON save', () => {
    const s = midRun();
    expect(s.score).toBeGreaterThan(0);
    const json = JSON.stringify(toSaved(s));
    expect(json.length).toBeLessThan(2048);
    const parsed: unknown = JSON.parse(json);
    expect(isSavedInvaders(parsed)).toBe(true);
    expect(fromSaved(parsed as ReturnType<typeof toSaved>)).toEqual(s);
  });

  it('rejects garbage and impossible states', () => {
    const good = toSaved(midRun());
    expect(isSavedInvaders(good)).toBe(true);
    const bad: unknown[] = [
      null,
      42,
      [],
      { ...good, status: 'idle' },
      { ...good, alive: '1'.repeat(54) },
      { ...good, alive: 'x'.repeat(55) },
      { ...good, bunkers: good.bunkers.slice(1) },
      { ...good, bunkers: ['f'.repeat(96), ...good.bunkers.slice(1)] },
      { ...good, bombs: Array.from({ length: 4 }, () => ({ x: 50, y: 100, kind: 'plunger', age: 0 })) },
      { ...good, bombs: [{ x: 50, y: 100, kind: 'laser', age: 0 }] },
      { ...good, playerX: Number.NaN },
      { ...good, playerX: 999 },
      { ...good, lives: 0, phase: 'play' },
      { ...good, lives: 12 },
      { ...good, score: -5 },
      { ...good, wave: 0 },
      { ...good, dir: 0 },
      { ...good, rng: 2 ** 33 },
      { ...good, shot: { x: 'a', y: 1 } },
      { ...good, ufo: { x: 10, dir: 2 } },
      { ...good, effects: [{ kind: 'ufo', x: 0, y: 0, ttl: 5, value: 999 }] },
      { ...good, alive: '0'.repeat(55), phase: 'play' },
      { ...good, phase: 'dying', phaseTicks: 0 },
    ];
    for (const b of bad) expect(isSavedInvaders(b)).toBe(false);
  });
});
