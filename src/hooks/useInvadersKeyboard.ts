import { useEffect, useRef, type MutableRefObject } from 'react';
import { ARCADE_KEYS, isKey, shouldIgnoreKey } from '../arcade';
import type { Input } from '../logic/types';

const LEFT = ['ArrowLeft', 'a', 'A'];
const RIGHT = ['ArrowRight', 'd', 'D'];
const FIRE = [' ', 'Spacebar', 'Enter'];
const SOUND = ['m', 'M'];

export type InvadersKeyHandlers = {
  /** Held controls, written directly (read by the simulation every frame). */
  inputRef: MutableRefObject<Input>;
  /** True while a run is being played (Space / Enter then fire instead of start). */
  isPlaying: () => boolean;
  /** Space / Enter when not playing: start, or resume when paused. */
  onPrimary: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
};

/**
 * One window keydown/keyup pair for the component's lifetime (handlers are
 * read from a ref). Typing in form fields and modifier shortcuts are left to
 * the browser; T stays free for the shared theme toggle.
 */
export function useInvadersKeyboard(handlers: InvadersKeyHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKey(e)) return;
      const h = ref.current;
      const input = h.inputRef.current;
      if (LEFT.includes(e.key)) {
        e.preventDefault();
        input.left = true;
        return;
      }
      if (RIGHT.includes(e.key)) {
        e.preventDefault();
        input.right = true;
        return;
      }
      if (FIRE.includes(e.key)) {
        // Also keeps Space from "clicking" a focused button or scrolling the page.
        e.preventDefault();
        if (h.isPlaying()) input.fire = true;
        else if (!e.repeat) h.onPrimary();
        return;
      }
      if (e.repeat) return;
      if (isKey(e, ARCADE_KEYS.pause)) {
        e.preventDefault();
        h.onTogglePause();
      } else if (isKey(e, ARCADE_KEYS.restart)) {
        h.onRestart();
      } else if (SOUND.includes(e.key)) {
        h.onToggleSound();
      }
    };

    const onUp = (e: KeyboardEvent) => {
      const input = ref.current.inputRef.current;
      if (LEFT.includes(e.key)) input.left = false;
      else if (RIGHT.includes(e.key)) input.right = false;
      else if (FIRE.includes(e.key)) {
        input.fire = false;
        if (!shouldIgnoreKey(e)) e.preventDefault();
      }
    };

    const onBlur = () => {
      const input = ref.current.inputRef.current;
      input.left = false;
      input.right = false;
      input.fire = false;
      input.targetX = null;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}
