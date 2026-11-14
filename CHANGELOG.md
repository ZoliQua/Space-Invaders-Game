# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.1] — 2026-11-14

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games, Minesweeper, Solitaire and Ulti, with their accent colours.
- README: the Zoltan's Arcade family table lists all fourteen games.

## [1.1.0] — 2026-11-09

### Added

- Three languages: English, Hungarian and German, switchable in the top bar / settings and by `?lang=en|hu|de`; the choice is shared across the arcade (`arcade.lang`).
- Dental mode (off by default, shared `arcade.dental`, `?dental=1`): the invaders are bacteria, the cannon a toothbrush shooting toothpaste, and the bunkers are teeth that erode like caries. Presentation only: rules, scores, stats and saves are unchanged.

### Changed

- Numbers use the locale's digit grouping.
- Links now point to https://dulzoltan.hu/arcade/ (the arcade moved to its new domain).

## [1.0.3] — 2026-11-04

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the eleventh arcade game, Texas Hold'em, with its accent colour.
- README: the Zoltan's Arcade family table lists all eleven games.

## [1.0.2] — 2026-11-01

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the tenth arcade game, Nut Sort, with its accent colour.
- README: the Zoltan's Arcade family table lists all ten games.

## [1.0.1] - 2026-10-28

### Fixed
- Landing-page demo rendered blank inside a grid-centred preview box: the mini canvas's percentage height did not
  resolve, so it fell back to its intrinsic size, which grew with every backing-store resize. The mini canvas is now
  absolutely positioned inside the demo box.

## [1.0.0] - 2026-10-28

### Added
- Classic Space Invaders on a fixed 224 × 240 logical playfield: 5 × 11 formation of squids (30), crabs (20) and
  octopuses (10) as pixel-art sprites with a two-frame march animation.
- Formation that steps sideways, drops and turns at the edges, speeds up as it thins out and freezes while an alien
  explodes; each new wave starts one row lower (capped) and faster.
- Three alien bomb types (rolling, plunger, squiggly), at most three in the air, fired from columns chosen by a seeded RNG
  (the rolling bomb aims at the cannon's column); bombs speed up when fewer than nine aliens remain.
- Four bunkers with per-pixel erosion from bombs, player shots and aliens marching through them.
- Mystery UFO every ~25 s worth 50 / 100 / 150 / 300 points.
- Three cannons, a bonus cannon at 1,500 points; the run ends when the last cannon is lost or the aliens land.
- Pure, deterministic fixed-timestep engine (`step(state, dtMs, input)`, 60 Hz ticks, seeded Mulberry32 RNG in the state)
  with pixel-precise, sub-stepped collisions.
- Crisp `<canvas>` renderer scaled to the container, coloured from the shared arcade tokens (dark & light theme,
  re-read on theme change).
- Keyboard (← → / A D, Space / Enter, P / Esc, R, M), on-screen touch buttons on coarse pointers, and pointer drag +
  hold-to-fire on the playfield; automatic pause when the tab is hidden.
- Synthesised Web Audio effects — the four-note march, shots, explosions, UFO warble — with a remembered Sound toggle.
- Autosave & resume of the complete run (`arcade.session.invaders`) in a compact format (aliens as a bit string, bunkers
  as hex masks) behind a strict validator; restored runs open paused with "Welcome back".
- Shared Zoltan's Arcade integration: `ArcadeGameProps` (`embedded`, `onGameOver`, `onRunEnd`, `onStatusChange`),
  unified stats in `arcade.stats.invaders`, StatPanel (Score, Best, Wave, Lives, Time), overlays and save badge.
- `SpaceInvadersDemo` attract mode: the real engine flown by an autopilot that aims, fires and dodges bombs, restarting
  itself after a game over.
- Vitest + Testing Library suite (engine, sprites/bunkers, RNG, autopilot, persistence, sound cues, component and demo
  tests), `npm run check`, GitHub Actions CI, community docs and issue / PR templates.

### Notes
- Scoring is score attack: every finished run is recorded with outcome `over`.
- `T` is left to the shared theme toggle.
