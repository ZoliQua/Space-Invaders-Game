/** Mirrors the kit's `ArcadeStatus`; game-specific sub-states live in `Phase`. */
export type GameStatus = 'idle' | 'running' | 'paused' | 'gameOver';

/**
 * What happens while `running`: normal play, the player's cannon exploding
 * (everything else frozen) or the short pause after a wave is wiped out.
 */
export type Phase = 'play' | 'dying' | 'waveClear';

export type AlienKind = 'squid' | 'crab' | 'octopus';
export type BombKind = 'rolling' | 'plunger' | 'squiggly';
export type EffectKind = 'alien' | 'shot' | 'bomb' | 'ufo';

/** The player's laser; (x, y) is its top pixel. */
export type Shot = { x: number; y: number };

/** An alien bomb; (x, y) is the top-left of its 3 × 8 sprite. `y` may be fractional. */
export type Bomb = { x: number; y: number; kind: BombKind; age: number };

export type Ufo = { x: number; dir: 1 | -1 };

/** A short-lived explosion / score popup. `value` holds the UFO's points. */
export type Effect = { kind: EffectKind; x: number; y: number; ttl: number; value: number };

/** Controls held during a tick. `targetX` (pointer drag) steers the cannon's left edge towards a point. */
export type Input = {
  left: boolean;
  right: boolean;
  fire: boolean;
  targetX?: number | null;
};

export type GameState = {
  status: GameStatus;
  phase: Phase;
  /** Countdown of the `dying` / `waveClear` phase. */
  phaseTicks: number;
  /** Ticks simulated in this run. */
  tick: number;
  /** Unsimulated milliseconds carried to the next `step`. */
  acc: number;
  /** Seed of the deterministic RNG (uint32). */
  rng: number;

  score: number;
  /** Cannons left, including the one in play. */
  lives: number;
  wave: number;
  extraLifeAwarded: boolean;
  /** True when the run ended because the aliens landed. */
  invaded: boolean;
  /** The player ended the run with Finish; ranks the current score. */
  finishedEarly?: boolean;

  /** Left edge of the cannon. */
  playerX: number;
  shot: Shot | null;
  shotCooldown: number;
  shotsFired: number;

  /** 55 flags, row-major from the top-left alien. */
  alive: boolean[];
  /** Top-left of the formation grid. */
  fx: number;
  fy: number;
  dir: 1 | -1;
  /** March animation frame. */
  frame: 0 | 1;
  marchTimer: number;
  /** Counts march beats; `% 4` picks the note of the four-note march. */
  marchNote: number;

  bombs: Bomb[];
  bombTimer: number;
  /** Index into the rolling → plunger → squiggly rotation. */
  bombCycle: number;

  ufo: Ufo | null;
  ufoTimer: number;

  /** Four bunkers, each 16 rows of a 22-bit pixel mask (bit x = column x). */
  bunkers: number[][];
  effects: Effect[];
};
