import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from 'react';
import {
  clearSession,
  formatClock,
  formatNumber,
  gameName,
  GameOverlay,
  KeyHelp,
  readString,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useDental,
  useKitMessages,
  useLang,
  useMessages,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  writeString,
  type ArcadeGameProps,
  type OverlayAction,
  type SessionEnvelope,
} from './arcade';
import { MESSAGES, type InvadersMessageKey } from './i18n';
import { soundCues } from './audio/cues';
import { InvadersSound } from './audio/sound';
import { GameCanvas, type GameCanvasHandle } from './components/GameCanvas';
import { GERM_FOR } from './components/dentalDraw';
import { GermIcon, SpriteIcon } from './components/SpriteIcon';
import { TouchControls, type TouchKey } from './components/TouchControls';
import { useAnimationFrame } from './hooks/useAnimationFrame';
import { useInvadersKeyboard } from './hooks/useInvadersKeyboard';
import { EXTRA_LIFE_SCORE, PLAYER_W } from './logic/constants';
import { createInitialState, NO_INPUT, step, togglePause } from './logic/game';
import { fromSaved, isSavedInvaders, toSaved, type SavedGame } from './logic/persist';
import { ALIEN_SPRITES, UFO_SPRITE } from './logic/sprites';
import type { GameState, Input } from './logic/types';
import styles from './App.module.css';

/** Bump when SavedGame changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;
/** The React snapshot (HUD, overlay, autosave) is refreshed at least this often while playing. */
const SYNC_MS = 100;
const SOUND_KEY = 'invaders.sound';

const keyRows = (t: (key: InvadersMessageKey) => string): [string, string][] => [
  ['← →', t('keyMove')],
  [t('kbdSpace'), t('keyFire')],
  ['P Esc', t('keyPause')],
  ['R', t('keyRestart')],
  ['M', t('keySound')],
];

const POINTS = [
  { mask: ALIEN_SPRITES.squid[0], label: '30', tone: 'squid', germ: GERM_FOR.squid },
  { mask: ALIEN_SPRITES.crab[0], label: '20', tone: 'alien', germ: GERM_FOR.crab },
  { mask: ALIEN_SPRITES.octopus[0], label: '10', tone: 'alien', germ: GERM_FOR.octopus },
  { mask: UFO_SPRITE, label: '50 – 300', tone: 'ufo', germ: null },
] as const;

function bootState(restored: SessionEnvelope<SavedGame> | null): GameState {
  if (!restored) return createInitialState();
  return { ...fromSaved(restored.data), status: 'paused', acc: 0 };
}

function freshSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x100000000)) >>> 0;
}

/** Let go of every held control (new run, pause, tab hidden). */
function releaseInput(ref: MutableRefObject<Input>): void {
  ref.current = { ...NO_INPUT };
}

/** Fields the React snapshot must pick up immediately. */
function hudChanged(a: GameState, b: GameState): boolean {
  return a.status !== b.status || a.score !== b.score || a.lives !== b.lives || a.wave !== b.wave || a.phase !== b.phase;
}

