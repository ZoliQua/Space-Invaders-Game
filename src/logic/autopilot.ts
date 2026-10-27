import {
  BOMB_H,
  BOMB_W,
  CELL_W,
  COLS,
  PLAYER_MAX_X,
  PLAYER_MIN_X,
  PLAYER_SPEED,
  PLAYER_H,
  PLAYER_W,
  PLAYER_Y,
  SHOT_SPEED,
  UFO_SPEED,
  UFO_W,
  UFO_Y,
} from './constants';
import { alienBox, aliveCount, bottomRowInColumn, marchInterval } from './formation';
import { bombSpeed, NO_INPUT } from './game';
import type { GameState, Input } from './types';

/** How many ticks ahead the dodge simulates falling bombs. */
const HORIZON = 60;
/** Extra pixels of clearance kept between a bomb and the cannon. */
const PAD = 2;
/** Aiming tolerance (pixels between cannon centre and the predicted target). */
const AIM_TOLERANCE = 2;

const clampX = (x: number) => Math.min(PLAYER_MAX_X, Math.max(PLAYER_MIN_X, x));
const centre = (x: number) => x + PLAYER_W / 2;

/** Cannon position after `k` ticks of heading for `goal` (stopping there). */
function approach(x: number, goal: number, k: number): number {
  const d = goal - x;
  return x + Math.sign(d) * Math.min(Math.abs(d), PLAYER_SPEED * k);
}

/**
 * Ticks until a bomb falling straight down would hit the cannon while it heads
 * for `goal`; Infinity when it stays clear for the whole horizon.
 */
export function ticksToHit(s: GameState, goal: number): number {
  if (s.bombs.length === 0) return Infinity;
  const speed = bombSpeed(s);
  const g = clampX(goal);
  for (let k = 1; k <= HORIZON; k += 1) {
    const px = approach(s.playerX, g, k);
    for (const b of s.bombs) {
      const by = b.y + speed * k;
      if (by + BOMB_H < PLAYER_Y || by > PLAYER_Y + PLAYER_H) continue;
      if (b.x + BOMB_W + PAD > px && b.x - PAD < px + PLAYER_W) return k;
    }
  }
  return Infinity;
}

/**
 * Where the cannon's centre should be to hit something: the UFO when it is
 * close, otherwise the nearest column's lowest alien — both led by how far
 * they move while the shot climbs.
 */
export function aimPoint(s: GameState): number | null {
  const here = centre(s.playerX);
  if (s.ufo) {
    const travel = (PLAYER_Y - UFO_Y) / SHOT_SPEED;
    const ux = s.ufo.x + UFO_W / 2 + s.ufo.dir * UFO_SPEED * travel;
    if (ux > PLAYER_MIN_X && ux < PLAYER_MAX_X + PLAYER_W && Math.abs(ux - here) < 48) return ux;
  }
  const interval = marchInterval(Math.max(1, aliveCount(s.alive)), s.wave);
  let best: number | null = null;
  for (let col = 0; col < COLS; col += 1) {
    const row = bottomRowInColumn(s.alive, col);
    if (row < 0) continue;
    const b = alienBox(row * COLS + col, s.fx, s.fy, s.frame);
    const travel = (PLAYER_Y - b.y) / SHOT_SPEED;
    const lead = s.dir * 2 * (travel / interval);
    const x = s.fx + col * CELL_W + CELL_W / 2 + lead;
    if (best === null || Math.abs(x - here) < Math.abs(best - here)) best = x;
  }
  return best;
}

/**
 * Demo driver using the real rules: slide under the target column and fire
 * when aligned — unless a falling bomb would hit the cannon on the way, in
 * which case head for the safest spot (stay, or run left / right).
 */
export function chooseInput(s: GameState): Input {
  if (s.status !== 'running' || s.phase === 'dying') return NO_INPUT;
  const x = s.playerX;
  const target = aimPoint(s);
  const goals = [target === null ? x : clampX(target - PLAYER_W / 2), x, PLAYER_MIN_X, PLAYER_MAX_X];
  let goal = goals[0];
  let bestTime = -1;
  for (const g of goals) {
    const t = ticksToHit(s, g);
    if (t === Infinity) {
      goal = g;
      break;
    }
    if (t > bestTime) {
      bestTime = t;
      goal = g;
    }
  }
  const d = goal - x;
  const move = Math.abs(d) < PLAYER_SPEED / 2 ? 0 : Math.sign(d);
  const aligned = target !== null && Math.abs(target - centre(x)) <= AIM_TOLERANCE;
  return { left: move < 0, right: move > 0, fire: aligned && s.shot === null, targetX: null };
}
