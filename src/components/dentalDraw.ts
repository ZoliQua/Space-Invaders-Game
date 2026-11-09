import { BUNKER_H, BUNKER_W } from '../logic/constants';
import { BUNKER_SPRITE } from '../logic/sprites';
import type { AlienKind } from '../logic/types';

/**
 * Dental-mode artwork for the canvas: germs instead of aliens, a toothbrush
 * cannon, toothpaste shots and tooth bunkers. Presentation only — every shape
 * is drawn inside the box of the mask it replaces, and bunkers are painted
 * pixel for pixel from the live mask, so what you see is still the hit box.
 *
 * The germs are drawn through a tiny `Pen` (a subset of the 2D context) so the
 * same code also produces the SVG icons of the points legend.
 */
export type Pen = {
  fillStyle: unknown;
  strokeStyle: unknown;
  lineWidth: number;
  lineCap: CanvasLineCap;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  ellipse(x: number, y: number, rx: number, ry: number, rotation: number, a0: number, a1: number): void;
  fill(): void;
  stroke(): void;
};

/** Fixed dental colours (identity colours that read on both arcade themes). */
export const DENTAL_COLORS = {
  enamel: '#eef1f6',
  enamelEdge: '#8d96a8',
  fissure: '#9aa3b5',
  root: '#e4d8b6',
  rootEdge: '#a8936a',
  caries: '#5a3d22',
  stain: '#b58a55',
  paste: '#e9f6ff',
  pasteStripe: '#2fb87c',
  handle: '#6b8cff',
  bristle: '#e9f6ff',
  bristleLine: '#8d96a8',
  eye: '#ffffff',
  pupil: '#1b1d27',
  bacillus: '#f08c3a',
  amoeba: '#3fb27f',
} as const;

/** Germ type per alien row type — three different silhouettes. */
export type GermKind = 'coccus' | 'bacillus' | 'amoeba';
export const GERM_FOR: Record<AlienKind, GermKind> = { squid: 'coccus', crab: 'bacillus', octopus: 'amoeba' };

const TAU = Math.PI * 2;

function circle(p: Pen, x: number, y: number, r: number, fill: string): void {
  p.fillStyle = fill;
  p.beginPath();
  p.arc(x, y, r, 0, TAU);
  p.fill();
}

function eyes(p: Pen, cx: number, cy: number, spread: number): void {
  for (const dx of [-spread, spread]) {
    circle(p, cx + dx, cy, 0.85, DENTAL_COLORS.eye);
    circle(p, cx + dx, cy + 0.2, 0.42, DENTAL_COLORS.pupil);
  }
}

/** Round, spiky germ (8 × 8 box). The spikes turn on every march step. */
function coccus(p: Pen, x: number, y: number, frame: 0 | 1, body: string): void {
  const cx = x + 4;
  const cy = y + 4;
  p.strokeStyle = body;
  p.lineWidth = 0.75;
  p.lineCap = 'round';
  for (let k = 0; k < 8; k += 1) {
    const a = (k * Math.PI) / 4 + (frame ? Math.PI / 8 : 0);
    p.beginPath();
    p.moveTo(cx + Math.cos(a) * 2, cy + Math.sin(a) * 2);
    p.lineTo(cx + Math.cos(a) * 3.4, cy + Math.sin(a) * 3.4);
    p.stroke();
    circle(p, cx + Math.cos(a) * 3.4, cy + Math.sin(a) * 3.4, 0.55, body);
  }
  circle(p, cx, cy, 2.6, body);
  eyes(p, cx, cy - 0.3, 1.05);
}

/** Rod-shaped germ with waving hairs (11 × 8 box). */
function bacillus(p: Pen, x: number, y: number, frame: 0 | 1, body: string): void {
  const top = y + 1.9;
  const bottom = y + 6.1;
  const r = 2.1;
  const sway = frame ? 0.8 : -0.8;
  p.strokeStyle = body;
  p.lineWidth = 0.6;
  p.lineCap = 'round';
  for (const hx of [x + 2.6, x + 5.5, x + 8.4]) {
    p.beginPath();
    p.moveTo(hx, top);
    p.lineTo(hx + sway, y + 0.3);
    p.moveTo(hx, bottom);
    p.lineTo(hx - sway, y + 7.7);
    p.stroke();
  }
  p.fillStyle = body;
  p.beginPath();
  p.moveTo(x + 2.6, top);
  p.lineTo(x + 8.4, top);
  p.arc(x + 8.4, y + 4, r, -Math.PI / 2, Math.PI / 2);
  p.lineTo(x + 2.6, bottom);
  p.arc(x + 2.6, y + 4, r, Math.PI / 2, (3 * Math.PI) / 2);
  p.closePath();
  p.fill();
  eyes(p, x + 5.5, y + 3.8, 1.15);
}

