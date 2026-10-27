import type { AlienKind, BombKind } from './types';

/**
 * A 1-bit sprite. `rows[y]` is a bitmask where bit `x` is the pixel in column
 * `x` (leftmost = bit 0). Widths stay below 31 so plain JS integer bit-ops work.
 */
export type Mask = { w: number; h: number; rows: number[] };

export function parseMask(art: readonly string[]): Mask {
  const w = art[0]?.length ?? 0;
  const rows = art.map((line) => {
    if (line.length !== w) throw new Error('Ragged sprite');
    let bits = 0;
    for (let x = 0; x < w; x += 1) if (line[x] === '#') bits |= 1 << x;
    return bits;
  });
  return { w, h: rows.length, rows };
}

/** A solid w × h rectangle. */
export function rectMask(w: number, h: number): Mask {
  const full = (1 << w) - 1;
  return { w, h, rows: Array.from({ length: h }, () => full) };
}

/** True when the sprite has a set pixel at local (x, y). */
export function maskPixel(m: Mask, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
  return (m.rows[y] & (1 << x)) !== 0;
}

/**
 * Pixel-precise overlap of sprite `a` placed at (ax, ay) and `b` at (bx, by).
 * Positions are floored to whole pixels.
 */
export function masksOverlap(a: Mask, ax: number, ay: number, b: Mask, bx: number, by: number): boolean {
  const axi = Math.floor(ax);
  const ayi = Math.floor(ay);
  const bxi = Math.floor(bx);
  const byi = Math.floor(by);
  if (axi >= bxi + b.w || bxi >= axi + a.w || ayi >= byi + b.h || byi >= ayi + a.h) return false;
  const dx = bxi - axi;
  const top = Math.max(ayi, byi);
  const bottom = Math.min(ayi + a.h, byi + b.h);
  for (let y = top; y < bottom; y += 1) {
    const ra = a.rows[y - ayi];
    const rb = b.rows[y - byi];
    const hit = dx >= 0 ? (ra >>> dx) & rb : ra & (rb >>> -dx);
    if (hit !== 0) return true;
  }
  return false;
}

// ─── Aliens (two march frames each) ──────────────────────────
const SQUID = [
  ['...##...', '..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.', '#.#..#.#'],
  ['...##...', '..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.'],
];
const CRAB = [
  ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
  ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.'],
];
const OCTOPUS = [
  ['....####....', '.##########.', '############', '###..##..###', '############', '...##..##...', '..##.##.##..', '##........##'],
  ['....####....', '.##########.', '############', '###..##..###', '############', '..###..###..', '.##..##..##.', '..##....##..'],
];

export const ALIEN_SPRITES: Record<AlienKind, readonly [Mask, Mask]> = {
  squid: [parseMask(SQUID[0]), parseMask(SQUID[1])],
  crab: [parseMask(CRAB[0]), parseMask(CRAB[1])],
  octopus: [parseMask(OCTOPUS[0]), parseMask(OCTOPUS[1])],
};

export const PLAYER_SPRITE = parseMask([
  '......#......',
  '.....###.....',
  '.....###.....',
  '.###########.',
  '#############',
  '#############',
  '#############',
  '#############',
]);

/** Debris shown while the cannon explodes (two alternating frames). */
export const PLAYER_EXPLOSION = [
  parseMask([
    '....#....#...',
    '..#....#.....',
    '....##.#..#..',
    '.#..#.#......',
    '...######.#..',
    '..#########..',
    '.###########.',
    '#############',
  ]),
  parseMask([
    '#.....#....#.',
    '...#......#..',
    '.#...#.#.....',
    '....#..#..#..',
    '..#.####.....',
    '.##.#####.#..',
    '.#####.####..',
    '###########.#',
  ]),
] as const;

export const UFO_SPRITE = parseMask([
  '.....######.....',
  '...##########...',
  '..############..',
  '.##.##.##.##.##.',
  '################',
  '..###..##..###..',
  '...#........#...',
]);

export const ALIEN_EXPLOSION = parseMask([
  '....#...#....',
  '.#...#.#...#.',
  '..#.......#..',
  '...#.....#...',
  '##.........##',
  '...#.....#...',
  '..#..#.#..#..',
  '.#..#...#..#.',
]);

/** Burst of the player's shot (at the top, or eroding a bunker). */
export const SHOT_EXPLOSION = parseMask([
  '#...#..#',
  '..#...#.',
  '.######.',
  '########',
  '########',
  '.######.',
  '..#..#..',
  '#..#...#',
]);

/** Burst of an alien bomb (on the ground, or eroding a bunker). */
export const BOMB_EXPLOSION = parseMask([
  '..#...',
  '#...#.',
  '..##.#',
  '.####.',
  '#.###.',
  '.#####',
  '#.###.',
  '.#.#.#',
]);

export const SHOT_SPRITE = rectMask(1, 4);

function squigglyFrame(f: number): string[] {
  const pattern = [0, 1, 2, 1];
  return Array.from({ length: 8 }, (_, r) => {
    const col = pattern[(r + f) % 4];
    return ['.', '.', '.'].map((_c, i) => (i === col ? '#' : '.')).join('');
  });
}

/** Four animation frames per bomb type, each 3 × 8. */
export const BOMB_SPRITES: Record<BombKind, readonly Mask[]> = {
  rolling: [
    ['.#.', '.#.', '##.', '.#.', '.#.', '.##', '.#.', '.#.'],
    ['.#.', '.##', '.#.', '.#.', '##.', '.#.', '.#.', '.#.'],
    ['.#.', '.#.', '.##', '.#.', '.#.', '##.', '.#.', '.#.'],
    ['##.', '.#.', '.#.', '.##', '.#.', '.#.', '.#.', '.#.'],
  ].map(parseMask),
  plunger: [
    ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '.#.', '.#.'],
    ['.#.', '.#.', '###', '.#.', '.#.', '.#.', '.#.', '.#.'],
    ['.#.', '.#.', '.#.', '.#.', '###', '.#.', '.#.', '.#.'],
    ['.#.', '.#.', '.#.', '.#.', '.#.', '.#.', '###', '.#.'],
  ].map(parseMask),
  squiggly: [0, 1, 2, 3].map((f) => parseMask(squigglyFrame(f))),
};

/** Bombs animate one frame every this many ticks. */
export const BOMB_FRAME_TICKS = 4;

export function bombSprite(kind: BombKind, age: number): Mask {
  const frames = BOMB_SPRITES[kind];
  return frames[Math.floor(age / BOMB_FRAME_TICKS) % frames.length];
}

export const BUNKER_SPRITE = parseMask([
  '....##############....',
  '...################...',
  '..##################..',
  '.####################.',
  '######################',
  '######################',
  '######################',
  '######################',
  '######################',
  '######################',
  '######################',
  '######################',
  '#######........#######',
  '######..........######',
  '#####............#####',
  '#####............#####',
]);
