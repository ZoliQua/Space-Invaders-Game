import {
  ALIEN_COUNT,
  ALIEN_EXPLOSION_TICKS,
  ALIEN_H,
  BOMB_EXPLOSION_TICKS,
  BOMB_H,
  BOMB_RELOAD_BASE,
  BOMB_RELOAD_JITTER,
  BOMB_RELOAD_MIN,
  BOMB_SPEED,
  BOMB_SPEED_FAST,
  BOMB_W,
  BUNKER_Y,
  CELL_H,
  CELL_W,
  COLS,
  DYING_TICKS,
  EXTRA_LIFE_SCORE,
  FAST_BOMB_ALIENS,
  FIELD_W,
  FORMATION_X0,
  GROUND_Y,
  INVASION_Y,
  MARCH_DX,
  MARCH_DY,
  MAX_BOMBS,
  MAX_EFFECTS,
  MAX_LIVES,
  MAX_STEP_MS,
  PLAYER_MAX_X,
  PLAYER_MIN_X,
  PLAYER_SPEED,
  PLAYER_START_X,
  PLAYER_Y,
  RESPAWN_BOMB_GRACE,
  ROWS,
  SHOT_COOLDOWN_TICKS,
  SHOT_EXPLOSION_TICKS,
  SHOT_H,
  SHOT_SPEED,
  SHOT_TOP_Y,
  SIDE_MARGIN,
  START_LIVES,
  TICK_MS,
  UFO_INTERVAL_TICKS,
  UFO_MIN_ALIENS,
  UFO_POINTS,
  UFO_SCORE_TICKS,
  UFO_SPEED,
  UFO_W,
  UFO_WEIGHTS,
  UFO_Y,
  WAVE_CLEAR_TICKS,
} from './constants';
import { bunkerHit, bunkerPixel, erodeBunkers, freshBunkers } from './bunkers';
import {
  ALIEN_POINTS,
  alienBox,
  aliveCount,
  bottomRowInColumn,
  formationBounds,
  freshFormation,
  liveColumns,
  marchInterval,
  waveStartY,
} from './formation';
import { makeRng, weightedIndex, type Rng } from './rng';
import {
  BOMB_EXPLOSION,
  bombSprite,
  masksOverlap,
  maskPixel,
  PLAYER_SPRITE,
  rectMask,
  SHOT_EXPLOSION,
  SHOT_SPRITE,
  UFO_SPRITE,
} from './sprites';
import type { BombKind, Effect, EffectKind, GameState, Input } from './types';

export const NO_INPUT: Input = { left: false, right: false, fire: false, targetX: null };

const BOMB_ROTATION: readonly BombKind[] = ['rolling', 'plunger', 'squiggly'];
/** Bombs wait this long at the start of a wave. */
const FIRST_BOMB_DELAY = 90;

/** Everything that is reset when a new wave marches in. */
function waveSetup(wave: number) {
  return {
    alive: freshFormation(),
    fx: FORMATION_X0,
    fy: waveStartY(wave),
    dir: 1 as const,
    frame: 0 as const,
    marchTimer: marchInterval(ALIEN_COUNT, wave),
    marchNote: 0,
    bombs: [],
    bombTimer: FIRST_BOMB_DELAY,
    bombCycle: 0,
    ufo: null,
    ufoTimer: UFO_INTERVAL_TICKS,
    bunkers: freshBunkers(),
    effects: [],
    shot: null,
    shotCooldown: 0,
  };
}

export type InitOptions = Partial<GameState> & { seed?: number };

/** A fresh run (wave 1 unless overridden). `seed` feeds the deterministic RNG. */
export function createInitialState(opts: InitOptions = {}): GameState {
  const { seed = 1, ...over } = opts;
  const wave = over.wave ?? 1;
  return {
    status: 'idle',
    phase: 'play',
    phaseTicks: 0,
    tick: 0,
    acc: 0,
    rng: seed >>> 0,
    score: 0,
    lives: START_LIVES,
    wave,
    extraLifeAwarded: false,
    invaded: false,
    playerX: PLAYER_START_X,
    shotsFired: 0,
    ...waveSetup(wave),
    ...over,
  };
}

/** Deep-enough copy so a tick can mutate freely without touching the previous state. */
function draft(s: GameState): GameState {
  return {
    ...s,
    shot: s.shot ? { ...s.shot } : null,
    alive: [...s.alive],
    bombs: s.bombs.map((b) => ({ ...b })),
    ufo: s.ufo ? { ...s.ufo } : null,
    bunkers: s.bunkers.map((rows) => [...rows]),
    effects: s.effects.map((e) => ({ ...e })),
  };
}