/** Blobby germ: a dome with four stepping feet (12 × 8 box). */
function amoeba(p: Pen, x: number, y: number, frame: 0 | 1, body: string): void {
  const base = y + 4.6;
  const step = 11.2 / 4;
  const shift = frame ? 0.55 : -0.55;
  p.fillStyle = body;
  p.beginPath();
  p.ellipse(x + 6, base, 5.6, 4.2, 0, Math.PI, TAU);
  let px = x + 11.6;
  for (let i = 0; i < 4; i += 1) {
    p.quadraticCurveTo(px - step / 2 + shift, y + 10.2, px - step, base);
    px -= step;
  }
  p.closePath();
  p.fill();
  eyes(p, x + 6, y + 3.4, 1.4);
}

const GERMS: Record<GermKind, (p: Pen, x: number, y: number, frame: 0 | 1, body: string) => void> = {
  coccus,
  bacillus,
  amoeba,
};

/** Germ colour per kind; the coccus (the 30-point row) keeps the game colour. */
export function germColor(kind: GermKind, squid: string): string {
  if (kind === 'coccus') return squid;
  return kind === 'bacillus' ? DENTAL_COLORS.bacillus : DENTAL_COLORS.amoeba;
}

export function drawGerm(p: Pen, kind: GermKind, x: number, y: number, frame: 0 | 1, body: string): void {
  GERMS[kind](p, x, y, frame, body);
}

/** Upright toothbrush in the 13 × 8 cannon box: handle as the base, bristle head on top. */
export function drawToothbrush(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const c = DENTAL_COLORS;
  ctx.fillStyle = c.handle;
  ctx.beginPath();
  ctx.moveTo(x + 1.6, y + 5);
  ctx.lineTo(x + 11.4, y + 5);
  ctx.arc(x + 11.4, y + 6.5, 1.5, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + 1.6, y + 8);
  ctx.arc(x + 1.6, y + 6.5, 1.5, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x + 5.5, y + 3, 2, 2.2);
  ctx.fillStyle = c.bristle;
  ctx.fillRect(x + 3.5, y + 0.3, 6, 3);
  ctx.strokeStyle = c.bristleLine;
  ctx.lineWidth = 0.35;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x + 3.5, y + 0.3);
  ctx.lineTo(x + 9.5, y + 0.3);
  ctx.lineTo(x + 9.5, y + 3.3);
  ctx.lineTo(x + 3.5, y + 3.3);
  ctx.closePath();
  for (let bx = x + 4.5; bx <= x + 8.6; bx += 1) {
    ctx.moveTo(bx, y + 0.5);
    ctx.lineTo(bx, y + 3.1);
  }
  ctx.stroke();
}

/** Toothpaste drop inside the 1 × 4 shot box: pointed top, round striped belly. */
export function drawPasteDrop(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  const cx = x + 0.5;
  const r = 1.05;
  ctx.fillStyle = DENTAL_COLORS.paste;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx + r * 0.95, y + h - r - 0.3);
  ctx.arc(cx, y + h - r, r, -0.3, Math.PI + 0.3);
  ctx.closePath();
  ctx.fill();
  // Mint outline + stripe, so the white paste also reads on the light theme.
  ctx.strokeStyle = DENTAL_COLORS.pasteStripe;
  ctx.lineWidth = 0.35;
  ctx.stroke();
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx - r, y + h - r);
  ctx.quadraticCurveTo(cx, y + h - r - 0.6, cx + r, y + h - r);
  ctx.stroke();
}

/** A "W" groove across the crown — the chewing surface that makes the bunker read as a molar. */
const FISSURE = new Set(['3:7', '4:8', '4:9', '3:10', '3:11', '4:12', '4:13', '3:14']);
const ORIGINAL = BUNKER_SPRITE.rows;
/** Rows from here down are the roots (the two legs and the band above them): dentin-coloured. */
const ROOT_ROW = 11;

