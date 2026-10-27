import {
  BUNKER_COUNT,
  CELL_W,
  COLS,
  DYING_TICKS,
  FIELD_W,
  FORMATION_Y0,
  GROUND_Y,
  INVASION_Y,
  MAX_BOMBS,
  MAX_EFFECTS,
  MAX_LIVES,
  MAX_STEP_MS,
  PLAYER_MAX_X,
  PLAYER_MIN_X,
  PLAYER_Y,
  ROWS,
  SHOT_COOLDOWN_TICKS,
  SHOT_TOP_Y,
  UFO_INTERVAL_TICKS,
  UFO_POINTS,
  UFO_SCORE_TICKS,
  UFO_W,
  WAVE_CLEAR_TICKS,
} from './constants';
import { decodeBunker, encodeBunker, isEncodedBunker } from './bunkers';
import type { BombKind, EffectKind, GameState, GameStatus, Phase } from './types';

/**
 * JSON snapshot of a run in progress. The 55 alien flags are stored as a
 * `0`/`1` string and each bunker's 16 × 22 pixel mask as 96 hex digits, so a
 * save stays well under 2 KB.
 */
export type SavedGame = Omit<GameState, 'alive' | 'bunkers'> & {
  alive: string;
  bunkers: string[];
};

export function toSaved(state: GameState): SavedGame {
  return {
    ...state,
    alive: state.alive.map((a) => (a ? '1' : '0')).join(''),
    bunkers: state.bunkers.map(encodeBunker),
  };
}

export function fromSaved(saved: SavedGame): GameState {
  return {
    ...saved,
    shot: saved.shot ? { ...saved.shot } : null,
    ufo: saved.ufo ? { ...saved.ufo } : null,
    bombs: saved.bombs.map((b) => ({ ...b })),
    effects: saved.effects.map((e) => ({ ...e })),
    alive: [...saved.alive].map((c) => c === '1'),
    bunkers: saved.bunkers.map(decodeBunker),
  };
}

/** Only states of a run in progress are ever saved. */
const SAVED_STATUSES: readonly GameStatus[] = ['running', 'paused'];
const PHASES: readonly Phase[] = ['play', 'dying', 'waveClear'];
const BOMB_KINDS: readonly BombKind[] = ['rolling', 'plunger', 'squiggly'];
const EFFECT_KINDS: readonly EffectKind[] = ['alien', 'shot', 'bomb', 'ufo'];

const MAX_SCORE = 100_000_000;
const MAX_WAVE = 10_000;
const MAX_COUNTER = 1_000_000_000;
const MAX_TIMER = 10_000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const intIn = (v: unknown, min: number, max: number): v is number => isInt(v) && v >= min && v <= max;
const numIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isDir = (v: unknown): v is 1 | -1 => v === 1 || v === -1;

function isShot(v: unknown): boolean {
  if (v === null) return true;
  return isObj(v) && intIn(v.x, 0, FIELD_W) && intIn(v.y, SHOT_TOP_Y - 1, PLAYER_Y);
}

function isBomb(v: unknown): boolean {
  return (
    isObj(v) &&
    intIn(v.x, -CELL_W, FIELD_W + CELL_W) &&
    numIn(v.y, 0, GROUND_Y) &&
    BOMB_KINDS.includes(v.kind as BombKind) &&
    intIn(v.age, 0, MAX_COUNTER)
  );
}

function isUfo(v: unknown): boolean {
  if (v === null) return true;
  return isObj(v) && numIn(v.x, -UFO_W - 1, FIELD_W + 1) && isDir(v.dir);
}

function isEffect(v: unknown): boolean {
  return (
    isObj(v) &&
    EFFECT_KINDS.includes(v.kind as EffectKind) &&
    numIn(v.x, -2 * CELL_W, FIELD_W + 2 * CELL_W) &&
    numIn(v.y, -CELL_W, GROUND_Y + CELL_W) &&
    intIn(v.ttl, 1, UFO_SCORE_TICKS) &&
    (v.value === 0 || (UFO_POINTS as readonly unknown[]).includes(v.value))
  );
}

/** Strict guard for a saved session before it is trusted as a `SavedGame`. */
export function isSavedInvaders(v: unknown): v is SavedGame {
  if (!isObj(v)) return false;
  const ok =
    SAVED_STATUSES.includes(v.status as GameStatus) &&
    PHASES.includes(v.phase as Phase) &&
    intIn(v.phaseTicks, 0, Math.max(DYING_TICKS, WAVE_CLEAR_TICKS)) &&
    intIn(v.tick, 0, MAX_COUNTER) &&
    numIn(v.acc, 0, MAX_STEP_MS) &&
    intIn(v.rng, 0, 0xffffffff) &&
    intIn(v.score, 0, MAX_SCORE) &&
    intIn(v.lives, 0, MAX_LIVES) &&
    intIn(v.wave, 1, MAX_WAVE) &&
    typeof v.extraLifeAwarded === 'boolean' &&
    typeof v.invaded === 'boolean' &&
    numIn(v.playerX, PLAYER_MIN_X, PLAYER_MAX_X) &&
    isShot(v.shot) &&
    intIn(v.shotCooldown, 0, SHOT_COOLDOWN_TICKS) &&
    intIn(v.shotsFired, 0, MAX_COUNTER) &&
    typeof v.alive === 'string' &&
    new RegExp(`^[01]{${COLS * ROWS}}$`).test(v.alive) &&
    intIn(v.fx, -COLS * CELL_W, FIELD_W) &&
    intIn(v.fy, FORMATION_Y0, INVASION_Y) &&
    isDir(v.dir) &&
    (v.frame === 0 || v.frame === 1) &&
    intIn(v.marchTimer, 0, MAX_TIMER) &&
    intIn(v.marchNote, 0, MAX_COUNTER) &&
    Array.isArray(v.bombs) &&
    v.bombs.length <= MAX_BOMBS &&
    v.bombs.every(isBomb) &&
    intIn(v.bombTimer, 0, MAX_TIMER) &&
    intIn(v.bombCycle, 0, MAX_COUNTER) &&
    isUfo(v.ufo) &&
    intIn(v.ufoTimer, 0, UFO_INTERVAL_TICKS) &&
    Array.isArray(v.bunkers) &&
    v.bunkers.length === BUNKER_COUNT &&
    v.bunkers.every(isEncodedBunker) &&
    Array.isArray(v.effects) &&
    v.effects.length <= MAX_EFFECTS &&
    v.effects.every(isEffect);
  if (!ok) return false;
  // Cross-field consistency: a state the engine could actually have produced.
  const s = v as unknown as SavedGame;
  if (s.lives === 0 && s.phase !== 'dying') return false;
  if (s.invaded && s.phase !== 'dying') return false;
  if (!s.alive.includes('1') && s.phase !== 'waveClear') return false;
  if (s.phase !== 'play' && s.phaseTicks === 0) return false;
  return true;
}