function addEffect(s: GameState, kind: EffectKind, x: number, y: number, ttl: number, value = 0): void {
  s.effects.push({ kind, x, y, ttl, value } satisfies Effect);
  if (s.effects.length > MAX_EFFECTS) s.effects.splice(0, s.effects.length - MAX_EFFECTS);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function movePlayer(s: GameState, input: Input): void {
  let dx = 0;
  if (typeof input.targetX === 'number' && Number.isFinite(input.targetX)) {
    const d = clamp(input.targetX, PLAYER_MIN_X, PLAYER_MAX_X) - s.playerX;
    dx = Math.sign(d) * Math.min(PLAYER_SPEED, Math.abs(d));
  } else {
    if (input.left) dx -= PLAYER_SPEED;
    if (input.right) dx += PLAYER_SPEED;
  }
  s.playerX = clamp(s.playerX + dx, PLAYER_MIN_X, PLAYER_MAX_X);
}

/** Index of the lowest living alien the shot sprite at (x, y) overlaps, or -1. */
export function alienHitBy(s: GameState, x: number, y: number): number {
  const col = Math.floor((x - s.fx) / CELL_W);
  if (col < 0 || col >= COLS) return -1;
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    const i = row * COLS + col;
    if (!s.alive[i]) continue;
    const b = alienBox(i, s.fx, s.fy, s.frame);
    if (masksOverlap(SHOT_SPRITE, x, y, b.mask, b.x, b.y)) return i;
  }
  return -1;
}

function endShot(s: GameState): void {
  s.shot = null;
  s.shotCooldown = SHOT_COOLDOWN_TICKS;
}

/** Advance the player's shot one pixel at a time so nothing can be tunnelled through. */
function moveShot(s: GameState, rng: Rng): void {
  for (let i = 0; i < SHOT_SPEED && s.shot; i += 1) {
    s.shot.y -= 1;
    const { x, y } = s.shot;

    if (y < SHOT_TOP_Y) {
      addEffect(s, 'shot', x - 3, y, SHOT_EXPLOSION_TICKS);
      endShot(s);
      return;
    }

    const bomb = s.bombs.findIndex((b) => x >= b.x && x < b.x + BOMB_W && y < b.y + BOMB_H && y + SHOT_H > b.y);
    if (bomb >= 0) {
      const b = s.bombs[bomb];
      addEffect(s, 'bomb', b.x - 1, Math.floor(b.y), BOMB_EXPLOSION_TICKS);
      s.bombs.splice(bomb, 1);
      endShot(s);
      return;
    }

    const alien = alienHitBy(s, x, y);
    if (alien >= 0) {
      const b = alienBox(alien, s.fx, s.fy, s.frame);
      s.alive[alien] = false;
      s.score += ALIEN_POINTS[b.kind];
      addEffect(s, 'alien', s.fx + b.col * CELL_W + 1, b.y, ALIEN_EXPLOSION_TICKS);
      endShot(s);
      return;
    }

    if (s.ufo && maskPixel(UFO_SPRITE, x - Math.floor(s.ufo.x), y - UFO_Y)) {
      const value = UFO_POINTS[weightedIndex(rng, UFO_WEIGHTS)];
      s.score += value;
      addEffect(s, 'ufo', Math.floor(s.ufo.x), UFO_Y, UFO_SCORE_TICKS, value);
      s.ufo = null;
      s.ufoTimer = UFO_INTERVAL_TICKS;
      endShot(s);
      return;
    }

    if (bunkerPixel(s.bunkers, x, y)) {
      erodeBunkers(s.bunkers, SHOT_EXPLOSION, x - 3, y - 5);
      endShot(s);
      return;
    }
  }
}

function awardExtraLife(s: GameState): void {
  if (s.extraLifeAwarded || s.score < EXTRA_LIFE_SCORE) return;
  s.extraLifeAwarded = true;
  s.lives = Math.min(MAX_LIVES, s.lives + 1);
}

function killPlayer(s: GameState): void {
  s.lives = Math.max(0, s.lives - 1);
  s.phase = 'dying';
  s.phaseTicks = DYING_TICKS;
  s.shot = null;
  s.bombs = [];
}

/** The aliens reached the cannon row: the run ends after the explosion. */
function land(s: GameState): void {
  killPlayer(s);
  s.lives = 0;
  s.invaded = true;
}