export function SpaceInvadersGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const name = gameName('invaders', lang);
  const num = (n: number) => formatNumber(n, lang);
  const restored = useRestoredSession<SavedGame>('invaders', SESSION_SCHEMA, isSavedInvaders);
  const [boot] = useState(() => bootState(restored));
  /** React's copy of the run: drives the HUD, overlays and autosave. */
  const [view, setView] = useState<GameState>(boot);
  /** The live simulation, advanced every animation frame without re-rendering. */
  const liveRef = useRef<GameState>(boot);
  const lastSyncRef = useRef(0);
  const inputRef = useRef<Input>({ ...NO_INPUT });
  const canvasRef = useRef<GameCanvasHandle>(null);
  const soundRef = useRef<InvadersSound | null>(null);
  const [runId, setRunId] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(restored !== null);
  const [soundOn, setSoundOn] = useState(() => readString(SOUND_KEY) !== 'off');
  const soundLabelId = useId();
  const dentalHintId = useId();
  const [dental, setDental] = useDental();
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  const status = view.status;
  const seconds = useRunTimer(status === 'running', runId, runId === 0 ? (restored?.seconds ?? 0) : 0);

  // Waves repeat forever, so a run only ends by losing (score attack).
  const stats = useArcadeRun({
    gameId: 'invaders',
    status,
    score: view.score,
    seconds,
    runKey: runId,
    outcome: 'over',
    props,
  });

  const inProgress = status === 'running' || status === 'paused';
  const saveData = useMemo(() => toSaved(view), [view]);
  const savedAt = useSessionAutosave({
    gameId: 'invaders',
    schema: SESSION_SCHEMA,
    enabled: inProgress,
    discard: status === 'gameOver',
    data: saveData,
    seconds,
    score: view.score,
  });

  /** Replace the run (start, pause, restore…): live state and snapshot together. */
  const commit = useCallback((next: GameState) => {
    liveRef.current = next;
    lastSyncRef.current = Date.now();
    setView(next);
  }, []);

  const unlockSound = useCallback(() => {
    if (!soundOnRef.current) return;
    if (!soundRef.current) soundRef.current = new InvadersSound(true);
    soundRef.current.unlock();
  }, []);

  const onFrame = useCallback((dt: number) => {
    const prev = liveRef.current;
    const next = step(prev, dt, inputRef.current);
    if (next === prev) return;
    liveRef.current = next;
    canvasRef.current?.draw(next);
    const sound = soundRef.current;
    if (sound) {
      for (const cue of soundCues(prev, next)) sound.play(cue);
      sound.setUfo(next.status === 'running' && next.phase === 'play' && next.ufo !== null);
    }
    const now = Date.now();
    if (hudChanged(prev, next) || now - lastSyncRef.current >= SYNC_MS) {
      lastSyncRef.current = now;
      setView(next);
    }
  }, []);

  useAnimationFrame(status === 'running', onFrame);

  useEffect(() => {
    if (status !== 'running') soundRef.current?.setUfo(false);
  }, [status]);

  useEffect(() => {
    soundRef.current?.setEnabled(soundOn);
  }, [soundOn]);

  useEffect(() => () => soundRef.current?.dispose(), []);

  const startNewRun = useCallback(() => {
    setWelcomeBack(false);
    setRunId((id) => id + 1);
    releaseInput(inputRef);
    commit(createInitialState({ status: 'running', seed: freshSeed() }));
    unlockSound();
  }, [commit, unlockSound]);

  const togglePauseRun = useCallback(() => {
    const s = liveRef.current;
    if (s.status !== 'running' && s.status !== 'paused') return;
    setWelcomeBack(false);
    releaseInput(inputRef);
    commit(togglePause(s));
    if (s.status === 'paused') unlockSound();
  }, [commit, unlockSound]);

  const primary = useCallback(() => {
    const s = liveRef.current.status;
    if (s === 'idle' || s === 'gameOver') startNewRun();
    else togglePauseRun();
  }, [startNewRun, togglePauseRun]);

  const discardSave = useCallback(() => {
    clearSession('invaders');
    setWelcomeBack(false);
    releaseInput(inputRef);
    commit(createInitialState());
    setRunId((id) => id + 1);
  }, [commit]);

  const toggleSound = useCallback(() => {
    const next = !soundOnRef.current;
    soundOnRef.current = next;
    writeString(SOUND_KEY, next ? 'on' : 'off');
    setSoundOn(next);
  }, []);

  useEffect(() => {
    if (soundOn && liveRef.current.status === 'running') unlockSound();
  }, [soundOn, unlockSound]);

  // Leaving the tab pauses the run (and the autosave flushes it).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && liveRef.current.status === 'running') {
        releaseInput(inputRef);
        commit(togglePause(liveRef.current));
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [commit]);

  useInvadersKeyboard({
    inputRef,
    isPlaying: () => liveRef.current.status === 'running',
    onPrimary: primary,
    onTogglePause: togglePauseRun,
    onRestart: startNewRun,
    onToggleSound: toggleSound,
  });

  const onAim = useCallback((x: number | null, firing: boolean) => {
    const input = inputRef.current;
    if (liveRef.current.status !== 'running') return;
    input.targetX = x === null ? null : x - PLAYER_W / 2;
    input.fire = firing;
  }, []);

  const readLive = useCallback(() => liveRef.current, []);

  const onTouch = useCallback((key: TouchKey, pressed: boolean) => {
    inputRef.current[key] = pressed;
  }, []);

  const best = Math.max(stats.best, view.score);
  const newBest = view.score > 0 && view.score > stats.bestBeforeRun;

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (status === 'idle') {
    overlay = {
      title: name,
      message: t('idleBody', { score: num(EXTRA_LIFE_SCORE) }),
      actions: [{ label: k('start'), onClick: startNewRun, primary: true, kbd: t('kbdSpace') }],
    };
  } else if (status === 'paused') {
    overlay = welcomeBack
      ? {
          title: k('welcomeBack'),
          message: t('welcomeBody', { score: num(view.score), wave: num(view.wave), time: formatClock(seconds) }),
          actions: [
            { label: t('continue'), onClick: togglePauseRun, primary: true, kbd: 'P' },
            { label: k('newGame'), onClick: startNewRun, kbd: 'R' },
          ],
        }
      : {
          title: k('paused'),
          message: t('pausedBody'),
          actions: [
            { label: k('resume'), onClick: togglePauseRun, primary: true, kbd: 'P' },
            { label: k('restart'), onClick: startNewRun, kbd: 'R' },
          ],
        };
  } else if (status === 'gameOver') {
    overlay = {
      title: k('gameOver'),
      message: `${view.invaded ? `${t('invaded')} ` : ''}${t(newBest ? 'overBodyNewBest' : 'overBody', {
        score: num(view.score),
        wave: num(view.wave),
        best: num(best),
      })}`,
      actions: [{ label: t('playAgain'), onClick: startNewRun, primary: true, kbd: 'R' }],
    };
  }

  const statusLabel =
    status !== 'running' ? undefined : view.phase === 'dying' ? t('hit') : view.phase === 'waveClear' ? t('waveClear') : undefined;

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-invaders)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{name}</h1>
            <p className="arc-game__sub">{t('sub')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={[
          { label: k('score'), value: num(view.score) },
          { label: k('best'), value: num(best), highlight: newBest },
          { label: t('wave'), value: num(view.wave) },
          { label: t('lives'), value: num(view.lives) },
          { label: k('time'), value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.boardCol}>
          <div className={`arc-game__board ${styles.boardWrap}`}>
            <GameCanvas ref={canvasRef} state={view} source={readLive} onAim={onAim} />
            {overlay && <GameOverlay {...overlay} />}
          </div>
          <TouchControls onChange={onTouch} disabled={status !== 'running'} />
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={primary}>
                {status === 'running' ? k('pause') : status === 'paused' ? k('resume') : k('start')}
              </button>
              <button type="button" className="arc-btn" onClick={startNewRun} disabled={status === 'idle'}>
                {k('restart')}
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={inProgress ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelPoints')}</h2>
            <ul className={styles.points}>
              {POINTS.map((p) => (
                <li key={p.label}>
                  {dental && p.germ ? (
                    <GermIcon kind={p.germ} className={styles[p.tone]} />
                  ) : (
                    <SpriteIcon mask={p.mask} className={styles[p.tone]} />
                  )}
                  <span>= {p.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelSettings')}</h2>
            <div className={styles.setting}>
              <span id={soundLabelId}>{t('sound')}</span>
              <div className="arc-segmented" role="group" aria-labelledby={soundLabelId}>
                <button type="button" aria-pressed={soundOn} onClick={() => !soundOn && toggleSound()}>
                  {t('on')}
                </button>
                <button type="button" aria-pressed={!soundOn} onClick={() => soundOn && toggleSound()}>
                  {t('off')}
                </button>
              </div>
            </div>
            <label className={`arc-field ${styles.setting}`}>
              <span>{k('dental')}</span>
              <input
                type="checkbox"
                checked={dental}
                aria-describedby={dentalHintId}
                onChange={(e) => setDental(e.target.checked)}
              />
            </label>
            <p id={dentalHintId} className={styles.settingHint}>
              {t('dentalHint')}
            </p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelKeys')}</h2>
            <KeyHelp rows={keyRows(t)} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default SpaceInvadersGame;
