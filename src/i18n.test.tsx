import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, formatNumber, LANGS, loadSession, saveSession } from './arcade';
import { MESSAGES } from './i18n';
import { createInitialState } from './logic/game';
import { toSaved, type SavedGame } from './logic/persist';
import { SpaceInvadersGame } from './SpaceInvadersGame';
import { setCoarsePointer } from './test/touchEnv';

/** A stand-in 2D context: jsdom has no canvas; we only record what is drawn. */
function fakeContext() {
  return {
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    imageSmoothingEnabled: true,
  };
}

let ctx: ReturnType<typeof fakeContext>;

beforeEach(() => {
  localStorage.clear();
  applyLang('en', { silent: true });
  ctx = fakeContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  );
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'Date',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const stat = (label: string) => {
  const dt = screen.getAllByRole('term').find((el) => el.textContent === label);
  return dt?.nextElementSibling?.textContent;
};
const drawnText = () => ctx.fillText.mock.calls.map((c) => c[0] as string);

describe('Space Invaders messages', () => {
  it('has every key in en / hu / de with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en).sort();
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual(keys);
      for (const k of keys) {
        const value = (MESSAGES[lang] as Record<string, string>)[k];
        expect(typeof value, `${lang}.${k}`).toBe('string');
        expect(value.trim(), `${lang}.${k}`).not.toBe('');
      }
    }
  });
});

describe('<SpaceInvadersGame /> in other languages', () => {
  it('shows the German start overlay after applyLang("de")', () => {
    setCoarsePointer(true);
    applyLang('de');
    render(<SpaceInvadersGame />);
    const dialog = screen.getByRole('dialog', { name: 'Space Invaders' });
    expect(dialog.textContent).toContain('Halte die anrückenden Wellen auf');
    expect(dialog.textContent).toContain('1.500');
    expect(screen.getAllByRole('button', { name: /Start/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('group', { name: 'Touch-Steuerung' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Feuer' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Space-Invaders-Spielfeld' })).toBeTruthy();
  });

  it('draws the wave banner on the canvas in German', () => {
    const between = createInitialState({ status: 'running', phase: 'waveClear', phaseTicks: 90, wave: 3 });
    saveSession('invaders', { schema: 1, data: toSaved(between), seconds: 20, score: 0 });
    applyLang('de');
    render(<SpaceInvadersGame />);
    expect(screen.getByRole('dialog', { name: 'Willkommen zurück' })).toBeTruthy();
    expect(drawnText()).toContain('WELLE 4');
    expect(drawnText()).toContain('MACH DICH BEREIT');
  });

  it('switching to Hungarian mid-run keeps score, wave and lives', () => {
    const live = createInitialState({ status: 'running', score: 1230, wave: 3, lives: 2 });
    saveSession('invaders', { schema: 1, data: toSaved(live), seconds: 30, score: 1230 });
    render(<SpaceInvadersGame />);
    act(() => key('p')); // continue the restored run
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Score')).toBe('1,230');

    act(() => applyLang('hu'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Pont')).toBe(formatNumber(1230, 'hu'));
    act(() => applyLang('de'));
    expect(stat('Punkte')).toBe('1.230');
    act(() => applyLang('hu'));
    expect(stat('Hullám')).toBe('3');
    expect(stat('Életek')).toBe('2');
    act(() => vi.advanceTimersByTime(200));
    expect(loadSession<SavedGame>('invaders', 1)?.data).toMatchObject({ status: 'running', wave: 3 });
  });
});