/** Aliens descending into a bunker grind away whatever they overlap. */
function aliensCrushBunkers(s: GameState): void {
  for (let i = 0; i < s.alive.length; i += 1) {
    if (!s.alive[i]) continue;
    const b = alienBox(i, s.fx, s.fy, s.frame);
    if (b.y + ALIEN_H <= BUNKER_Y) continue;
    erodeBunkers(s.bunkers, rectMask(b.mask.w, ALIEN_H), b.x, b.y);
  }
}

/** One march beat: step sideways, or drop and turn at an edge. */
function march(s: GameState): void {
  // The original freezes the whole formation while an alien explodes.
  if (s.effects.some((e) => e.kind === 'alien')) return;
  s.marchTimer -= 1;
  if (s.marchTimer > 0) return;
  const bounds = formationBounds(s.alive, s.fx, s.fy);
  if (!bounds) return;
  const blocked =
    s.dir === 1 ? bounds.maxX + MARCH_DX > FIELD_W - SIDE_MARGIN : bounds.minX - MARCH_DX < SIDE_MARGIN;
  if (blocked) {
    s.fy += MARCH_DY;
    s.dir = s.dir === 1 ? -1 : 1;
  } else {
    s.fx += s.dir * MARCH_DX;
  }
  s.frame = s.frame === 0 ? 1 : 0;
  s.marchNote += 1;
  s.marchTimer = marchInterval(aliveCount(s.alive), s.wave);
  aliensCrushBunkers(s);
  const after = formationBounds(s.alive, s.fx, s.fy);
  if (after && after.bottom >= INVASION_Y) land(s);
}

export function bombSpeed(s: GameState): number {
  if (aliveCount(s.alive) < FAST_BOMB_ALIENS) return BOMB_SPEED_FAST;
  return BOMB_SPEED + Math.min(0.25, (s.wave - 1) * 0.05);
}

/** Bombs fall in ≤ 1 px sub-steps: cannon, bunkers, ground. */
function moveBombs(s: GameState): void {
  const speed = bombSpeed(s);
  const keep = [];
  let playerHit = false;
  for (const b of s.bombs) {
    b.age += 1;
    let left = speed;
    let gone = false;
    while (left > 0 && !gone) {
      const d = Math.min(1, left);
      left -= d;
      b.y += d;
      const m = bombSprite(b.kind, b.age);
      if (masksOverlap(m, b.x, b.y, PLAYER_SPRITE, s.playerX, PLAYER_Y)) {
        playerHit = true;
        gone = true;
      } else if (bunkerHit(s.bunkers, m, b.x, b.y) >= 0) {
        erodeBunkers(s.bunkers, BOMB_EXPLOSION, b.x - 1, Math.floor(b.y) + 3);
        gone = true;
      } else if (b.y + BOMB_H >= GROUND_Y) {
        addEffect(s, 'bomb', b.x - 1, GROUND_Y - BOMB_H, BOMB_EXPLOSION_TICKS);
        gone = true;
      }
    }
    if (!gone) keep.push(b);
  }
  s.bombs = keep;
  if (playerHit) killPlayer(s);
}

function bombReload(s: GameState, rng: Rng): number {
  return Math.max(BOMB_RELOAD_MIN, BOMB_RELOAD_BASE - (s.wave - 1) * 3) + rng.int(BOMB_RELOAD_JITTER);
}

/**
 * Drop a bomb from the lowest alien of a column. The rolling bomb aims at the
 * column above the cannon; the other two pick a random living column from the
 * seeded RNG. At most `MAX_BOMBS` are in the air.
 */
function spawnBomb(s: GameState, rng: Rng): void {
  if (s.bombTimer > 0) {
    s.bombTimer -= 1;
    return;
  }
  if (s.bombs.length >= MAX_BOMBS) return;
  const cols = liveColumns(s.alive);
  if (cols.length === 0) return;
  const kind = BOMB_ROTATION[s.bombCycle % BOMB_ROTATION.length];
  let col: number;
  if (kind === 'rolling') {
    const above = Math.floor((s.playerX + PLAYER_SPRITE.w / 2 - s.fx) / CELL_W);
    col = cols.reduce((best, c) => (Math.abs(c - above) < Math.abs(best - above) ? c : best), cols[0]);
  } else {
    col = cols[rng.int(cols.length)];
  }
  const row = bottomRowInColumn(s.alive, col);
  const x = s.fx + col * CELL_W + 7;
  const y = s.fy + row * CELL_H + ALIEN_H;
  s.bombs.push({ x, y, kind, age: 0 });
  s.bombCycle += 1;
  s.bombTimer = bombReload(s, rng);
}

