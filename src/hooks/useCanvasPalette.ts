import { useEffect, useState, type RefObject } from 'react';
import { FALLBACK_PALETTE, readPalette, type Palette } from '../components/render';

/**
 * Canvas colours from the arcade CSS tokens of `ref`'s element, re-read
 * whenever the shared theme flips (`data-theme` on <html>).
 */
export function useCanvasPalette(ref: RefObject<Element>): Palette {
  const [palette, setPalette] = useState<Palette>(FALLBACK_PALETTE);
  useEffect(() => {
    const update = () => setPalette(readPalette(ref.current));
    update();
    if (typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => mo.disconnect();
  }, [ref]);
  return palette;
}
