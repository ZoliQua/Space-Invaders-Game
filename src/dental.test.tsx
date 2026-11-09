import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, loadSession, saveSession } from './arcade';
import { DENTAL_COLORS, drawGame, FALLBACK_PALETTE } from './components/render';
import { BUNKER_Y, SHOT_H } from './logic/constants';
import { bunkerX } from './logic/bunkers';
import { createInitialState } from './logic/game';
import { toSaved, type SavedGame } from './logic/persist';
import { SpaceInvadersGame } from './SpaceInvadersGame';

/** A stand-in 2D context that records every call and every colour used for a fill. */
function fakeContext() {
  const fills: string[] = [];
  const ctx = {
    fills,
    rects: [] as [string, number, number, number, number][],
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(() => fills.push(ctx.fillStyle)),
    stroke: vi.fn(),
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => ctx.rects.push([ctx.fillStyle, x, y, w, h])),
    fillText: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    imageSmoothingEnabled: true,
  };
  return ctx;
}

let ctx: ReturnType<typeof fakeContext>;

beforeEach(() => {
  localStorage.clear();
  applyLang('en', { silent: true });
  applyDental(false, { silent: true });
  localStorage.clear();
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
  localStorage.clear();
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const stat = (label: string) => {
  const dt = screen.getAllByRole('term').find((el) => el.textContent === label);
  return dt?.nextElementSibling?.textContent;
};
const canvas = (container: HTMLElement) => container.querySelector('canvas[data-dental]') as HTMLCanvasElement;
const asCtx = (c: ReturnType<typeof fakeContext>) => c as unknown as CanvasRenderingContext2D;

const seedRun = () => {
  const live = createInitialState({ status: 'running', score: 1230, wave: 3, lives: 2 });
  saveSession('invaders', { schema: 1, data: toSaved(live), seconds: 30, score: 1230 });
  return live;
};

describe('Space Invaders dental mode (component)', () => {
  it('marks the playfield and shows germs in the points legend when dental mode is on', () => {
    applyDental(true, { silent: true });
    seedRun();
    const { container } = render(<SpaceInvadersGame />);
    expect(canvas(container).dataset.dental).toBe('true');
    const germs = screen.getAllByTestId('invaders-germ-icon');
    expect(germs.map((g) => g.dataset.germ)).toEqual(['coccus', 'bacillus', 'amoeba']);
    // The canvas painted germs (round bodies) instead of pixel masks.
    expect(ctx.arc).toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: /Dental mode/ })).toHaveProperty('checked', true);
  });

  it('toggling dental mode mid-run keeps score, wave and lives', () => {
    seedRun();
    const { container } = render(<SpaceInvadersGame />);
    act(() => key('p')); // continue the restored run
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(ctx.arc).not.toHaveBeenCalled();

    act(() => applyDental(true));
    expect(canvas(container).dataset.dental).toBe('true');
    expect(ctx.arc).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Score')).toBe('1,230');
    expect(stat('Wave')).toBe('3');
    expect(stat('Lives')).toBe('2');

    fireEvent.click(screen.getByRole('checkbox', { name: /Dental mode/ }));
    expect(canvas(container).dataset.dental).toBe('false');
    expect(localStorage.getItem('arcade.dental')).toBe('0');
    expect(stat('Score')).toBe('1,230');
    act(() => vi.advanceTimersByTime(200));
    expect(loadSession<SavedGame>('invaders', 1)?.data).toMatchObject({ status: 'running', wave: 3, lives: 2, score: 1230 });
  });

  it('with dental mode off the classic pixel sprites are drawn', () => {
    seedRun();
    const { container } = render(<SpaceInvadersGame />);
    expect(canvas(container).dataset.dental).toBe('false');
    expect(screen.queryAllByTestId('invaders-germ-icon')).toHaveLength(0);
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('labels the settings row „Fogas mód” in Hungarian', () => {
    applyLang('hu', { silent: true });
    render(<SpaceInvadersGame />);
    expect(screen.getByRole('checkbox', { name: /Fogas mód/ })).toBeTruthy();
    expect(screen.getByText(/baktérium/i)).toBeTruthy();
  });
});

describe('drawGame in dental mode', () => {
  it('draws the shot as a paste drop, not a 1 × 4 bar', () => {
    const s = { ...createInitialState({ status: 'running' }), shot: { x: 100, y: 120 } };
    drawGame(asCtx(ctx), s, FALLBACK_PALETTE, { dental: true });
    expect(ctx.rects.some(([, x, y, w, h]) => x === 100 && y === 120 && w === 1 && h === SHOT_H)).toBe(false);
    expect(ctx.fills).toContain(DENTAL_COLORS.paste);
  });

  it('paints an intact bunker as enamel and the rim of an eroded hole as caries', () => {
    const s = createInitialState({ status: 'running' });
    drawGame(asCtx(ctx), s, FALLBACK_PALETTE, { dental: true });
    const colours = (bunker: number) =>
      new Set(ctx.rects.filter(([, x, y]) => x >= bunkerX(bunker) && x < bunkerX(bunker) + 22 && y >= BUNKER_Y && y < BUNKER_Y + 16).map(([c]) => c));
    expect(colours(0).has(DENTAL_COLORS.enamel)).toBe(true);
    expect(colours(0).has(DENTAL_COLORS.caries)).toBe(false);

    // Knock a hole into the middle of bunker 0.
    const rows = [...s.bunkers[0]];
    for (let y = 6; y < 9; y += 1) rows[y] &= ~(0b111 << 9);
    ctx.rects.length = 0;
    drawGame(asCtx(ctx), { ...s, bunkers: [rows, ...s.bunkers.slice(1)] }, FALLBACK_PALETTE, { dental: true });
    expect(colours(0).has(DENTAL_COLORS.caries)).toBe(true);
    // Exactly the solid pixels are painted (as horizontal runs): the hit box is what you see.
    const painted = ctx.rects.filter(([, x, y]) => x >= bunkerX(0) && x < bunkerX(0) + 22 && y >= BUNKER_Y && y < BUNKER_Y + 16);
    const solid = rows.reduce((n, r) => n + r.toString(2).split('1').length - 1, 0);
    expect(painted.every(([, , , , h]) => h === 1)).toBe(true);
    expect(painted.reduce((n, [, , , w]) => n + w, 0)).toBe(solid);
  });

  it('draws three different germ shapes, one per row type', () => {
    const s = createInitialState({ status: 'running' });
    drawGame(asCtx(ctx), s, FALLBACK_PALETTE, { dental: true });
    expect(ctx.arc).toHaveBeenCalled(); // coccus bodies and eyes
    expect(ctx.ellipse).toHaveBeenCalled(); // amoeba dome
    expect(ctx.quadraticCurveTo).toHaveBeenCalled(); // amoeba feet
  });
});
