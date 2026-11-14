# 👾 Space Invaders

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

Ein originalgetreues, typsicheres Space Invaders mit **React 18**, **Vite** und **TypeScript** – ein Pixel-Art-Spielfeld auf `<canvas>`, angetrieben von einer reinen Engine mit festem Zeitschritt, ohne Game-Framework.
Läuft allein **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** – [im Portal spielen](https://dulzoltan.hu/arcade/#/play/invaders).

[![CI](https://github.com/ZoliQua/Space-Invaders-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Space-Invaders-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhaltsverzeichnis

- [Die Zoltan's-Arcade-Familie](#-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Steuerung](#%EF%B8%8F-steuerung)
- [Punkte & Statistik](#-punkte--statistik)
- [Autospeichern & Fortsetzen](#-autospeichern--fortsetzen)
- [Einbindung in Arcade-Game-Center](#-einbindung-in-arcade-game-center)
- [So funktioniert es](#-so-funktioniert-es)
- [Skripte](#-skripte)
- [Architektur](#%EF%B8%8F-architektur)
- [Mitwirken](#-mitwirken)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repo, das sich auch ins Portal einklinkt. Alle teilen ein Designsystem, ein Punktemodell und ein Speicherformat über das eingebundene Kit [`src/arcade/`](./src/arcade).

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reaktion |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Knobelei |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 **Space Invaders** (dieses Repo) | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Vier gewinnt | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 👾 **Die klassische Formation** – 5 Reihen × 11 Invasoren (Tintenfisch, Krabbe, Krake) als Pixel-Art-Sprites mit zweiphasigem Marsch
- 🥁 **Der Marsch wird schneller**, je dünner die Formation wird – der letzte Invasor rast über den Bildschirm
- 💣 **Drei Bombentypen** (Roller, Stößel, Schlängler), höchstens drei gleichzeitig in der Luft; die rollende Bombe jagt deine Kanone
- 🧱 **Vier zerbröckelnde Bunker** mit pixelweiser Erosion durch Bomben, deine eigenen Schüsse und hindurchmarschierende Invasoren
- 🛸 **Mysteriöses UFO**, das etwa alle 25 s oben vorbeifliegt und 50 / 100 / 150 / 300 Punkte wert ist
- ❤️ **3 Kanonen + eine Bonuskanone bei 1.500 Punkten**; jede neue Welle beginnt tiefer und schneller
- 🎯 **Pixelgenaue Kollisionen**, in Teilschritten berechnet, sodass nichts durch etwas anderes hindurchfliegt
- ⏱️ **Deterministische Engine mit festem Zeitschritt** – `step(state, dtMs, input)` mit einem Seed-RNG im Zustand
- 🔊 **Synthetisierter Sound** (Web Audio): der Vier-Noten-Marsch, Schüsse, Explosionen, UFO-Trillern – mit Sound-Schalter
- 📱 **Touch-Spiel** – auf dem Spielfeld ziehen, um die Kanone zu bewegen, dazu eine **Feuer**-Taste mit Dauerfeuer beim Halten; das Layout passt auf 360-px-Handys
- 📖 **Regeldialog** mit einem Diagramm der Punkte pro Invasoren-Reihe (beim Öffnen pausiert das Spiel)
- 🏁 **Vorzeitig beenden** – ein Spiel absichtlich beenden und den aktuellen Punktestand in die Bestenliste aufnehmen
- ⛶ **Vollbild**-Schalter (CSS-Vollbildmodus auf dem iPhone)
- 💾 **Autospeichern & Fortsetzen** – Formation, Bunker, Bomben, UFO und RNG werden gespeichert; Tab mitten in der Welle schließen und später weitermachen
- 🏆 **Einheitliche Arcade-Statistik** – Bestwert, Spiele, Gesamtzeit, geteilt mit dem Portal
- 🌗 **Dunkles / helles Theme**, in jedem Arcade-Spiel gleich (Taste **T**); das Canvas liest seine Farben bei jedem Wechsel neu ein
- 🌍 **Drei Sprachen** – Englisch, Ungarisch und Deutsch; umschaltbar in der oberen Leiste oder in den Einstellungen (auch `?lang=en|hu|de` zur Übergabe per Link); Zahlen folgen der Gruppierung der jeweiligen Sprache
- 🦷 **Zahnmodus** – ein Schalter „Fogas mód“ / „Dental mode“ / „Zahnmodus“ in den Einstellungen, standardmäßig aus (oder `?dental=1`), arcadeweit geteilt: Die Invasoren sind Bakterien, die Kanone eine Zahnbürste mit Zahnpasta, und die Bunker sind Zähne, die wie bei Karies erodieren; nur die Darstellung
- 🤖 **Attract-Mode-Demo** (`<SpaceInvadersDemo />`) – die echte Engine, geflogen von einem Autopiloten, der zielt, feuert und ausweicht
- 🧪 **Getestet** – 86 Vitest-Tests: Engine-Regeln, Kollisionen, Autopilot, Speicher-Validator, Komponenten- und Demo-Tests

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Space-Invaders-Game.git
cd Space-Invaders-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Asset-Pfade, daher kann `dist/` aus jedem Unterordner ausgeliefert werden.

## ⌨️ Steuerung

| Taste | Aktion |
| --- | --- |
| ⬅️ ➡️ / **A D** | Kanone bewegen |
| **Leertaste** / **Enter** | Feuern (halten für Dauerfeuer) · Start · Fortsetzen |
| **P** / **Esc** | Pause / Fortsetzen |
| **R** | Neustart |
| **M** | Sound an / aus |
| **T** | Dunkles / helles Theme umschalten (eigenständige Seite) |

Mit der Maus kannst du auch auf das Spielfeld drücken: Die Kanone gleitet unter den Mauszeiger und feuert, solange du gedrückt hältst. Es kann immer nur **ein Schuss** im Spielfeld sein –
wie im Original kostet ein Fehlschuss Zeit. Das Spiel pausiert von selbst, wenn der Tab verborgen wird. Die Knöpfe **Regeln**, **Beenden** und **Vollbild** findest du im Panel „Spiel“.

**Auf dem Handy:** Zieh den Finger über das Spielfeld, um die Kanone zu bewegen, und halte darunter die **Feuer**-Taste für Dauerfeuer gedrückt (ein Tipp feuert einen Schuss; beide Daumen funktionieren gleichzeitig).
Der Knopf **Regeln** öffnet die Regeln mit einem Punktediagramm, **Beenden** wertet deinen aktuellen Punktestand, **Vollbild** blendet die Browserleisten aus. Auf dem iPhone kannst du die Seite zum Home-Bildschirm hinzufügen, um sie ohne Browserleisten zu sehen.

## 🎯 Punkte & Statistik

| Ziel | Punkte |
| --- | --- |
| 🦑 Tintenfisch (oberste Reihe) | **30** |
| 🦀 Krabbe (Reihen 2–3) | **20** |
| 🐙 Krake (Reihen 4–5) | **10** |
| 🛸 Mysteriöses UFO | **50 / 100 / 150 / 300** (Wahrscheinlichkeiten 3 : 4 : 2 : 1, aus dem Seed-RNG) |

Eine komplette Welle bringt 990 Punkte. Bei **1.500** Punkten gibt es einmalig eine **Bonuskanone**. Ein Spiel endet, wenn die letzte Kanone
zerstört ist **oder** die Invasoren die Reihe der Kanone erreichen (sie landen – Game Over, egal wie viele Leben noch übrig sind). Die Wellen wiederholen sich endlos,
jede beginnt eine Reihe tiefer (begrenzt auf fünf Absenkungen) und marschiert und bombardiert etwas schneller.

| Welle | 1 | 2 | 3 | 4 | 5 | 6+ |
| --- | --- | --- | --- | --- | --- | --- |
| Oberkante der Formation (px) | 44 | 52 | 60 | 68 | 76 | 84 |
| Ticks pro Marschschritt (55 Invasoren) | 44 | 40 | 36 | 32 | 28 | 24 |

Wenn ein Spiel endet, speichert das Kit es genau einmal in `localStorage` unter `arcade.stats.invaders`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`) mit dem Ergebnis `over` (Highscore-Jagd) oder `finished`, wenn das Spiel mit **Beenden** vorzeitig beendet wurde (der angezeigte Punktestand zählt, auch 0).

## 💾 Autospeichern & Fortsetzen

Solange ein Spiel läuft, wird es etwa einmal pro Sekunde sowie beim Verbergen der Seite oder beim Entfernen des Spiels gespeichert
(Schlüssel `arcade.session.invaders`, mit Schema-Version). Der Spielstand enthält die komplette Simulation – Formation, Marsch-Timer, Schüsse,
Bomben, UFO, Effekte, Leben, Welle, Punkte und den RNG-Seed – wobei die 55 Invasoren als `0`/`1`-String und die 16 × 22-Pixelmaske jedes Bunkers
als 96 Hex-Ziffern gepackt sind (ein Spielstand ist deutlich kleiner als 2 KB). Ein strenger Validator (`src/logic/persist.ts`) prüft jedes
Feld, seinen Wertebereich und die feldübergreifende Konsistenz, bevor ein Spielstand als vertrauenswürdig gilt. Beim Neuladen erscheint **Willkommen zurück** mit dem wiederhergestellten
Spiel im Pausenzustand. **Verwerfen** neben dem Hinweis *Automatisch gespeichert* wirft den Spielstand weg. Beendete Spiele löschen ihren Spielstand automatisch.

## 🧩 Einbindung in Arcade-Game-Center

```tsx
import { SpaceInvadersGame, SpaceInvadersDemo } from '@arcade/invaders';

<SpaceInvadersGame
  embedded                                   // Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score, info) => submitScore('invaders', score)}   // info.finished: mit „Beenden“ vorzeitig beendet
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<SpaceInvadersDemo active={cardIsVisible} />  // Attract-Mode für die Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`.
Das Spielfeld skaliert auf seinen Container (es passt in die Inhaltsspalte des Portals und auf ein 360-px-Handy).

## 🧠 So funktioniert es

Zustandsautomat: `idle → running ↔ paused → gameOver → (Neustart) → running`. Solange `running` gilt, verfolgt eine `phase`
die Zustände `play`, `dying` (die Kanone explodiert, alles andere friert ein) und `waveClear` (eine kurze Verschnaufpause vor der nächsten Welle).

**Engine.** Alles liegt in einem reinen `GameState` auf einem festen logischen Feld von 224 × 240. `step(state, dtMs, input)` addiert die
verstrichene Zeit zu einem Akkumulator und führt ganze `tick`s von 1/60 s aus, sodass derselbe Seed mit denselben Eingaben immer identisch abläuft.
Ein Tick: Kanone bewegen → Schuss erzeugen / Pixel für Pixel vorrücken (Bomben → Invasoren → UFO → Bunker → oberer Rand) → Marsch →
Bomben in Teilschritten von ≤ 1 px vorrücken (Kanone → Bunker → Boden) → eventuell eine Bombe werfen → UFO bewegen oder starten.

**Marsch.** Die Formation bewegt sich pro Schritt um 2 px; ein Schritt geschieht alle `round(alive × base / 55)` Ticks und wird daher schneller, je mehr
Invasoren sterben (ein einziger Überlebender marschiert in jedem Tick). Am Rand sinkt sie um 8 px und dreht um. Wie im Original friert sie ein, solange ein
Invasor explodiert, und die Invasoren zermahlen jeden Bunkerpixel, den sie überlappen.

**Bomben.** Höchstens drei sind gleichzeitig in der Luft. Ein Nachlade-Timer (in späteren Wellen kürzer, mit Seed-Jitter) lässt die nächste
Bombe der Rotation Roller → Stößel → Schlängler vom untersten Invasor einer Spalte fallen: Die rollende Bombe wählt die lebende Spalte,
die der Kanone am nächsten ist, die anderen eine zufällige lebende Spalte. Bomben werden schneller, wenn weniger als neun Invasoren übrig sind.

**Kollisionen & Bunker.** Sprites sind 1-Bit-Masken (ein Integer-Bitmuster pro Zeile), jede Kollision ist also ein pixelgenaues
Shift-und-AND. Bunker bestehen aus 16 Zeilen mit 22-Bit-Masken; ein Treffer löscht die Pixel unter einem Explosions-Sprite, was die
bekannten ausgefransten Löcher schneidet.

**Rendering.** Ein `<canvas>`, dessen Puffer ein ganzzahliges Vielfaches der logischen Größe ist (scharf bei jedem
devicePixelRatio) und per CSS skaliert wird. Die Farben kommen aus den Arcade-CSS-Tokens (`--game-invaders`, `--text-strong`, `--ok`,
`--danger`, …) und werden bei jeder Änderung von `data-theme` neu gelesen. Eine `requestAnimationFrame`-Schleife (Frames auf 50 ms begrenzt)
rechnet die in einem Ref gehaltene Simulation und zeichnet sie direkt; React rendert nur bei HUD-Änderungen und einem 10-Hz-Snapshot neu,
der das Autospeichern speist.

**Autopilot (Demo).** Wählt die nächstgelegene Spalte (oder das UFO), hält vor, wie weit sich das Ziel bewegt, während der Schuss aufsteigt,
und feuert, wenn es passt. In jedem Tick simuliert er die fallenden Bomben 60 Ticks voraus für vier Pläne – zum Ziel gehen, stehen bleiben,
nach links oder nach rechts ausweichen – und nimmt den ersten Plan, bei dem er nie getroffen wird.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Logik- und Komponententests) |
| `npm run check` | lint → typecheck → test → build (das, was die CI ausführt) |

## 🏗️ Architektur

```
src/
  arcade/                  eingebundenes Kit von Zoltan's Arcade – hier nicht bearbeiten (siehe dessen README)
  logic/                   reine Spielregeln (ohne React)
    constants.ts types.ts  Spielfeldgeometrie, Zeiten, Zustandsform
    sprites.ts             1-Bit-Pixel-Art-Masken + pixelgenaue Überlappung
    bunkers.ts             Bunkermasken, Erosion, kompakte Hex-Kodierung
    formation.ts           Invasoren-Raster, Punkte, Marschtempo, Starthöhe der Welle
    rng.ts                 Seed-basierter Mulberry32 (Zustand bleibt im GameState)
    game.ts                createInitialState, tick, step, runTicks, togglePause
    autopilot.ts           Ziel- / Feuer- / Ausweichlogik für die Demo
    persist.ts             kompaktes Speicherformat + strenger Validator
  audio/                   Web-Audio-Synth (sound.ts) und reine Abbildung Zustand → Klang (cues.ts)
  hooks/                   useAnimationFrame, useInvadersKeyboard, useCanvasPalette
  components/              GameCanvas (voll + mini), render.ts, SpriteIcon
  rules.tsx                Inhalt und Diagramm des Regeldialogs
  demo/SpaceInvadersDemo.tsx  Attract-Mode für die Startseite
  SpaceInvadersGame.tsx    das einbettbare Spiel (ArcadeGameProps)
  App.tsx                  eigenständige Seite: <ArcadeShell><SpaceInvadersGame/></ArcadeShell>
  main.tsx                 Einstieg; lädt das gemeinsame arcade.css einmal
  index.ts                 Paket-Einstieg für Arcade-Game-Center
```

## 🤝 Mitwirken

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Die Mitwirkenden stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md), die Änderungen im [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
