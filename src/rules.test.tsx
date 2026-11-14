import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyDental, applyLang, formatNumber } from './arcade';
import { EXTRA_LIFE_SCORE, UFO_POINTS } from './logic/constants';
import { ALIEN_POINTS } from './logic/formation';
import { SpaceInvadersGame } from './SpaceInvadersGame';
import { installGameEnv, restoreGameEnv } from './test/gameEnv';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  installGameEnv();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  setCoarsePointer(false);
});
afterEach(() => {
  restoreGameEnv();
  applyLang('en', { silent: true });
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const openRules = () => fireEvent.click(screen.getByRole('button', { name: /Szabályok/ }));
const rulesDialog = () => screen.getByRole('dialog', { name: /szabályok/ });
const headings = () => within(rulesDialog()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('Space Invaders rules dialog', () => {
  it('shows a Rules button; opening mid-run pauses and closing leaves it paused', () => {
    render(<SpaceInvadersGame />);
    expect(screen.getByRole('button', { name: /Szabályok/ })).toBeTruthy();
    act(() => key(' '));
    expect(screen.queryByRole('dialog')).toBeNull();
    openRules();
    expect(screen.getByRole('dialog', { name: 'Space Invaders — szabályok' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
    expect(screen.getByRole('dialog', { name: 'Szünet' })).toBeTruthy();
  });

  it('keeps R as restart (the Rules hotkey is off)', () => {
    render(<SpaceInvadersGame />);
    act(() => key(' '));
    act(() => key('r'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lists goal, play, rules, scoring, dental in order; mobile only on touch', () => {
    const { unmount } = render(<SpaceInvadersGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    unmount();
    setCoarsePointer(true);
    render(<SpaceInvadersGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    const text = rulesDialog().textContent ?? '';
    expect(text).toContain('Húzd az ujjad');
    expect(text).toContain('Tűz');
    expect(text).toContain('Teljes képernyő');
  });

  it('prints the scoring sentence with every number', () => {
    render(<SpaceInvadersGame />);
    openRules();
    const n = (v: number) => formatNumber(v, 'hu');
    const [u1, u2, u3, u4] = UFO_POINTS;
    const sentence =
      `A felső sor (tintahal) ${n(ALIEN_POINTS.squid)} pontot ér, a következő két sor (rák) ${n(ALIEN_POINTS.crab)}-t, ` +
      `az alsó két sor (polip) ${n(ALIEN_POINTS.octopus)}-t. A rejtélyes ufó ${n(u1)}, ${n(u2)}, ${n(u3)} vagy ${n(u4)} pontot hoz, ` +
      `${n(EXTRA_LIFE_SCORE)} pontnál pedig extra ágyút kapsz.`;
    expect(rulesDialog().textContent).toContain(sentence);
  });

  it('has a described diagram with the points per row', () => {
    render(<SpaceInvadersGame />);
    openRules();
    const img = within(rulesDialog()).getByRole('img', { name: /Ábra/ });
    const n = (v: number) => formatNumber(v, 'hu');
    expect(img.getAttribute('aria-label')).toBe(
      `Ábra: pont soronként. Felső sor, tintahal, ${n(ALIEN_POINTS.squid)} pont. Következő két sor, rák, ${n(ALIEN_POINTS.crab)} pont. ` +
        `Alsó két sor, polip, ${n(ALIEN_POINTS.octopus)} pont. Rejtélyes ufó, ${n(UFO_POINTS[0])}–${n(UFO_POINTS[UFO_POINTS.length - 1])} pont.`,
    );
    expect(img.textContent).toContain(`= ${n(ALIEN_POINTS.squid)}`);
    expect(img.textContent).toContain(`= ${n(ALIEN_POINTS.octopus)}`);
  });

  it('keeps the run when the language changes inside the rules', () => {
    render(<SpaceInvadersGame />);
    act(() => key(' '));
    act(() => {
      key('ArrowRight');
    });
    openRules();
    const waveBefore = screen.getByText('Hullám').parentElement!.textContent;
    act(() => applyLang('de'));
    expect(screen.getByRole('heading', { level: 2, name: 'Space Invaders — Regeln' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Ziel' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.getByRole('dialog', { name: 'Pausiert' })).toBeTruthy();
    expect(screen.getByText('Welle').parentElement!.textContent).toBe(waveBefore!.replace('Hullám', 'Welle'));
  });

  it('the Points legend shows the scoring constants', () => {
    render(<SpaceInvadersGame />);
    const n = (v: number) => formatNumber(v, 'hu');
    const legend = screen.getByRole('heading', { level: 2, name: 'Pontok' }).parentElement!.textContent ?? '';
    expect(legend).toContain(`= ${n(ALIEN_POINTS.squid)}`);
    expect(legend).toContain(`= ${n(ALIEN_POINTS.crab)}`);
    expect(legend).toContain(`= ${n(ALIEN_POINTS.octopus)}`);
    expect(legend).toContain(`= ${n(UFO_POINTS[0])} – ${n(UFO_POINTS[UFO_POINTS.length - 1])}`);
  });
});
