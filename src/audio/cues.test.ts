import { describe, expect, it } from 'vitest';
import { COLS, PLAYER_Y } from '../logic/constants';
import { alienBox } from '../logic/formation';
import { createInitialState, tick } from '../logic/game';
import { soundCues } from './cues';
import { InvadersSound } from './sound';

const calm = { bombTimer: 10_000, ufoTimer: 10_000 };

describe('soundCues', () => {
  it('plays the next note of the four-note march on each beat', () => {
    const s = createInitialState({ status: 'running', marchTimer: 1, ...calm });
    expect(soundCues(s, tick(s))).toEqual([{ kind: 'march', note: 1 }]);
  });

  it('cues the shot, the hit and the cannon explosion', () => {
    const s = createInitialState({ status: 'running', marchTimer: 1000, ...calm });
    expect(soundCues(s, tick(s, { left: false, right: false, fire: true }))).toEqual([{ kind: 'shoot' }]);
    const b = alienBox(4 * COLS + 2, s.fx, s.fy, s.frame);
    const aimed = { ...s, shot: { x: b.x + 6, y: b.y + 9 } };
    expect(soundCues(aimed, tick(aimed))).toContainEqual({ kind: 'alienHit' });
    const doomed = { ...s, playerX: 100, bombs: [{ x: 105, y: PLAYER_Y - 8, kind: 'plunger' as const, age: 0 }] };
    expect(soundCues(doomed, tick(doomed))).toContainEqual({ kind: 'playerHit' });
  });

  it('is silent when nothing advanced', () => {
    const s = createInitialState();
    expect(soundCues(s, s)).toEqual([]);
  });
});

describe('InvadersSound', () => {
  it('is a safe no-op without Web Audio', () => {
    const sound = new InvadersSound();
    expect(() => {
      sound.unlock();
      sound.play({ kind: 'march', note: 3 });
      sound.setUfo(true);
      sound.setUfo(false);
      sound.dispose();
    }).not.toThrow();
  });
});
