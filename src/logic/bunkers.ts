import { BUNKER_COUNT, BUNKER_GAP, BUNKER_H, BUNKER_W, BUNKER_X0, BUNKER_Y } from './constants';
import { BUNKER_SPRITE, type Mask } from './sprites';

const FULL_ROW = (1 << BUNKER_W) - 1;
/** Hex digits per encoded bunker row (22 bits → 6 digits). */
const ROW_DIGITS = 6;

export const bunkerX = (i: number): number => BUNKER_X0 + i * BUNKER_GAP;

export const freshBunkers = (): number[][] =>
  Array.from({ length: BUNKER_COUNT }, () => [...BUNKER_SPRITE.rows]);

/** Index of the bunker whose box contains column x, or -1. */
export function bunkerAt(x: number): number {
  const xi = Math.floor(x);
  for (let i = 0; i < BUNKER_COUNT; i += 1) {
    const bx = bunkerX(i);
    if (xi >= bx && xi < bx + BUNKER_W) return i;
  }
  return -1;
}

/** True when the screen pixel (x, y) is solid bunker. */
export function bunkerPixel(bunkers: readonly number[][], x: number, y: number): boolean {
  const i = bunkerAt(x);
  if (i < 0) return false;
  const lx = Math.floor(x) - bunkerX(i);
  const ly = Math.floor(y) - BUNKER_Y;
  if (ly < 0 || ly >= BUNKER_H) return false;
  return (bunkers[i][ly] & (1 << lx)) !== 0;
}

/** Bunker index the sprite at (sx, sy) overlaps pixel-precisely, or -1. */
export function bunkerHit(bunkers: readonly number[][], m: Mask, sx: number, sy: number): number {
  const x = Math.floor(sx);
  const y = Math.floor(sy);
  if (y + m.h <= BUNKER_Y || y >= BUNKER_Y + BUNKER_H) return -1;
  for (let i = 0; i < BUNKER_COUNT; i += 1) {
    const bx = bunkerX(i);
    if (x + m.w <= bx || x >= bx + BUNKER_W) continue;
    const dx = x - bx;
    for (let r = 0; r < m.h; r += 1) {
      const ly = y + r - BUNKER_Y;
      if (ly < 0 || ly >= BUNKER_H) continue;
      const row = m.rows[r];
      const shifted = dx >= 0 ? row << dx : row >>> -dx;
      if ((bunkers[i][ly] & shifted & FULL_ROW) !== 0) return i;
    }
  }
  return -1;
}

/**
 * Clear every bunker pixel covered by a set pixel of `m` placed at (sx, sy).
 * Mutates `bunkers` (callers pass a draft). Returns true if anything changed.
 */
export function erodeBunkers(bunkers: number[][], m: Mask, sx: number, sy: number): boolean {
  const x = Math.floor(sx);
  const y = Math.floor(sy);
  let changed = false;
  for (let i = 0; i < BUNKER_COUNT; i += 1) {
    const bx = bunkerX(i);
    if (x + m.w <= bx || x >= bx + BUNKER_W) continue;
    const dx = x - bx;
    for (let r = 0; r < m.h; r += 1) {
      const ly = y + r - BUNKER_Y;
      if (ly < 0 || ly >= BUNKER_H) continue;
      const row = m.rows[r];
      const shifted = (dx >= 0 ? row << dx : row >>> -dx) & FULL_ROW;
      const before = bunkers[i][ly];
      const after = before & ~shifted & FULL_ROW;
      if (after !== before) {
        bunkers[i][ly] = after;
        changed = true;
      }
    }
  }
  return changed;
}

/** Solid pixels left in one bunker. */
export function bunkerPixels(rows: readonly number[]): number {
  let n = 0;
  for (const row of rows) for (let v = row; v; v &= v - 1) n += 1;
  return n;
}

/** Compact save format: 16 rows × 6 hex digits = 96 characters per bunker. */
export function encodeBunker(rows: readonly number[]): string {
  return rows.map((r) => r.toString(16).padStart(ROW_DIGITS, '0')).join('');
}

export function decodeBunker(s: string): number[] {
  const rows: number[] = [];
  for (let i = 0; i < BUNKER_H; i += 1) rows.push(parseInt(s.slice(i * ROW_DIGITS, (i + 1) * ROW_DIGITS), 16));
  return rows;
}

/** True for a well-formed encoded bunker whose pixels all lie inside the original shape. */
export function isEncodedBunker(v: unknown): v is string {
  if (typeof v !== 'string' || !/^[0-9a-f]{96}$/.test(v)) return false;
  return decodeBunker(v).every((row, y) => (row & ~BUNKER_SPRITE.rows[y]) === 0);
}
