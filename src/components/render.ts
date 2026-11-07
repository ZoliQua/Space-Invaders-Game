import {
  BUNKER_H,
  BUNKER_W,
  BUNKER_Y,
  FIELD_H,
  FIELD_W,
  GROUND_Y,
  PLAYER_Y,
  SHOT_H,
  UFO_Y,
} from '../logic/constants';
import { bunkerX } from '../logic/bunkers';
import { alienBox } from '../logic/formation';
import {
  ALIEN_EXPLOSION,
  BOMB_EXPLOSION,
  bombSprite,
  PLAYER_EXPLOSION,
  PLAYER_SPRITE,
  SHOT_EXPLOSION,
  UFO_SPRITE,
  type Mask,
} from '../logic/sprites';
import type { GameState } from '../logic/types';

/** Canvas colours, read from the arcade CSS tokens so both themes look right. */
export type Palette = {
  bg: string;
  alien: string;
  squid: string;
  ufo: string;
  player: string;
  shot: string;
  bomb: string;
  text: string;
  dim: string;
};

/** Token each palette entry is read from. */
export const PALETTE_TOKENS: Record<keyof Palette, string> = {
  bg: '--grid-empty',
  alien: '--text-strong',
  squid: '--game-invaders',
  ufo: '--danger',
  player: '--ok',
  shot: '--text-strong',
  bomb: '--text',
  text: '--text',
  dim: '--text-dim',
};

/** Dark-theme values, used when the tokens cannot be read (tests, SSR). */
export const FALLBACK_PALETTE: Palette = {
  bg: '#1c1e2c',
  alien: '#f5f6fa',
  squid: '#b37dff',
  ufo: '#ef4c55',
  player: '#42d392',
  shot: '#f5f6fa',
  bomb: '#d8dae3',
  text: '#d8dae3',
  dim: '#8b8fa1',
};

export function readPalette(el: Element | null): Palette {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return FALLBACK_PALETTE;
  const css = window.getComputedStyle(el);
  const out = { ...FALLBACK_PALETTE };
  for (const key of Object.keys(PALETTE_TOKENS) as (keyof Palette)[]) {
    const v = css.getPropertyValue(PALETTE_TOKENS[key]).trim();
    if (v) out[key] = v;
  }
  return out;
}

/** Fill the set pixels of a sprite, one rectangle per horizontal run. */
export function drawMask(ctx: CanvasRenderingContext2D, m: Mask, x: number, y: number): void {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  for (let r = 0; r < m.h; r += 1) {
    const row = m.rows[r];
    let c = 0;
    while (c < m.w) {
      if ((row & (1 << c)) === 0) {
        c += 1;
        continue;
      }
      let end = c;
      while (end < m.w && (row & (1 << end)) !== 0) end += 1;
      ctx.fillRect(xi + c, yi + r, end - c, 1);
      c = end;
    }
  }
}

function drawBunkers(ctx: CanvasRenderingContext2D, s: GameState): void {
  s.bunkers.forEach((rows, i) => {
    drawMask(ctx, { w: BUNKER_W, h: BUNKER_H, rows }, bunkerX(i), BUNKER_Y);
  });
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, align: CanvasTextAlign = 'center') {
  ctx.font = `700 ${size}px ui-monospace, 'SF Mono', Consolas, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** Canvas captions, already translated by the caller (English by default). */
export type CanvasText = { wave: (n: number) => string; ready: string };

const ENGLISH_TEXT: CanvasText = { wave: (n) => `WAVE ${n}`, ready: 'GET READY' };

export type DrawOptions = { mini?: boolean; text?: CanvasText };

/** Paint one frame in logical (224 × 240) coordinates; the caller sets the scale. */
export function drawGame(ctx: CanvasRenderingContext2D, s: GameState, pal: Palette, opts: DrawOptions = {}): void {
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // Mystery UFO and its score popup.
  if (s.ufo) {
    ctx.fillStyle = pal.ufo;
    drawMask(ctx, UFO_SPRITE, s.ufo.x, UFO_Y);
  }

  // Formation.
  for (let i = 0; i < s.alive.length; i += 1) {
    if (!s.alive[i]) continue;
    const b = alienBox(i, s.fx, s.fy, s.frame);
    ctx.fillStyle = b.kind === 'squid' ? pal.squid : pal.alien;
    drawMask(ctx, b.mask, b.x, b.y);
  }

  // Bunkers, cannon, ground.
  ctx.fillStyle = pal.player;
  drawBunkers(ctx, s);
  if (s.phase === 'dying') {
    if (s.status !== 'gameOver' || s.lives > 0) {
      drawMask(ctx, PLAYER_EXPLOSION[Math.floor(s.tick / 6) % 2], s.playerX, PLAYER_Y);
    }
  } else {
    drawMask(ctx, PLAYER_SPRITE, s.playerX, PLAYER_Y);
  }
  ctx.fillRect(0, GROUND_Y, FIELD_W, 1);

  // Reserve cannons under the ground line (full board only).
  if (!opts.mini) {
    const reserve = Math.max(0, s.lives - (s.phase === 'dying' ? 0 : 1));
    for (let i = 0; i < Math.min(reserve, 8); i += 1) drawMask(ctx, PLAYER_SPRITE, 8 + i * 17, GROUND_Y + 8);
  }

  // Projectiles.
  if (s.shot) {
    ctx.fillStyle = pal.shot;
    ctx.fillRect(s.shot.x, s.shot.y, 1, SHOT_H);
  }
  ctx.fillStyle = pal.bomb;
  for (const b of s.bombs) drawMask(ctx, bombSprite(b.kind, b.age), b.x, b.y);

  // Explosions.
  for (const e of s.effects) {
    if (e.kind === 'alien') {
      ctx.fillStyle = pal.alien;
      drawMask(ctx, ALIEN_EXPLOSION, e.x, e.y);
    } else if (e.kind === 'shot') {
      ctx.fillStyle = pal.ufo;
      drawMask(ctx, SHOT_EXPLOSION, e.x, e.y);
    } else if (e.kind === 'bomb') {
      ctx.fillStyle = pal.bomb;
      drawMask(ctx, BOMB_EXPLOSION, e.x, e.y);
    } else {
      ctx.fillStyle = pal.ufo;
      drawText(ctx, String(e.value), e.x + UFO_SPRITE.w / 2, e.y + 4, 8);
    }
  }

  if (!opts.mini && s.phase === 'waveClear') {
    const text = opts.text ?? ENGLISH_TEXT;
    ctx.fillStyle = pal.text;
    drawText(ctx, text.wave(s.wave + 1), FIELD_W / 2, 110, 12);
    ctx.fillStyle = pal.dim;
    drawText(ctx, text.ready, FIELD_W / 2, 126, 8);
  }
}
