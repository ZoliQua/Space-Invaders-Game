import type { ReactNode } from 'react';
import { formatNumber, useDental, useIsTouch, useKitMessages, useLang, useMessages, type RulesSection } from './arcade';
import { GERM_FOR } from './components/dentalDraw';
import { GermIcon, SpriteIcon } from './components/SpriteIcon';
import { EXTRA_LIFE_SCORE, UFO_POINTS } from './logic/constants';
import { ALIEN_POINTS } from './logic/formation';
import { ALIEN_SPRITES, UFO_SPRITE } from './logic/sprites';
import type { AlienKind } from './logic/types';
import { MESSAGES } from './i18n';

const ROWS: { kind: AlienKind; rows: [number, number] }[] = [
  { kind: 'squid', rows: [1, 1] },
  { kind: 'crab', rows: [2, 3] },
  { kind: 'octopus', rows: [4, 5] },
];
const ROW_H = 30;
const SCALE = 3;

/** Rules diagram: the sprite of each invader row with its points (shape + number, never colour alone). */
export function WaveDiagram() {
  const m = useMessages(MESSAGES);
  const [dental] = useDental();
  const [lang] = useLang();
  const num = (n: number) => formatNumber(n, lang);
  const ufoRange = `${num(UFO_POINTS[0])} – ${num(UFO_POINTS[UFO_POINTS.length - 1])}`;
  return (
    <svg
      viewBox="0 0 240 124"
      role="img"
      aria-label={m('rulesDiagramLabel', {
        squid: num(ALIEN_POINTS.squid),
        crab: num(ALIEN_POINTS.crab),
        octopus: num(ALIEN_POINTS.octopus),
        ufoMin: num(UFO_POINTS[0]),
        ufoMax: num(UFO_POINTS[UFO_POINTS.length - 1]),
      })}
      style={{ width: '100%', maxWidth: 300, height: 'auto', display: 'block', margin: '8px auto' }}
    >
      {ROWS.map(({ kind, rows }, i) => {
        const y = 4 + i * ROW_H;
        const label = rows[0] === rows[1] ? num(rows[0]) : `${num(rows[0])}–${num(rows[1])}`;
        return (
          <g key={kind}>
            <text x={10} y={y + 17} fontSize="12" fill="var(--text)">
              {m('rulesDiagramRow', { rows: label })}
            </text>
            <g transform={`translate(88 ${y})`} style={{ color: 'var(--game-invaders)' }}>
              {dental ? (
                <GermIcon kind={GERM_FOR[kind]} scale={SCALE} />
              ) : (
                <SpriteIcon mask={ALIEN_SPRITES[kind][0]} scale={SCALE} />
              )}
            </g>
            <text x={140} y={y + 18} fontSize="14" fontWeight="700" fill="var(--text)">
              = {num(ALIEN_POINTS[kind])}
            </text>
          </g>
        );
      })}
      <g>
        <text x={10} y={4 + 3 * ROW_H + 17} fontSize="12" fill="var(--text)">
          {m('rulesDiagramUfo')}
        </text>
        <g transform={`translate(88 ${4 + 3 * ROW_H + 2})`} style={{ color: 'var(--danger)' }}>
          <SpriteIcon mask={UFO_SPRITE} scale={2} />
        </g>
        <text x={140} y={4 + 3 * ROW_H + 18} fontSize="14" fontWeight="700" fill="var(--text)">
          = {ufoRange}
        </text>
      </g>
    </svg>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the diagram and its hook belong together
export function useRulesSections(): RulesSection[] {
  const m = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (n: number) => formatNumber(n, lang);
  const ios = typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);
  const mobile: ReactNode = (
    <ul>
      <li>{m('rulesMobileDrag')}</li>
      <li>{m('rulesMobileFire')}</li>
      <li>{m('rulesMobileFs')}</li>
      {ios && <li>{k('iosHomeScreenTip')}</li>}
    </ul>
  );
  const [u1, u2, u3, u4] = UFO_POINTS;
  return [
    {
      id: 'goal',
      body: (
        <>
          <p>{m('rulesGoal')}</p>
          <WaveDiagram />
        </>
      ),
    },
    { id: 'play', body: <p>{touch ? m('rulesPlayTouch') : m('rulesPlayKeys')}</p> },
    {
      id: 'rules',
      body: (
        <ul>
          <li>{m('rulesRulesShot')}</li>
          <li>{m('rulesRulesBunkers')}</li>
          <li>{m('rulesRulesLand')}</li>
        </ul>
      ),
    },
    {
      id: 'scoring',
      body: (
        <p>
          {m('rulesScoringText', {
            squid: num(ALIEN_POINTS.squid),
            crab: num(ALIEN_POINTS.crab),
            octopus: num(ALIEN_POINTS.octopus),
            u1: num(u1),
            u2: num(u2),
            u3: num(u3),
            u4: num(u4),
            bonus: num(EXTRA_LIFE_SCORE),
          })}
        </p>
      ),
    },
    { id: 'dental', body: <p>{m('rulesDentalText')}</p> },
    { id: 'mobile', body: mobile },
  ];
}
