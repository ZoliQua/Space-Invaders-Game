import { useEffect, useRef, useState } from 'react';
import type { ArcadeDemoProps } from '../arcade';
import { GameCanvas } from '../components/GameCanvas';
import { chooseInput } from '../logic/autopilot';
import { TICK_MS } from '../logic/constants';
import { createInitialState, runTicks } from '../logic/game';
import type { GameState } from '../logic/types';

/** One demo frame every 100 ms, simulating the same 100 ms of play (6 ticks). */
const DEMO_FRAME_MS = 100;
const TICKS_PER_FRAME = Math.round(DEMO_FRAME_MS / TICK_MS);
const RESTART_DELAY_MS = 1200;

const freshDemo = (seed: number): GameState => createInitialState({ status: 'running', seed });

/**
 * Attract mode for the portal landing page: the real engine, flown by the
 * autopilot (aim under a column, fire when aligned, dodge bombs). No keyboard,
 * no stats, no saves, no sound. Restarts by itself after a game over.
 */
export function SpaceInvadersDemo({ active = true }: ArcadeDemoProps) {
  const seedRef = useRef(1);
  const [state, setState] = useState(() => freshDemo(seedRef.current));

  useEffect(() => {
    if (!active || state.status !== 'running') return;
    const id = window.setInterval(() => {
      setState((prev) => (prev.status === 'running' ? runTicks(prev, TICKS_PER_FRAME, chooseInput) : prev));
    }, DEMO_FRAME_MS);
    return () => window.clearInterval(id);
  }, [active, state.status]);

  useEffect(() => {
    if (!active || state.status !== 'gameOver') return;
    const id = window.setTimeout(() => {
      seedRef.current += 1;
      setState(freshDemo(seedRef.current));
    }, RESTART_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [active, state.status]);

  return (
    <div className="arc-demo" aria-hidden="true">
      <GameCanvas state={state} variant="mini" />
    </div>
  );
}

export default SpaceInvadersDemo;
