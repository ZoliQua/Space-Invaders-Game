import { drawGerm, germColor, SvgPen, type GermKind } from './dentalDraw';
import type { Mask } from '../logic/sprites';

/** A sprite as a tiny inline SVG (one rect per horizontal pixel run), coloured by `currentColor`. */
export function SpriteIcon({ mask, scale = 2, className }: { mask: Mask; scale?: number; className?: string }) {
  const rects: { x: number; y: number; w: number }[] = [];
  mask.rows.forEach((row, y) => {
    let x = 0;
    while (x < mask.w) {
      if ((row & (1 << x)) === 0) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < mask.w && (row & (1 << end)) !== 0) end += 1;
      rects.push({ x, y, w: end - x });
      x = end;
    }
  });
  return (
    <svg
      className={className}
      width={mask.w * scale}
      height={mask.h * scale}
      viewBox={`0 0 ${mask.w} ${mask.h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}

const GERM_BOX: Record<GermKind, number> = { coccus: 8, bacillus: 11, amoeba: 12 };

/**
 * Dental-mode legend icon: the same germ the canvas draws, as an inline SVG.
 * The coccus is coloured by `currentColor` (the game colour via `className`).
 */
export function GermIcon({ kind, className, scale = 2 }: { kind: GermKind; className?: string; scale?: number }) {
  const pen = new SvgPen();
  drawGerm(pen, kind, 0, 0, 0, germColor(kind, 'currentColor'));
  const w = GERM_BOX[kind];
  return (
    <svg
      className={className}
      width={w * scale}
      height={8 * scale}
      viewBox={`-0.5 -0.5 ${w + 1} 9`}
      aria-hidden="true"
      focusable="false"
      data-testid="invaders-germ-icon"
      data-germ={kind}
    >
      {pen.shapes.map((sh, i) =>
        sh.fill ? (
          <path key={i} d={sh.d} fill={sh.fill} />
        ) : (
          <path key={i} d={sh.d} fill="none" stroke={sh.stroke} strokeWidth={sh.width} strokeLinecap={sh.cap} />
        ),
      )}
    </svg>
  );
}
