import { describe, expect, it } from 'vitest';
import { BUNKER_Y } from './constants';
import {
  bunkerHit,
  bunkerPixel,
  bunkerPixels,
  bunkerX,
  decodeBunker,
  encodeBunker,
  erodeBunkers,
  freshBunkers,
  isEncodedBunker,
} from './bunkers';
import { makeRng, weightedIndex } from './rng';
import { ALIEN_SPRITES, BUNKER_SPRITE, maskPixel, masksOverlap, parseMask, rectMask } from './sprites';

describe('sprites', () => {
  it('parses ASCII art into row bitmasks', () => {
    const m = parseMask(['#..', '.#.']);
    expect(m).toEqual({ w: 3, h: 2, rows: [0b001, 0b010] });
    expect(maskPixel(m, 0, 0)).toBe(true);
    expect(maskPixel(m, 1, 0)).toBe(false);
    expect(maskPixel(m, 5, 5)).toBe(false);
    expect(() => parseMask(['##', '#'])).toThrow();
  });

  it('every alien has two equally sized march frames', () => {
    for (const [a, b] of Object.values(ALIEN_SPRITES)) {
      expect(a.h).toBe(8);
      expect(b.w).toBe(a.w);
      expect(a.rows).not.toEqual(b.rows);
    }
  });

  it('detects overlap pixel-precisely, not by bounding box', () => {
    const diag = parseMask(['#..', '.#.', '..#']);
    const dot = rectMask(1, 1);
    expect(masksOverlap(diag, 0, 0, dot, 1, 1)).toBe(true);
    expect(masksOverlap(diag, 0, 0, dot, 2, 0)).toBe(false); // inside the box, empty pixel
    expect(masksOverlap(diag, 0, 0, dot, 3, 0)).toBe(false); // outside the box
    expect(masksOverlap(dot, 2, 2, diag, 0, 0)).toBe(true); // negative offset path
    expect(masksOverlap(diag, 10.7, 0, dot, 10, 0)).toBe(true); // positions are floored
  });
});

describe('bunkers', () => {
  it('start as the classic arch and report solid pixels', () => {
    const b = freshBunkers();
    expect(b[0]).toEqual(BUNKER_SPRITE.rows);
    expect(bunkerPixel(b, bunkerX(0) + 10, BUNKER_Y + 5)).toBe(true);
    expect(bunkerPixel(b, bunkerX(0), BUNKER_Y)).toBe(false); // rounded corner
    expect(bunkerPixel(b, bunkerX(0) + 11, BUNKER_Y + 15)).toBe(false); // arch
    expect(bunkerPixel(b, bunkerX(0) - 3, BUNKER_Y + 5)).toBe(false); // between bunkers
  });

  it('erode only the covered pixels of the bunker that was hit', () => {
    const b = freshBunkers();
    const before = bunkerPixels(b[1]);
    const changed = erodeBunkers(b, rectMask(3, 3), bunkerX(1) + 5, BUNKER_Y + 5);
    expect(changed).toBe(true);
    expect(bunkerPixels(b[1])).toBe(before - 9);
    expect(bunkerPixels(b[0])).toBe(bunkerPixels(BUNKER_SPRITE.rows));
    expect(erodeBunkers(b, rectMask(3, 3), bunkerX(1) + 5, BUNKER_Y + 5)).toBe(false);
    expect(bunkerHit(b, rectMask(1, 1), bunkerX(1) + 6, BUNKER_Y + 6)).toBe(-1);
    expect(bunkerHit(b, rectMask(1, 1), bunkerX(1) + 9, BUNKER_Y + 6)).toBe(1);
  });

  it('encode to 96 hex digits and back', () => {
    const b = freshBunkers();
    erodeBunkers(b, rectMask(5, 4), bunkerX(3) + 2, BUNKER_Y + 1);
    const enc = encodeBunker(b[3]);
    expect(enc).toMatch(/^[0-9a-f]{96}$/);
    expect(decodeBunker(enc)).toEqual(b[3]);
    expect(isEncodedBunker(enc)).toBe(true);
    // A pixel outside the original shape (top-left corner) is rejected.
    expect(isEncodedBunker(encodeBunker([1, ...b[3].slice(1)]))).toBe(false);
    expect(isEncodedBunker('zz')).toBe(false);
  });
});

describe('rng', () => {
  it('replays from a seed and keeps its state in one uint32', () => {
    const a = makeRng(42);
    const seq = [a.next(), a.next(), a.int(10)];
    const b = makeRng(42);
    expect([b.next(), b.next(), b.int(10)]).toEqual(seq);
    expect(Number.isInteger(a.seed()) && a.seed() >= 0 && a.seed() <= 0xffffffff).toBe(true);
    const c = makeRng(a.seed());
    expect(c.next()).toBe(a.next());
  });

  it('picks weighted indices in proportion', () => {
    const r = makeRng(5);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 10_000; i += 1) counts[weightedIndex(r, [3, 4, 2, 1])] += 1;
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[0]).toBeGreaterThan(counts[2]);
    expect(counts[2]).toBeGreaterThan(counts[3]);
    expect(counts[3]).toBeGreaterThan(500);
  });
});
