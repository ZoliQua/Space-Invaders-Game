import { ArcadeShell } from './arcade';
import { SpaceInvadersGame } from './SpaceInvadersGame';

export default function App() {
  return (
    <ArcadeShell gameId="invaders">
      <SpaceInvadersGame />
    </ArcadeShell>
  );
}
