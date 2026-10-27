import { describe, expect, it } from 'vitest';
import {
  ALIEN_COUNT,
  BUNKER_Y,
  COLS,
  DYING_TICKS,
  FIELD_W,
  FORMATION_Y0,
  MARCH_DY,
  MAX_BOMBS,
  PLAYER_MAX_X,
  PLAYER_MIN_X,
  PLAYER_START_X,
  PLAYER_Y,
  TICK_MS,
  UFO_POINTS,
  UFO_Y,
  WAVE_CLEAR_TICKS,
} from './constants';
import { bunkerPixels, bunkerX, freshBunkers } from './bunkers';
import { ALIEN_POINTS, alienBox, aliveCount, formationBounds, marchInterval, waveStartY } from './formation';
import { NO_INPUT, createInitialState, runTicks, step, tick, togglePause } from './game';
import type { GameState, Input } from './types';

const running = (over: Partial<GameState> & { seed?: number } = {}) =>
  createInitialState({ status: 'running', ...over });
const input = (over: Partial<Input> = {}): Input => ({ ...NO_INPUT, ...over });
/** Formation with only the listed aliens alive. */
const onlyAlive = (...indices: number[]) => Array.from({ length: ALIEN_COUNT }, (_, i) => indices.includes(i));
/** Keep the formation from marching / bombing during a focused test. */
const calm = { marchTimer: 10_000, bombTimer: 10_000, ufoTimer: 10_000 };

describe('createInitialState', () => {
  it('sets up the classic 5 × 11 formation, three cannons and four bunkers', () => {
    const s = createInitialState();
    expect(s.status).toBe('idle');
    expect(aliveCount(s.alive)).toBe(55);
    expect(s.lives).toBe(3);
    expect(s.wave).toBe(1);
    expect(s.fy).toBe(FORMATION_Y0);
    expect(s.bunkers).toHaveLength(4);
    expect(s.bunkers).toEqual(freshBunkers());
    expect(alienBox(0, s.fx, s.fy, 0).kind).toBe('squid');
    expect(alienBox(COLS, s.fx, s.fy, 0).kind).toBe('crab');
    expect(alienBox(4 * COLS, s.fx, s.fy, 0).kind).toBe('octopus');
  });
});