const solid = (rows: readonly number[], x: number, y: number) =>
  x >= 0 && x < BUNKER_W && y >= 0 && y < BUNKER_H && (rows[y] & (1 << x)) !== 0;
const eroded = (rows: readonly number[], x: number, y: number) => solid(ORIGINAL, x, y) && !solid(rows, x, y);

/** Colour of one solid bunker pixel: caries next to a hole, a stain around it, else enamel. */
function bunkerPixelColor(rows: readonly number[], x: number, y: number): string {
  let near = 3;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      if (eroded(rows, x + dx, y + dy)) near = Math.min(near, Math.max(Math.abs(dx), Math.abs(dy)));
    }
  }
  if (near === 1) return DENTAL_COLORS.caries;
  if (near === 2) return DENTAL_COLORS.stain;
  const edge = !solid(ORIGINAL, x - 1, y) || !solid(ORIGINAL, x + 1, y) || !solid(ORIGINAL, x, y - 1) || !solid(ORIGINAL, x, y + 1);
  const root = y >= ROOT_ROW;
  if (edge) return root ? DENTAL_COLORS.rootEdge : DENTAL_COLORS.enamelEdge;
  if (root) return DENTAL_COLORS.root;
  return FISSURE.has(`${y}:${x}`) ? DENTAL_COLORS.fissure : DENTAL_COLORS.enamel;
}

/**
 * A bunker as a tooth: exactly its solid pixels, one run of equal colour per
 * rectangle. Eroded holes are not drawn (they are empty), but the enamel
 * around them turns dark (caries) and brownish (stain).
 */
export function drawToothBunker(ctx: CanvasRenderingContext2D, rows: readonly number[], bx: number, by: number): void {
  for (let y = 0; y < BUNKER_H; y += 1) {
    let x = 0;
    while (x < BUNKER_W) {
      if (!solid(rows, x, y)) {
        x += 1;
        continue;
      }
      const color = bunkerPixelColor(rows, x, y);
      let end = x + 1;
      while (end < BUNKER_W && solid(rows, end, y) && bunkerPixelColor(rows, end, y) === color) end += 1;
      ctx.fillStyle = color;
      ctx.fillRect(bx + x, by + y, end - x, 1);
      x = end;
    }
  }
}

/** Records Pen calls as SVG path elements (for the points-legend icons). */
export class SvgPen implements Pen {
  fillStyle: unknown = '#000';
  strokeStyle: unknown = '#000';
  lineWidth = 1;
  lineCap: CanvasLineCap = 'butt';
  readonly shapes: { d: string; fill?: string; stroke?: string; width?: number; cap?: CanvasLineCap }[] = [];
  private d = '';
  private open = false;

  private to(x: number, y: number) {
    this.d += `${this.open ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    this.open = true;
  }
  beginPath() {
    this.d = '';
    this.open = false;
  }
  closePath() {
    this.d += 'Z';
  }
  moveTo(x: number, y: number) {
    this.d += `M${x.toFixed(2)} ${y.toFixed(2)}`;
    this.open = true;
  }
  lineTo(x: number, y: number) {
    this.to(x, y);
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    this.d += `Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  arc(x: number, y: number, r: number, a0: number, a1: number) {
    this.ellipse(x, y, r, r, 0, a0, a1);
  }
  ellipse(x: number, y: number, rx: number, ry: number, _rotation: number, a0: number, a1: number) {
    const pt = (a: number) => `${(x + Math.cos(a) * rx).toFixed(2)} ${(y + Math.sin(a) * ry).toFixed(2)}`;
    const sweep = a1 - a0;
    this.to(x + Math.cos(a0) * rx, y + Math.sin(a0) * ry);
    if (sweep >= TAU - 1e-6) {
      this.d += `A${rx} ${ry} 0 1 1 ${pt(a0 + Math.PI)}A${rx} ${ry} 0 1 1 ${pt(a0)}`;
      return;
    }
    this.d += `A${rx} ${ry} 0 ${sweep > Math.PI ? 1 : 0} 1 ${pt(a1)}`;
  }
  fill() {
    this.shapes.push({ d: this.d, fill: String(this.fillStyle) });
  }
  stroke() {
    this.shapes.push({ d: this.d, stroke: String(this.strokeStyle), width: this.lineWidth, cap: this.lineCap });
  }
}
