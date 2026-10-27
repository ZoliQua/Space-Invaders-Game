/**
 * Mulberry32 — a tiny, fast, seedable PRNG. The whole generator state is one
 * uint32 kept in `GameState.rng`, so runs replay exactly and survive autosave.
 */
export type Rng = {
  /** Float in [0, 1). */
  next: () => number;
  /** Integer in [0, n). */
  int: (n: number) => number;
  /** Current seed (store it back into the state). */
  seed: () => number;
};

export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n) => Math.floor(next() * n),
    seed: () => s,
  };
}

/** Pick an index with probability proportional to `weights[i]`. */
export function weightedIndex(rng: Rng, weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}