describe('step (fixed timestep)', () => {
  it('does nothing unless running', () => {
    const idle = createInitialState();
    expect(step(idle, 100, input({ left: true }))).toBe(idle);
    const paused = togglePause(running());
    expect(paused.status).toBe('paused');
    expect(step(paused, 100)).toBe(paused);
  });

  it('carries the sub-tick remainder and caps huge frames', () => {
    const a = step(running(), 10);
    expect(a.tick).toBe(0);
    expect(a.acc).toBe(10);
    const b = step(a, 10);
    expect(b.tick).toBe(1);
    expect(b.acc).toBeCloseTo(20 - TICK_MS);
    // A stalled tab handing in 10 s simulates at most MAX_STEP_MS (15 ticks).
    expect(step(running(), 10_000).tick).toBe(15);
    expect(step(running(), Number.NaN).tick).toBe(0);
  });

  it('is deterministic for a seed and input sequence, and never mutates its input', () => {
    const play = (seed: number) => {
      let s = running({ seed });
      for (let i = 0; i < 600; i += 1) s = step(s, 16, input({ fire: i % 30 < 15, right: i % 200 < 100 }));
      return s;
    };
    expect(JSON.stringify(play(7))).toBe(JSON.stringify(play(7)));
    expect(JSON.stringify(play(7))).not.toBe(JSON.stringify(play(8)));
    const s = running();
    const snapshot = JSON.stringify(s);
    tick(s, input({ fire: true, left: true }));
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

describe('player', () => {
  it('moves left / right and stays on the field', () => {
    const s = running({ ...calm });
    expect(tick(s, input({ right: true })).playerX).toBeGreaterThan(s.playerX);
    expect(runTicks(s, 400, () => input({ left: true })).playerX).toBe(PLAYER_MIN_X);
    expect(runTicks(s, 400, () => input({ right: true })).playerX).toBe(PLAYER_MAX_X);
  });

  it('steers towards a pointer target', () => {
    const s = runTicks(running({ ...calm }), 200, () => input({ targetX: 100 }));
    expect(s.playerX).toBe(100);
  });

  it('allows only one shot on screen at a time', () => {
    const s = runTicks(running({ ...calm }), 20, () => input({ fire: true }));
    expect(s.shotsFired).toBe(1);
    expect(s.shot).not.toBeNull();
  });
});

describe('shots vs aliens', () => {
  /** A state whose shot sits just below alien `index`, about to hit it. */
  function aimedAt(index: number, alive = onlyAlive(index, 0, 54)): GameState {
    const s = running({ ...calm, alive });
    const b = alienBox(index, s.fx, s.fy, s.frame);
    return { ...s, shot: { x: b.x + Math.floor(b.mask.w / 2), y: b.y + 9 } };
  }

  it.each([
    ['octopus', 4 * COLS + 5],
    ['crab', 2 * COLS + 5],
    ['squid', 5],
  ] as const)('scores a %s by its type', (kind, index) => {
    const next = runTicks(aimedAt(index), 2, () => NO_INPUT);
    expect(next.alive[index]).toBe(false);
    expect(next.score).toBe(ALIEN_POINTS[kind]);
    expect(next.shot).toBeNull();
    expect(next.effects.some((e) => e.kind === 'alien')).toBe(true);
  });

  it('hits the lowest alien of a column first', () => {
    const next = runTicks(aimedAt(4 * COLS + 3, onlyAlive(3, 4 * COLS + 3)), 2, () => NO_INPUT);
    expect(next.alive[4 * COLS + 3]).toBe(false);
    expect(next.alive[3]).toBe(true);
  });

  it('misses through the gaps between aliens (pixel-precise)', () => {
    const s = running({ ...calm, alive: onlyAlive(4 * COLS + 5) });
    const b = alienBox(4 * COLS + 5, s.fx, s.fy, s.frame);
    // Just right of the octopus sprite, inside its 16-pixel cell.
    const miss = { ...s, shot: { x: b.x + b.mask.w + 1, y: b.y + 9 } };
    const next = runTicks(miss, 6, () => NO_INPUT);
    expect(next.alive[4 * COLS + 5]).toBe(true);
    expect(next.shot).not.toBeNull();
  });

  it('freezes the march while an alien explodes', () => {
    const s = { ...aimedAt(4 * COLS + 5, onlyAlive(4 * COLS + 5, 0, 1)), marchTimer: 3 };
    const next = runTicks(s, 10, () => NO_INPUT);
    expect(next.fx).toBe(s.fx);
    expect(next.effects.some((e) => e.kind === 'alien')).toBe(true);
  });
});

describe('formation march', () => {
  it('steps sideways on each beat and animates', () => {
    const s = running({ marchTimer: 1, bombTimer: 10_000 });
    const next = tick(s);
    expect(next.fx).toBe(s.fx + 2);
    expect(next.frame).toBe(1);
    expect(next.marchNote).toBe(1);
  });

  it('drops a row and turns around at the edge', () => {
    const s = running({ marchTimer: 1, bombTimer: 10_000 });
    const bounds = formationBounds(s.alive, s.fx, s.fy)!;
    const atEdge = { ...s, fx: s.fx + (FIELD_W - 8 - bounds.maxX) };
    const next = tick(atEdge);
    expect(next.fy).toBe(s.fy + MARCH_DY);
    expect(next.dir).toBe(-1);
    expect(next.fx).toBe(atEdge.fx);
  });

  it('speeds up as aliens fall and with each wave', () => {
    expect(marchInterval(55, 1)).toBeGreaterThan(marchInterval(20, 1));
    expect(marchInterval(20, 1)).toBeGreaterThan(marchInterval(2, 1));
    expect(marchInterval(1, 1)).toBe(1);
    expect(marchInterval(55, 4)).toBeLessThan(marchInterval(55, 1));
  });

  it('crushes bunkers it walks into', () => {
    const s = running({ marchTimer: 1, bombTimer: 10_000, alive: onlyAlive(4 * COLS) });
    // Park the octopus right on top of bunker 0.
    const fy = BUNKER_Y - 4 * 16 + 2;
    const fx = bunkerX(0) - 2;
    const next = tick({ ...s, fx, fy });
    expect(bunkerPixels(next.bunkers[0])).toBeLessThan(bunkerPixels(s.bunkers[0]));
  });

  it('ends the run when the aliens land on the cannon row', () => {
    const s = running({ marchTimer: 1, bombTimer: 10_000, lives: 3 });
    const bounds = formationBounds(s.alive, s.fx, s.fy)!;
    const low = { ...s, fy: s.fy + (PLAYER_Y - bounds.bottom) - MARCH_DY, fx: s.fx + (FIELD_W - 8 - bounds.maxX) };
    const landed = tick(low);
    expect(landed.invaded).toBe(true);
    expect(landed.lives).toBe(0);
    expect(landed.phase).toBe('dying');
    expect(runTicks(landed, DYING_TICKS + 1, () => NO_INPUT).status).toBe('gameOver');
  });
});

describe('bombs', () => {
  it('kill the cannon: lives drop, bombs clear, the cannon respawns', () => {
    const s = running({ ...calm, playerX: 100 });
    const hit = tick({ ...s, bombs: [{ x: 105, y: PLAYER_Y - 8, kind: 'plunger', age: 0 }] });
    expect(hit.phase).toBe('dying');
    expect(hit.lives).toBe(2);
    expect(hit.bombs).toEqual([]);
    const back = runTicks(hit, DYING_TICKS, () => NO_INPUT);
    expect(back.phase).toBe('play');
    expect(back.playerX).toBe(PLAYER_START_X);
    expect(back.status).toBe('running');
  });

  it('end the game on the last cannon', () => {
    const s = running({ ...calm, lives: 1, playerX: 100 });
    const hit = tick({ ...s, bombs: [{ x: 105, y: PLAYER_Y - 8, kind: 'rolling', age: 0 }] });
    expect(hit.lives).toBe(0);
    const over = runTicks(hit, DYING_TICKS + 5, () => NO_INPUT);
    expect(over.status).toBe('gameOver');
    expect(over.invaded).toBe(false);
  });

  it('erode bunkers from above and disappear', () => {
    const s = running({ ...calm });
    const x = bunkerX(1) + 10;
    const next = runTicks({ ...s, bombs: [{ x, y: BUNKER_Y - 9, kind: 'squiggly', age: 0 }] }, 4, () => NO_INPUT);
    expect(next.bombs).toHaveLength(0);
    expect(bunkerPixels(next.bunkers[1])).toBeLessThan(bunkerPixels(s.bunkers[1]));
  });

  it('are shot down by the player', () => {
    const s = running({ ...calm });
    const next = tick({ ...s, shot: { x: 51, y: 120 }, bombs: [{ x: 50, y: 112, kind: 'plunger', age: 0 }] });
    expect(next.bombs).toHaveLength(0);
    expect(next.shot).toBeNull();
  });

  it(`never exceed ${MAX_BOMBS} in the air; the rolling bomb aims at the cannon`, () => {
    let s = running({ seed: 3, bombTimer: 0, marchTimer: 10_000, ufoTimer: 10_000, playerX: 150 });
    s = tick(s);
    expect(s.bombs).toHaveLength(1);
    expect(s.bombs[0].kind).toBe('rolling');
    const col = Math.floor((s.bombs[0].x - s.fx) / 16);
    expect(col).toBe(Math.floor((150 + 6.5 - s.fx) / 16));
    let max = 0;
    for (let i = 0; i < 200; i += 1) {
      // Reload instantly; park the cannon in a corner, out of the way.
      s = tick({ ...s, bombTimer: 0, playerX: 8 });
      max = Math.max(max, s.bombs.length);
    }
    expect(max).toBe(MAX_BOMBS);
  });
});

describe('player shots vs bunkers', () => {
  it('chip pixels out of a bunker from below', () => {
    const s = running({ ...calm });
    const x = bunkerX(2) + 11;
    const next = runTicks({ ...s, shot: { x, y: BUNKER_Y + 20 } }, 8, () => NO_INPUT);
    expect(next.shot).toBeNull();
    expect(bunkerPixels(next.bunkers[2])).toBeLessThan(bunkerPixels(s.bunkers[2]));
  });
});

describe('mystery UFO', () => {
  it('appears on its timer, crosses the top and scores a seeded value when hit', () => {
    const s = running({ marchTimer: 10_000, bombTimer: 10_000, ufoTimer: 1, seed: 11 });
    const flying = tick(s);
    expect(flying.ufo).not.toBeNull();
    const ufo = flying.ufo!;
    const hitMe = { ...flying, ufo: { ...ufo, x: 100 }, shot: { x: 108, y: UFO_Y + 9 } };
    const hit = runTicks(hitMe, 3, () => NO_INPUT);
    expect(hit.ufo).toBeNull();
    expect(UFO_POINTS).toContain(hit.score);
    expect(hit.effects.find((e) => e.kind === 'ufo')?.value).toBe(hit.score);
    // Same seed → same value.
    expect(runTicks(hitMe, 3, () => NO_INPUT).score).toBe(hit.score);
  });

  it('flies off the far side when missed', () => {
    const s = running({ ...calm, ufo: { x: FIELD_W - 1, dir: 1 } });
    expect(runTicks(s, 4, () => NO_INPUT).ufo).toBeNull();
  });
});

describe('lives, waves', () => {
  it('awards one extra cannon at 1500 points', () => {
    const s = running({ ...calm, score: 1490, alive: onlyAlive(4 * COLS + 5, 0) });
    const b = alienBox(4 * COLS + 5, s.fx, s.fy, s.frame);
    const next = runTicks({ ...s, shot: { x: b.x + 6, y: b.y + 9 } }, 2, () => NO_INPUT);
    expect(next.score).toBe(1500);
    expect(next.lives).toBe(4);
    expect(next.extraLifeAwarded).toBe(true);
    const later = runTicks({ ...next, score: 3000, shot: { x: 0, y: 100 } }, 1, () => NO_INPUT);
    expect(later.lives).toBe(4);
  });

  it('clears a wave, then marches the next one in lower with fresh bunkers', () => {
    const s = running({ ...calm, alive: onlyAlive(4 * COLS + 5) });
    const b = alienBox(4 * COLS + 5, s.fx, s.fy, s.frame);
    const damaged = s.bunkers.map((rows) => rows.map(() => 0));
    const cleared = runTicks({ ...s, bunkers: damaged, shot: { x: b.x + 6, y: b.y + 9 } }, 2, () => NO_INPUT);
    expect(cleared.phase).toBe('waveClear');
    const next = runTicks(cleared, WAVE_CLEAR_TICKS, () => NO_INPUT);
    expect(next.phase).toBe('play');
    expect(next.wave).toBe(2);
    expect(next.fy).toBe(waveStartY(2));
    expect(next.fy).toBeGreaterThan(FORMATION_Y0);
    expect(aliveCount(next.alive)).toBe(55);
    expect(next.bunkers).toEqual(freshBunkers());
    expect(next.score).toBe(10);
  });

  it('caps how low a new wave starts', () => {
    expect(waveStartY(1)).toBe(FORMATION_Y0);
    expect(waveStartY(6)).toBe(waveStartY(60));
  });
});
