/**
 * Every distance is in logical pixels of a fixed 224 × 240 playfield (the
 * original cabinet's 224-pixel width; the score header lives in the StatPanel)
 * and every duration in fixed simulation ticks of 1/60 s.
 */

export const FIELD_W = 224;
export const FIELD_H = 240;

/** One simulation tick (60 Hz). */
export const TICK_MS = 1000 / 60;
/** Upper bound of time a single `step` call simulates (bounds the work per call). */
export const MAX_STEP_MS = 250;
/** Per-frame clamp used by the live loop so a stalled tab never makes the game jump. */
export const MAX_FRAME_MS = 50;

// ─── Formation ───────────────────────────────────────────────
export const COLS = 11;
export const ROWS = 5;
export const ALIEN_COUNT = COLS * ROWS;
/** Grid cell an alien sprite is centred in. */
export const CELL_W = 16;
export const CELL_H = 16;
export const ALIEN_H = 8;
/** Formation origin (top-left cell corner) at the start of a wave. */
export const FORMATION_X0 = 24;
export const FORMATION_Y0 = 44;
/** Each new wave starts one drop lower, up to this many drops. */
export const WAVE_DROP_CAP = 5;
/** Sideways step of one march beat and vertical step at an edge. */
export const MARCH_DX = 2;
export const MARCH_DY = 8;
/** Formation turns when an alien would cross this margin. */
export const SIDE_MARGIN = 8;
/** Ticks between march beats with a full formation in wave 1. */
export const MARCH_BASE_TICKS = 44;
export const MARCH_BASE_MIN = 24;
export const MARCH_WAVE_SPEEDUP = 4;

// ─── Player ──────────────────────────────────────────────────
export const PLAYER_W = 13;
export const PLAYER_H = 8;
export const PLAYER_Y = 200;
export const PLAYER_MIN_X = 8;
export const PLAYER_MAX_X = FIELD_W - 8 - PLAYER_W;
export const PLAYER_START_X = PLAYER_MIN_X + 8;
export const PLAYER_SPEED = 1.25;
export const SHOT_SPEED = 4;
export const SHOT_H = 4;
/** Ticks before the next shot can leave the cannon. */
export const SHOT_COOLDOWN_TICKS = 4;
/** The shot bursts once its tip reaches this line. */
export const SHOT_TOP_Y = 12;
export const START_LIVES = 3;
export const MAX_LIVES = 9;
export const EXTRA_LIFE_SCORE = 1500;

// ─── Bunkers ─────────────────────────────────────────────────
export const BUNKER_COUNT = 4;
export const BUNKER_W = 22;
export const BUNKER_H = 16;
export const BUNKER_Y = 172;
export const BUNKER_X0 = 33;
export const BUNKER_GAP = 45;

// ─── Ground, invasion ────────────────────────────────────────
export const GROUND_Y = 216;
/** An alien whose bottom edge reaches the cannon row has landed. */
export const INVASION_Y = PLAYER_Y;

// ─── Bombs ───────────────────────────────────────────────────
export const BOMB_W = 3;
export const BOMB_H = 8;
export const MAX_BOMBS = 3;
export const BOMB_SPEED = 1;
export const BOMB_SPEED_FAST = 4 / 3;
/** Fewer aliens than this drop the faster bombs. */
export const FAST_BOMB_ALIENS = 9;
export const BOMB_RELOAD_BASE = 40;
export const BOMB_RELOAD_MIN = 12;
export const BOMB_RELOAD_JITTER = 24;

// ─── Mystery UFO ─────────────────────────────────────────────
export const UFO_W = 16;
export const UFO_H = 7;
export const UFO_Y = 20;
export const UFO_SPEED = 0.75;
export const UFO_INTERVAL_TICKS = 25 * 60;
/** No UFO once the formation is this thin (as in the original). */
export const UFO_MIN_ALIENS = 8;
export const UFO_POINTS = [50, 100, 150, 300] as const;
/** Relative odds of each UFO value (50 / 100 / 150 / 300). */
export const UFO_WEIGHTS = [3, 4, 2, 1] as const;

// ─── Timers ──────────────────────────────────────────────────
export const DYING_TICKS = 120;
export const WAVE_CLEAR_TICKS = 120;
export const ALIEN_EXPLOSION_TICKS = 16;
export const SHOT_EXPLOSION_TICKS = 16;
export const BOMB_EXPLOSION_TICKS = 12;
export const UFO_SCORE_TICKS = 60;
export const RESPAWN_BOMB_GRACE = 60;
export const MAX_EFFECTS = 16;
