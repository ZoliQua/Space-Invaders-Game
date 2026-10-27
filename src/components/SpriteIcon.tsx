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
