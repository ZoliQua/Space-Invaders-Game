import {
  ALIEN_COUNT,
  ALIEN_H,
  CELL_H,
  CELL_W,
  COLS,
  FORMATION_Y0,
  MARCH_BASE_MIN,
  MARCH_BASE_TICKS,
  MARCH_DY,
  MARCH_WAVE_SPEEDUP,
  ROWS,
  WAVE_DROP_CAP,
} from './constants';
import { ALIEN_SPRITES, type Mask } from './sprites';
import type { AlienKind } from './types';

/** Points per alien type (as in the original). */
export const ALIEN_POINTS: Record<AlienKind, number> = { squid: 30, crab: 20, octopus: 10 };

/** Top row: squids; rows 1–2: crabs; rows 3–4: octopuses. */
export function kindForRow(row: number): AlienKind {
  if (row === 0) return 'squid';
  return row <= 2 ? 'crab' : 'octopus';
}

/** Horizontal offset of a sprite inside its 16-pixel cell. */
export function spriteOffset(kind: AlienKind): number {
  return Math.floor((CELL_W - ALIEN_SPRITES[kind][0].w) / 2);
}

export type AlienBox = { index: number; row: number; col: number; kind: AlienKind; x: number; y: number; mask: Mask };

/** Screen box of one alien (whether alive or not). */
export function alienBox(index: number, fx: number, fy: number, frame: 0 | 1): AlienBox {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const kind = kindForRow(row);
  return {
    index,
    row,
    col,
    kind,
    x: fx + col * CELL_W + spriteOffset(kind),
    y: fy + row * CELL_H,
    mask: ALIEN_SPRITES[kind][frame],
  };
}

export const freshFormation = (): boolean[] => Array.from({ length: ALIEN_COUNT }, () => true);

export const aliveCount = (alive: readonly boolean[]): number => alive.reduce((n, a) => n + (a ? 1 : 0), 0);

/** Horizontal sprite extent and lowest bottom edge of the living aliens; null when none are left. */
export function formationBounds(
  alive: readonly boolean[],
  fx: number,
  fy: number,
): { minX: number; maxX: number; bottom: number } | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let bottom = -Infinity;
  for (let i = 0; i < alive.length; i += 1) {
    if (!alive[i]) continue;
    const b = alienBox(i, fx, fy, 0);
    minX = Math.min(minX, b.x);
    maxX = Math.max(maxX, b.x + b.mask.w);
    bottom = Math.max(bottom, b.y + ALIEN_H);
  }
  return minX === Infinity ? null : { minX, maxX, bottom };
}

/** Lowest living alien of a column, or -1. */
export function bottomRowInColumn(alive: readonly boolean[], col: number): number {
  for (let row = ROWS - 1; row >= 0; row -= 1) if (alive[row * COLS + col]) return row;
  return -1;
}

/** Columns that still hold at least one alien. */
export function liveColumns(alive: readonly boolean[]): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c += 1) if (bottomRowInColumn(alive, c) >= 0) cols.push(c);
  return cols;
}

/**
 * Ticks between march beats. The formation speeds up as it thins out (one
 * alien left marches every tick) and every wave starts a little faster.
 */
export function marchInterval(alive: number, wave: number): number {
  const base = Math.max(MARCH_BASE_MIN, MARCH_BASE_TICKS - (wave - 1) * MARCH_WAVE_SPEEDUP);
  return Math.max(1, Math.round((alive * base) / ALIEN_COUNT));
}

/** Formation top for a new wave: one drop lower per wave, capped. */
export function waveStartY(wave: number): number {
  return FORMATION_Y0 + Math.min(Math.max(0, wave - 1), WAVE_DROP_CAP) * MARCH_DY;
}
