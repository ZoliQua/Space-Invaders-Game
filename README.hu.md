# 👾 Space Invaders

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

Hűséges, típusbiztos Space Invaders **React 18**, **Vite** és **TypeScript** alapokon – pixelgrafikás `<canvas>` pálya, amelyet tiszta, fix időlépésű motor hajt, játékkeretrendszer nélkül.
Önállóan fut, **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyike – [játssz vele a portálon](https://dulzoltan.hu/arcade/#/play/invaders).

[![CI](https://github.com/ZoliQua/Space-Invaders-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Space-Invaders-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#-a-zoltans-arcade-család)
- [Funkciók](#-funkciók)
- [Gyors kezdés](#-gyors-kezdés)
- [Irányítás](#%EF%B8%8F-irányítás)
- [Pontozás és statisztika](#-pontozás-és-statisztika)
- [Automatikus mentés és folytatás](#-automatikus-mentés-és-folytatás)
- [Beágyazás az Arcade-Game-Centerbe](#-beágyazás-az-arcade-game-centerbe)
- [Hogyan működik](#-hogyan-működik)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-felépítés)
- [Közreműködés](#-közreműködés)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is bekapcsolódik. Közös a dizájnrendszerük, a pontozási modelljük és a mentési formátumuk a beágyazott [`src/arcade/`](./src/arcade) készleten keresztül.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Logikai |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütős |
| 👾 **Space Invaders** (ez a repó) | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logika |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 👾 **A klasszikus alakzat** – 5 sor × 11 űrlény (tintahal, rák, polip) pixelgrafikás sprite-okként, kétfázisú menetelő animációval
- 🥁 **A menetelés felgyorsul**, ahogy az alakzat megritkul – az utolsó űrlény száguld át a képernyőn
- 💣 **Háromféle bomba** (gördülő, dugattyús, kígyózó), egyszerre legfeljebb három a levegőben; a gördülő bomba az ágyúdat vadássza
- 🧱 **Négy szétmorzsolódó bunker**, pixelenkénti erózióval a bombáktól, a saját lövéseidtől és az átmenetelő űrlényektől
- 🛸 **Rejtélyes ufó**, amely kb. 25 másodpercenként húz el felül, értéke 50 / 100 / 150 / 300
- ❤️ **3 ágyú + egy extra ágyú 1 500 pontnál**; minden új hullám lejjebb indul, és gyorsabb
- 🎯 **Pixelpontos ütközések**, részlépésekben számolva, így semmi sem megy át semmin
- ⏱️ **Fix időlépésű, determinisztikus motor** – `step(state, dtMs, input)`, az állapotban tárolt, magolt véletlenszám-generátorral
- 🔊 **Szintetizált hang** (Web Audio): a négy hangos menet, lövések, robbanások, az ufó trillázása – hangkapcsolóval
- 📱 **Érintéses játék** – húzd az ujjad a pályán az ágyú mozgatásához, mellé egy **Tűz** gomb, amely nyomva tartva folyamatosan lő; az elrendezés ráfér a 360 px-es telefonokra
- 📖 **Szabályok párbeszédablak** ábrával az űrlénysoronkénti pontokról (megnyitásakor a játék szünetel)
- 🏁 **Idő előtti befejezés** – szándékosan befejezheted a játékot, és a jelenlegi pontszám felkerül a ranglistára
- ⛶ **Teljes képernyő** gomb (CSS-es teljes képernyős mód iPhone-on)
- 💾 **Automatikus mentés és folytatás** – az alakzat, a bunkerek, a bombák, az ufó és a véletlenszám-generátor is mentődik; zárd be a lapot egy hullám közepén, és később folytasd
- 🏆 **Egységes arcade statisztika** – rekord, játékok száma, összidő, megosztva a portállal
- 🌗 **Sötét / világos téma**, minden arcade játékban közös (**T** billentyű); a canvas minden váltáskor újraolvassa a színeit
- 🌍 **Három nyelv** – angol, magyar és német; a felső sávban vagy a beállításokban váltható (linkkel átadható az `?lang=en|hu|de` paraméterrel is); a számok a nyelv csoportosítását követik
- 🦷 **Fogas mód** – „Fogas mód” / „Dental mode” / „Zahnmodus” kapcsoló a beállításokban, alapból kikapcsolva (vagy `?dental=1`), az egész arcade-ban közös: az űrlények baktériumok, az ágyú fogkrémet lövő fogkefe, a bunkerek pedig fogak, amelyek úgy erodálódnak, mint a szuvasodás; csak a megjelenés változik
- 🤖 **Bemutató (attract) demó** (`<SpaceInvadersDemo />`) – a valódi motort egy automata pilóta vezeti, amely céloz, lő és kitér
- 🧪 **Tesztelt** – 86 Vitest teszt: motorszabályok, ütközések, automata pilóta, mentésellenőrző, komponens- és demóteszt

## 🚀 Gyors kezdés

**Node ≥ 20** és npm szükséges.

```bash
git clone https://github.com/ZoliQua/Space-Invaders-Game.git
cd Space-Invaders-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív elérési utakat használ, így a `dist/` bármely almappából kiszolgálható.

## ⌨️ Irányítás

| Billentyű | Művelet |
| --- | --- |
| ⬅️ ➡️ / **A D** | Az ágyú mozgatása |
| **Szóköz** / **Enter** | Lövés (nyomva tartva folyamatosan lősz) · indítás · folytatás |
| **P** / **Esc** | Szünet / folytatás |
| **R** | Újrakezdés |
| **M** | Hang be / ki |
| **T** | Sötét / világos téma váltása (önálló oldalon) |

Egérrel a pályára is rányomhatsz: az ágyú az egérmutató alá csúszik, és addig lő, amíg nyomva tartod. Egyszerre csak **egy lövés** lehet a pályán –
ahogy az eredetiben, egy mellé lőtt lövés időbe kerül. A játék magától szünetel, ha a lap rejtve van. A **Szabályok**, **Befejezés** és **Teljes képernyő** gombok a Játék panelen vannak.

**Telefonon:** húzd az ujjad a pályán az ágyú mozgatásához, és tartsd nyomva alatta a **Tűz** gombot a folyamatos lövéshez (egy koppintás egy lövés; két hüvelykujjal egyszerre is megy).
A **Szabályok** gomb megnyitja a szabályokat egy pontozási ábrával, a **Befejezés** a jelenlegi pontszámodat rangsorolja, a **Teljes képernyő** eltünteti a böngészősávokat. iPhone-on add hozzá az oldalt a Főképernyőhöz, hogy böngészősávok nélkül lásd.

## 🎯 Pontozás és statisztika

| Cél | Pont |
| --- | --- |
| 🦑 Tintahal (felső sor) | **30** |
| 🦀 Rák (2–3. sor) | **20** |
| 🐙 Polip (4–5. sor) | **10** |
| 🛸 Rejtélyes ufó | **50 / 100 / 150 / 300** (esély 3 : 4 : 2 : 1, a magolt véletlenszám-generátorból) |

Egy teljes hullám 990 pontot ér. Egyszeri **extra ágyút** **1 500** pontnál kapsz. A játék akkor ér véget, ha az utolsó ágyú
megsemmisül, **vagy** az űrlények elérik az ágyú sorát (leszállnak – vége a játéknak, akárhány élet maradt). A hullámok örökké ismétlődnek,
mindegyik egy sorral lejjebb indul (öt lépés után már nem megy lejjebb), és kicsit gyorsabban menetel és bombáz.

| Hullám | 1 | 2 | 3 | 4 | 5 | 6+ |
| --- | --- | --- | --- | --- | --- | --- |
| Az alakzat teteje (px) | 44 | 52 | 60 | 68 | 76 | 84 |
| Tick / menetlépés (55 űrlény) | 44 | 40 | 36 | 32 | 28 | 24 |

Amikor egy játék véget ér, a készlet pontosan egyszer rögzíti a `localStorage`-ban az `arcade.stats.invaders` kulcs alatt
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`), `over` kimenettel (pontvadászat), vagy `finished` kimenettel, ha a játékot a **Befejezés** gombbal idő előtt zártad le (a képernyőn látható pontszám számít, a 0 is).

## 💾 Automatikus mentés és folytatás

Amíg egy játék folyamatban van, nagyjából másodpercenként egyszer, valamint az oldal elrejtésekor vagy a játék eltávolításakor mentődik
(`arcade.session.invaders` kulcs, sémaverzióval). A mentés a teljes szimulációt tartalmazza – alakzat, menet-időzítő, lövések,
bombák, ufó, effektek, életek, hullám, pontszám és a véletlenszám-generátor magja –, az 55 űrlény egy `0`/`1` sztringbe, minden bunker 16 × 22 pixeles maszkja
pedig 96 hexa számjegybe csomagolva (egy mentés jóval 2 KB alatt marad). Egy szigorú ellenőrző (`src/logic/persist.ts`) minden
mezőt, annak tartományát és a mezők közötti összhangot ellenőrzi, mielőtt egy mentésben megbíznánk. Újratöltéskor az **Üdv újra!** ablak jelenik meg a visszaállított,
szüneteltetett játékkal. Az *Automatikusan mentve* jelzés melletti **Elvetés** eldobja a mentést. A befejezett játékok automatikusan törlik a mentésüket.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { SpaceInvadersGame, SpaceInvadersDemo } from '@arcade/invaders';

<SpaceInvadersGame
  embedded                                   // az oldalcím elrejtése; a portál mutatja
  onGameOver={(score, info) => submitScore('invaders', score)}   // info.finished: a Befejezéssel idő előtt lezárva
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<SpaceInvadersDemo active={cardIsVisible} />  // nyitóoldali bemutató mód
```

Mindkét komponens a `src/arcade/types.ts` közös `ArcadeGameProps` / `ArcadeDemoProps` szerződését követi.
A pálya a tárolójához igazodik (belefér a portál tartalmi oszlopába és egy 360 px-es telefonra).

## 🧠 Hogyan működik

Állapotgép: `idle → running ↔ paused → gameOver → (újraindítás) → running`. Amíg `running`, egy `phase` követi a
`play`, a `dying` (az ágyú felrobban, minden más megáll) és a `waveClear` (rövid lélegzetvétel a következő hullám előtt) szakaszt.

**Motor.** Minden egy tiszta `GameState`-ben él, egy fix, 224 × 240-es logikai mezőn. A `step(state, dtMs, input)` hozzáadja az
eltelt időt egy akkumulátorhoz, és egész 1/60 s-os `tick`eket futtat, így ugyanaz a mag és ugyanazok a bemenetek mindig azonosan játszódnak le.
Egy tick: ágyú mozgatása → lövés indítása / továbbléptetése pixelenként (bombák → űrlények → ufó → bunkerek → felső szél) → menet →
bombák továbbléptetése ≤ 1 px-es részlépésekben (ágyú → bunkerek → talaj) → esetleg egy bomba ledobása → az ufó mozgatása vagy indítása.

**Menet.** Az alakzat lépésenként 2 px-t mozdul; egy lépés `round(alive × base / 55)` tickenként történik, így gyorsul, ahogy
az űrlények elhullanak (egyetlen túlélő minden tickben lép). A szélen 8 px-t süllyed, és megfordul. Az eredetihez hasonlóan megáll, amíg egy
űrlény felrobban, és az űrlények lemorzsolják azokat a bunkerpixeleket, amelyekkel átfedésbe kerülnek.

**Bombák.** Egyszerre legfeljebb három lehet a levegőben. Egy újratöltés-időzítő (a későbbi hullámokban rövidebb, magolt véletlen ingadozással) a gördülő → dugattyús → kígyózó
sorrend következő bombáját engedi el egy oszlop legalsó űrlényéből: a gördülő bomba az ágyúhoz legközelebbi élő oszlopot választja,
a többi egy véletlen élő oszlopot. A bombák gyorsulnak, ha kilencnél kevesebb űrlény maradt.

**Ütközések és bunkerek.** A sprite-ok 1 bites maszkok (soronként egy egész szám bitmintája), így minden ütközés pixelpontos
eltolás-és-ÉS művelet. A bunkerek 16 sornyi, 22 bites maszkból állnak; egy találat törli a robbanás-sprite alatti pixeleket, ami a
jól ismert, szaggatott lyukakat vájja.

**Megjelenítés.** Egy `<canvas>`, amelynek háttérpuffere a logikai méret egész számú többszöröse (éles bármilyen
devicePixelRatio mellett), és CSS skálázza. A színek az arcade CSS-tokenekből jönnek (`--game-invaders`, `--text-strong`, `--ok`,
`--danger`, …), és a `data-theme` minden változásakor újraolvasódnak. Egy `requestAnimationFrame` ciklus (a képkockák 50 ms-ra korlátozva)
lépteti a ref-ben tartott szimulációt, és közvetlenül rajzolja ki; a React csak HUD-változáskor és egy 10 Hz-es pillanatképnél renderel újra,
amely az automatikus mentést táplálja.

**Automata pilóta (demó).** A legközelebbi oszlopot (vagy az ufót) választja, előre számol azzal, mennyit mozdul a cél, amíg a lövés felfelé tart,
és lő, ha egy vonalba kerül. Minden tickben 60 tickkel előre szimulálja a hulló bombákat négy tervre – menj a célhoz, maradj,
fuss balra, fuss jobbra –, és az első olyan tervet választja, amelyben sosem találják el.

## 🧪 Szkriptek

| Szkript | Cél |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logikai és komponensek tesztjei) |
| `npm run check` | lint → typecheck → test → build (amit a CI futtat) |

## 🏗️ Felépítés

```
src/
  arcade/                  beágyazott Zoltan's Arcade készlet – itt ne szerkeszd (lásd a README-jét)
  logic/                   tiszta játékszabályok (React nélkül)
    constants.ts types.ts  pályageometria, időzítések, állapotszerkezet
    sprites.ts             1 bites pixelgrafikás maszkok + pixelpontos átfedés
    bunkers.ts             bunkermaszkok, erózió, tömör hexa kódolás
    formation.ts           űrlényrács, pontok, menetsebesség, a hullám kezdőmagassága
    rng.ts                 magolt Mulberry32 (az állapot a GameState-ben marad)
    game.ts                createInitialState, tick, step, runTicks, togglePause
    autopilot.ts           célzó / lövő / kitérő vezérlő a demóhoz
    persist.ts             tömör mentési formátum + szigorú ellenőrző
  audio/                   Web Audio szintetizátor (sound.ts) és az állapot → hangjel leképezés (cues.ts)
  hooks/                   useAnimationFrame, useInvadersKeyboard, useCanvasPalette
  components/              GameCanvas (teljes + mini), render.ts, SpriteIcon
  rules.tsx                a szabályok ablak tartalma és ábrája
  demo/SpaceInvadersDemo.tsx  nyitóoldali bemutató mód
  SpaceInvadersGame.tsx    a beágyazható játék (ArcadeGameProps)
  App.tsx                  önálló oldal: <ArcadeShell><SpaceInvadersGame/></ArcadeShell>
  main.tsx                 belépési pont; egyszer tölti be a közös arcade.css-t
  index.ts                 csomagbelépő az Arcade-Game-Centerhez
```

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md)-t, az [Etikai kódexet](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md)-t.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md)-ben, a változások a [CHANGELOG.md](./CHANGELOG.md)-ben találhatók.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Készítette ❤️-vel Zoltán Dul · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
