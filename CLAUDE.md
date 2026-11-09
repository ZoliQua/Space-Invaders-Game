# Space Invaders Game — CLAUDE.md

## Project Facts

- **Repository**: https://github.com/ZoliQua/Space-Invaders-Game
- **Play in the portal**: https://drdul.hu/arcade/#/play/invaders (game id `invaders`)
- **Stack**: React 18, Vite 5, TypeScript 5, CSS Modules; `<canvas>` rendering
- **Package manager**: npm
- **Node**: >=20
- **Scripts**:
  - `npm run dev` — local dev server
  - `npm run build` — production build (`tsc -b && vite build`)
  - `npm run preview` — preview production build
  - `npm run typecheck` — `tsc -b`
  - `npm run lint` — ESLint
  - `npm test` — Vitest (logic + component tests, jsdom)
  - `npm run check` — lint → typecheck → test → build (same as CI)
- **Playfield**: fixed 224 × 240 logical pixels (`src/logic/constants.ts`), scaled to the container
- **Simulation**: fixed 60 Hz ticks; `step(state, dtMs, input)` accumulates time, live frames are clamped to 50 ms
- **Controls**: ← → / A D move, Space / Enter fire (start / resume when not playing), P / Esc pause, R restart, M sound;
  touch buttons on coarse pointers, pointer drag + hold-to-fire on the canvas. **T is reserved** for the theme.
- **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English

If any fact above disagrees with the real repository, verify first and flag the divergence to the user before editing code.

---

## Primary Goal

A faithful, polished, type-safe Space Invaders that is easy to review, debug, and extend.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture

Logic lives outside presentation. Do not bury game rules inside JSX or the renderer.

```
src/
  arcade/        # VENDORED shared kit from Arcade-Game-Center/packages/kit — never edit here
  logic/         # constants, types, sprites, bunkers, formation, rng, game (tick/step), autopilot, persist
  audio/         # sound.ts (Web Audio synth), cues.ts (pure prev/next state → sound cues)
  hooks/         # useAnimationFrame, useInvadersKeyboard, useCanvasPalette
  components/    # GameCanvas (full + mini), render.ts (drawGame), dentalDraw.ts (dental skin), TouchControls, SpriteIcon (+ GermIcon)
  demo/          # SpaceInvadersDemo — landing-page attract mode
  SpaceInvadersGame.tsx  # embeddable game, ArcadeGameProps
  App.tsx        # standalone page: <ArcadeShell gameId="invaders"><SpaceInvadersGame/></ArcadeShell>
  main.tsx       # entry, imports arcade/arcade.css once
  index.ts       # package entry for Arcade-Game-Center
```

Stats, best score, session autosave, theme, score panel and overlays come from `src/arcade/`
(`useArcadeRun`, `useSessionAutosave`, `useRestoredSession`, `StatPanel`, `GameOverlay`, …).
Change the kit only in Arcade-Game-Center and sync it (`node scripts/sync-games.mjs kit`).
The same `src/` is mirrored into `Arcade-Game-Center/apps/invaders/` — keep them identical
(`node scripts/sync-games.mjs check` there).

**Engine contract**: `tick(state, input)` and `step(state, dtMs, input)` are pure (never mutate their input; a tick
works on a draft copy) and deterministic — all randomness comes from the Mulberry32 seed stored in `GameState.rng`.
`runTicks(state, n, pilot)` drives the demo and tests.

**Live loop**: `SpaceInvadersGame` keeps the simulation in a ref, advances it in a `requestAnimationFrame` loop and paints
the canvas imperatively. React state (`view`) is refreshed on HUD changes (status, phase, score, lives, wave) and at
least every 100 ms — that snapshot feeds the StatPanel, overlays and autosave. Start / pause / restore go through
`commit()` which updates both.

---

## Type Model (abridged — see `src/logic/types.ts`)

```ts
type GameStatus = 'idle' | 'running' | 'paused' | 'gameOver';   // = ArcadeStatus
type Phase = 'play' | 'dying' | 'waveClear';                     // sub-state while running

type GameState = {
  status; phase; phaseTicks; tick; acc; rng;                      // lifecycle, fixed-step accumulator, RNG seed
  score; lives; wave; extraLifeAwarded; invaded;
  playerX; shot: Shot | null; shotCooldown; shotsFired;
  alive: boolean[55]; fx; fy; dir: 1 | -1; frame: 0 | 1; marchTimer; marchNote;
  bombs: Bomb[]; bombTimer; bombCycle;
  ufo: Ufo | null; ufoTimer;
  bunkers: number[4][16];                                         // 22-bit row masks
  effects: Effect[];                                              // explosions, UFO score popup
};
```

Saved sessions use `SavedGame` (`persist.ts`): `alive` as a 55-char `0/1` string, each bunker as 96 hex digits.
Bump `SESSION_SCHEMA` in `SpaceInvadersGame.tsx` when the saved shape changes.

---

## Rules (keep them true)

- Points: squid 30, crab 20, octopus 10, UFO 50/100/150/300 (weights 3:4:2:1); bonus cannon once at 1,500.
- One player shot on screen; shots and bombs advance in ≤ 1 px sub-steps; collisions are pixel-precise mask overlaps.
- At most 3 bombs; rotation rolling → plunger → squiggly; rolling aims at the cannon's column.
- The formation freezes while an alien explodes; aliens erode bunkers they overlap; landing on the cannon row ends the run.
- New waves: fresh bunkers, formation one drop lower (capped at 5 drops), faster march.
- Score attack: `useArcadeRun` outcome is always `'over'`.

## Invaders Bug Checklist

Before concluding any task, confirm each item was checked — or explicitly state it was not:

- `tick` / `step` stay pure and deterministic (same seed + inputs → identical JSON); no `Math.random` / `Date` in `logic/`.
- No tunnelling: shot and bombs still sub-step ≤ 1 px; collision masks match the drawn sprite frame.
- Pause, game over and the hidden tab stop the rAF loop; frames after a pause start with dt = 0 (no jump).
- Keyboard listeners attached once per mount; hotkeys ignored in form fields and with modifiers; T never bound.
- The demo has no listeners, no stats, no sessions, no sound and no localStorage writes.
- Saved data is validated by `isSavedInvaders` — extend it whenever `GameState` changes.
- Canvas colours come from CSS tokens and look right in both `[data-theme]` values.

---

## Working Rules

**Verify before and after every non-trivial change.** Read the target file and its neighbours first; afterwards re-check
imports, call sites, state transitions, and that no stale code remains.

**No hallucination.** Do not invent files, hooks, scripts, dependencies, or prior decisions. Never claim a build, lint,
or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time. **No new dependencies** without justification.

## End-of-Task Report

- **Changed files** — each file with a one-line reason.
- **Verified** — which checks actually ran.
- **Not verified** — explicit gaps.
- **Risks / follow-ups** — only real concerns.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
