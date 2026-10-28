# 👾 Space Invaders

A faithful, type-safe Space Invaders built with **React 18**, **Vite** and **TypeScript** — a pixel-art `<canvas>` playfield driven by a pure, fixed-timestep engine, no game framework.
Runs on its own **and** as one of the games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** — [play it in the portal](https://drdul.hu/arcade/#/play/invaders).

[![CI](https://github.com/ZoliQua/Space-Invaders-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Space-Invaders-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [How it works](#-how-it-works)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 **Space Invaders** (this repo) | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |

## ✨ Features

- 👾 **The classic formation** — 5 rows × 11 aliens (squid, crab, octopus) as pixel-art sprites with a two-frame march
- 🥁 **The march speeds up** as the formation thins out — the last invader races across the screen
- 💣 **Three bomb types** (rolling, plunger, squiggly), at most three in the air; the rolling bomb hunts your cannon
- 🧱 **Four crumbling bunkers** with per-pixel erosion from bombs, from your own shots and from aliens marching through them
- 🛸 **Mystery UFO** crossing the top every ~25 s, worth 50 / 100 / 150 / 300
- ❤️ **3 cannons + a bonus cannon at 1,500 points**; every new wave starts lower and faster
- 🎯 **Pixel-precise collisions**, sub-stepped so nothing tunnels through anything
- ⏱️ **Fixed-timestep, deterministic engine** — `step(state, dtMs, input)` with a seeded RNG in the state
- 🔊 **Synthesised sound** (Web Audio): the four-note march, shots, explosions, UFO warble — with a Sound toggle
- 📱 **Touch controls** — on-screen ◀ FIRE ▶ buttons on touch screens, or drag on the playfield to steer and hold to fire
- 💾 **Autosave & resume** — formation, bunkers, bombs, UFO and RNG are saved; close the tab mid-wave and continue later
- 🏆 **Unified arcade stats** — best score, plays, total time, shared with the portal
- 🌗 **Dark / light theme** shared with every arcade game (press **T**); the canvas re-reads its colours on every switch
- 🤖 **Attract-mode demo** (`<SpaceInvadersDemo />`) — the real engine flown by an autopilot that aims, fires and dodges
- 🧪 **Tested** — 58 Vitest tests: engine rules, collisions, autopilot, save validator, component and demo tests

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Space-Invaders-Game.git
cd Space-Invaders-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## ⌨️ Controls

| Key | Action |
| --- | --- |
| ⬅️ ➡️ / **A D** | Move the cannon |
| **Space** / **Enter** | Fire (hold to keep firing) · start · resume |
| **P** / **Esc** | Pause / resume |
| **R** | Restart |
| **M** | Sound on / off |
| **T** | Toggle dark / light theme (standalone page) |

On touch screens three hold-to-act buttons appear under the playfield. With any pointer you can also press on the
playfield: the cannon slides under your finger and fires while you hold. Only **one shot** can be on screen at a time —
as in the original, a miss costs you time. The game pauses itself when the tab is hidden.

## 🎯 Scoring & stats

| Target | Points |
| --- | --- |
| 🦑 Squid (top row) | **30** |
| 🦀 Crab (rows 2–3) | **20** |
| 🐙 Octopus (rows 4–5) | **10** |
| 🛸 Mystery UFO | **50 / 100 / 150 / 300** (odds 3 : 4 : 2 : 1, from the seeded RNG) |

A full wave is worth 990 points. One **bonus cannon** is awarded at **1,500** points. A run ends when the last cannon is
destroyed **or** when the aliens reach the cannon row (they land — game over, whatever lives remain). Waves repeat forever,
each starting one row lower (capped after five) and marching and bombing a little faster.

| Wave | 1 | 2 | 3 | 4 | 5 | 6+ |
| --- | --- | --- | --- | --- | --- | --- |
| Formation top (px) | 44 | 52 | 60 | 68 | 76 | 84 |
| Ticks per march beat (55 aliens) | 44 | 40 | 36 | 32 | 28 | 24 |

When a run ends the kit records it once in `localStorage` under `arcade.stats.invaders`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`) with outcome `over` (score attack).

## 💾 Autosave & resume

While a run is in progress it is saved about once a second and whenever the page is hidden or the game is unmounted
(key `arcade.session.invaders`, schema-versioned). The save holds the complete simulation — formation, march timer, shots,
bombs, UFO, effects, lives, wave, score and the RNG seed — with the 55 aliens packed into a `0`/`1` string and each bunker's
16 × 22 pixel mask into 96 hex digits (a save is well under 2 KB). A strict validator (`src/logic/persist.ts`) checks every
field, its range and cross-field consistency before a save is trusted. Reloading shows **Welcome back** with the restored
run paused. **Discard** next to the *Autosaved* badge throws the save away. Finished runs clear their save automatically.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { SpaceInvadersGame, SpaceInvadersDemo } from '@arcade/invaders';

<SpaceInvadersGame
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('invaders', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<SpaceInvadersDemo active={cardIsVisible} />  // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`.
The playfield scales to its container (it fits the portal's content column and a 360 px phone).

## 🧠 How it works

State machine: `idle → running ↔ paused → gameOver → (restart) → running`. While `running`, a `phase` tracks
`play`, `dying` (the cannon explodes, everything else freezes) and `waveClear` (a short breather before the next wave).

**Engine.** Everything lives in a pure `GameState` on a fixed 224 × 240 logical field. `step(state, dtMs, input)` adds the
elapsed time to an accumulator and runs whole 1/60 s `tick`s, so the same seed and inputs always replay identically.
A tick: move the cannon → spawn / advance the shot pixel by pixel (bombs → aliens → UFO → bunkers → top) → march →
advance bombs in ≤ 1 px sub-steps (cannon → bunkers → ground) → maybe drop a bomb → move or launch the UFO.

**March.** The formation moves 2 px per beat; a beat happens every `round(alive × base / 55)` ticks, so it accelerates as
aliens die (one survivor marches every tick). At an edge it drops 8 px and turns. As in the original it freezes while an
alien explodes, and aliens grind away any bunker pixels they overlap.

**Bombs.** At most three are in the air. A reload timer (shorter in later waves, with seeded jitter) releases the next
bomb of the rolling → plunger → squiggly rotation from the lowest alien of a column: the rolling bomb picks the living
column closest to the cannon, the others a random living column. Bombs speed up when fewer than nine aliens remain.

**Collisions & bunkers.** Sprites are 1-bit masks (one integer bitmask per row), so every collision is a pixel-exact
shift-and-AND. Bunkers are 16 rows of 22-bit masks; a hit clears the pixels under an explosion sprite, which carves the
familiar ragged holes.

**Rendering.** A `<canvas>` whose backing store is an integer multiple of the logical size (crisp at any
devicePixelRatio), scaled by CSS. Colours come from the arcade CSS tokens (`--game-invaders`, `--text-strong`, `--ok`,
`--danger`, …) and are re-read whenever `data-theme` changes. A `requestAnimationFrame` loop (frames clamped to 50 ms)
advances the simulation held in a ref and paints it directly; React re-renders only for HUD changes and a 10 Hz snapshot
that feeds the autosave.

**Autopilot (demo).** Picks the closest column (or the UFO), leads the target by how far it moves while the shot climbs,
and fires when aligned. Each tick it simulates the falling bombs 60 ticks ahead for four plans — go to the target, stay,
run left, run right — and takes the first plan that is never hit.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logic + component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |

## 🏗️ Architecture

```
src/
  arcade/                  vendored Zoltan's Arcade kit — do not edit here (see its README)
  logic/                   pure game rules (no React)
    constants.ts types.ts  field geometry, timings, state shape
    sprites.ts             1-bit pixel-art masks + pixel-precise overlap
    bunkers.ts             bunker masks, erosion, compact hex encoding
    formation.ts           alien grid, points, march speed, wave start height
    rng.ts                 seeded Mulberry32 (state kept in GameState)
    game.ts                createInitialState, tick, step, runTicks, togglePause
    autopilot.ts           aim / fire / dodge driver for the demo
    persist.ts             compact save format + strict validator
  audio/                   Web Audio synth (sound.ts) and pure state → cue mapping (cues.ts)
  hooks/                   useAnimationFrame, useInvadersKeyboard, useCanvasPalette
  components/              GameCanvas (full + mini), render.ts, TouchControls, SpriteIcon
  demo/SpaceInvadersDemo.tsx  landing-page attract mode
  SpaceInvadersGame.tsx    the embeddable game (ArcadeGameProps)
  App.tsx                  standalone page: <ArcadeShell><SpaceInvadersGame/></ArcadeShell>
  main.tsx                 entry; loads the shared arcade.css once
  index.ts                 package entry used by Arcade-Game-Center
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