function updateUfo(s: GameState, rng: Rng): void {
  if (s.ufo) {
    s.ufo.x += s.ufo.dir * UFO_SPEED;
    if ((s.ufo.dir === 1 && s.ufo.x > FIELD_W) || (s.ufo.dir === -1 && s.ufo.x < -UFO_W)) {
      s.ufo = null;
      s.ufoTimer = UFO_INTERVAL_TICKS;
    }
    return;
  }
  s.ufoTimer -= 1;
  if (s.ufoTimer > 0) return;
  s.ufoTimer = UFO_INTERVAL_TICKS;
  if (aliveCount(s.alive) < UFO_MIN_ALIENS) return;
  const dir = rng.next() < 0.5 ? 1 : -1;
  s.ufo = { x: dir === 1 ? -UFO_W : FIELD_W, dir };
}

function playTick(s: GameState, input: Input, rng: Rng): void {
  movePlayer(s, input);
  if (s.shotCooldown > 0) s.shotCooldown -= 1;
  if (input.fire && !s.shot && s.shotCooldown === 0) {
    s.shot = { x: Math.floor(s.playerX) + Math.floor(PLAYER_SPRITE.w / 2), y: PLAYER_Y - SHOT_H + 1 };
    s.shotsFired += 1;
  }
  moveShot(s, rng);
  awardExtraLife(s);

  if (aliveCount(s.alive) === 0) {
    s.phase = 'waveClear';
    s.phaseTicks = WAVE_CLEAR_TICKS;
    s.shot = null;
    s.bombs = [];
    s.ufo = null;
    return;
  }

  march(s);
  if (s.phase !== 'play') return;
  moveBombs(s);
  if (s.phase !== 'play') return;
  spawnBomb(s, rng);
  updateUfo(s, rng);
}

/** One fixed 1/60 s simulation tick. Pure: returns a new state, never mutates `prev`. */
export function tick(prev: GameState, input: Input = NO_INPUT): GameState {
  if (prev.status !== 'running') return prev;
  const s = draft(prev);
  const rng = makeRng(s.rng);
  s.tick += 1;
  for (const e of s.effects) e.ttl -= 1;
  s.effects = s.effects.filter((e) => e.ttl > 0);

  if (s.phase === 'dying') {
    s.phaseTicks -= 1;
    if (s.phaseTicks <= 0) {
      if (s.lives <= 0) {
        s.status = 'gameOver';
        s.phaseTicks = 0;
      } else {
        s.phase = 'play';
        s.playerX = PLAYER_START_X;
        s.bombTimer = RESPAWN_BOMB_GRACE;
      }
    }
  } else if (s.phase === 'waveClear') {
    movePlayer(s, input);
    s.phaseTicks -= 1;
    if (s.phaseTicks <= 0) {
      const wave = s.wave + 1;
      Object.assign(s, waveSetup(wave), { wave, phase: 'play', phaseTicks: 0 });
    }
  } else {
    playTick(s, input, rng);
  }

  s.rng = rng.seed();
  return s;
}

/**
 * Advance real time `dtMs` in fixed ticks (the remainder is carried in
 * `acc`). Deterministic for a given state, dt sequence and input. Only a
 * running game moves; `dtMs` is capped at `MAX_STEP_MS`.
 */
export function step(state: GameState, dtMs: number, input: Input = NO_INPUT): GameState {
  if (state.status !== 'running') return state;
  const dt = Number.isFinite(dtMs) ? clamp(dtMs, 0, MAX_STEP_MS) : 0;
  let acc = state.acc + dt;
  let s = state;
  while (acc >= TICK_MS && s.status === 'running') {
    s = tick(s, input);
    acc -= TICK_MS;
  }
  if (s.status !== 'running') acc = 0;
  return s === state && acc === state.acc ? state : { ...s, acc };
}

/** Run `n` ticks, asking `pilot` for the input before each (demo, tests). */
export function runTicks(state: GameState, n: number, pilot: (s: GameState) => Input): GameState {
  let s = state;
  for (let i = 0; i < n && s.status === 'running'; i += 1) s = tick(s, pilot(s));
  return s;
}

export function togglePause(s: GameState): GameState {
  if (s.status === 'running') return { ...s, status: 'paused' };
  if (s.status === 'paused') return { ...s, status: 'running', acc: 0 };
  return s;
}

export { aliveCount };
