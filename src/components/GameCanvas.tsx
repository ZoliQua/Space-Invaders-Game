import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { formatNumber, useDental, useLang, useMessages } from '../arcade';
import { MESSAGES } from '../i18n';
import { FIELD_H, FIELD_W } from '../logic/constants';
import type { GameState } from '../logic/types';
import { useCanvasPalette } from '../hooks/useCanvasPalette';
import { drawGame, type CanvasText } from './render';
import styles from './GameCanvas.module.css';

export type GameCanvasHandle = {
  /** Paint a frame immediately (the live loop calls this ~60× a second). */
  draw: (state: GameState) => void;
};

type Props = {
  /** Painted whenever it changes (the live loop also paints via the handle). */
  state: GameState;
  /**
   * Where prop-driven repaints read the frame from. The live game passes its
   * simulation ref, so a lagging React snapshot never paints an older frame.
   */
  source?: () => GameState;
  /** `mini` is the landing-page demo: no ARIA role, no pointer input. */
  variant?: 'full' | 'mini';
  /**
   * Pointer steering in logical x (null when released) and whether the
   * pointer is held down (a mouse fires; a touch only steers and reports null).
   */
  onAim?: (x: number | null, firing: boolean | null) => void;
};

/**
 * Fixed 224 × 240 logical playfield on a <canvas>. The backing store is an
 * integer multiple of the logical size (crisp pixels on any devicePixelRatio)
 * and CSS scales it to the container width.
 */
export const GameCanvas = forwardRef<GameCanvasHandle, Props>(function GameCanvas(
  { state, source, variant = 'full', onAim },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRef = useRef(state);
  const palette = useCanvasPalette(canvasRef);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const mini = variant === 'mini';
  const [dental] = useDental();
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
  const text = useMemo<CanvasText>(
    () => ({ wave: (n) => t('canvasWave', { n: formatNumber(n, lang) }), ready: t('canvasReady') }),
    [t, lang],
  );

  const paint = useCallback(
    (s: GameState) => {
      lastRef.current = s;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const scale = canvas.width / FIELD_W;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      drawGame(ctx, s, paletteRef.current, { mini, text, dental });
    },
    [mini, text, dental],
  );

  useImperativeHandle(ref, () => ({ draw: paint }), [paint]);

  const sourceRef = useRef(source);
  sourceRef.current = source;

  useEffect(() => {
    paint(sourceRef.current ? sourceRef.current() : state);
  }, [state, palette, paint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const cssWidth = canvas.getBoundingClientRect().width;
      const dpr = window.devicePixelRatio || 1;
      const k = Math.max(1, Math.round((cssWidth * dpr) / FIELD_W));
      if (canvas.width !== FIELD_W * k) {
        canvas.width = FIELD_W * k;
        canvas.height = FIELD_H * k;
      }
      paint(lastRef.current);
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [paint]);

  const aim = (e: ReactPointerEvent<HTMLCanvasElement>, firing: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    onAim?.(((e.clientX - rect.left) / rect.width) * FIELD_W, e.pointerType === 'touch' ? null : firing);
  };
  const release = (e: ReactPointerEvent<HTMLCanvasElement>) => onAim?.(null, e.pointerType === 'touch' ? null : false);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas} ${mini ? styles.mini : ''}`}
      width={FIELD_W}
      height={FIELD_H}
      role={mini ? undefined : 'img'}
      aria-label={mini ? undefined : t('playfield')}
      aria-hidden={mini ? true : undefined}
      data-dental={dental ? 'true' : 'false'}
      onPointerDown={
        onAim
          ? (e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              aim(e, true);
            }
          : undefined
      }
      onPointerMove={onAim ? (e) => e.buttons !== 0 && aim(e, true) : undefined}
      onPointerUp={onAim ? release : undefined}
      onPointerCancel={onAim ? release : undefined}
      onContextMenu={onAim ? (e) => e.preventDefault() : undefined}
    />
  );
});
