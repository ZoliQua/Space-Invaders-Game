import { aliveCount } from '../logic/formation';
import type { GameState } from '../logic/types';

export type Cue =
  | { kind: 'march'; note: number }
  | { kind: 'shoot' }
  | { kind: 'alienHit' }
  | { kind: 'ufoHit' }
  | { kind: 'playerHit' }
  | { kind: 'extraLife' };

/**
 * Sound effects implied by one simulation advance (pure, so it is testable and
 * the engine stays free of audio). Several ticks may have passed between
 * `prev` and `next`; at most one cue of each kind is produced.
 */
export function soundCues(prev: GameState, next: GameState): Cue[] {
  if (next.tick <= prev.tick) return [];
  const cues: Cue[] = [];
  if (next.marchNote > prev.marchNote && next.phase === 'play') cues.push({ kind: 'march', note: next.marchNote % 4 });
  if (next.shotsFired > prev.shotsFired) cues.push({ kind: 'shoot' });
  if (aliveCount(next.alive) < aliveCount(prev.alive)) cues.push({ kind: 'alienHit' });
  // The UFO only ever leaves early (with points) when it is shot down.
  if (prev.ufo && !next.ufo && next.score > prev.score && next.effects.some((e) => e.kind === 'ufo')) {
    cues.push({ kind: 'ufoHit' });
  }
  if (prev.phase !== 'dying' && next.phase === 'dying') cues.push({ kind: 'playerHit' });
  if (next.extraLifeAwarded && !prev.extraLifeAwarded) cues.push({ kind: 'extraLife' });
  return cues;
}
