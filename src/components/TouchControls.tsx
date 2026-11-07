import type { PointerEvent as ReactPointerEvent } from 'react';
import { useMessages } from '../arcade';
import { MESSAGES, type InvadersMessageKey } from '../i18n';
import styles from './TouchControls.module.css';

export type TouchKey = 'left' | 'right' | 'fire';

type Props = {
  onChange: (key: TouchKey, pressed: boolean) => void;
  disabled?: boolean;
};

/** Arrow buttons show a glyph; Fire shows its translated caption. */
const BUTTONS: { key: TouchKey; label: InvadersMessageKey; glyph?: string }[] = [
  { key: 'left', label: 'touchLeft', glyph: '◀' },
  { key: 'fire', label: 'touchFire' },
  { key: 'right', label: 'touchRight', glyph: '▶' },
];

/**
 * Hold-to-act buttons for touch screens (shown only on coarse pointers via
 * CSS). Pointer capture keeps a press alive while the thumb slides a little.
 */
export function TouchControls({ onChange, disabled = false }: Props) {
  const t = useMessages(MESSAGES);
  const press = (key: TouchKey) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onChange(key, true);
  };
  const release = (key: TouchKey) => () => onChange(key, false);

  return (
    <div className={styles.touch} role="group" aria-label={t('touchGroup')}>
      {BUTTONS.map((b) => (
        <button
          key={b.key}
          type="button"
          className={`arc-btn ${b.key === 'fire' ? 'arc-btn--primary' : ''} ${styles.btn}`}
          aria-label={t(b.label)}
          disabled={disabled}
          onPointerDown={press(b.key)}
          onPointerUp={release(b.key)}
          onPointerCancel={release(b.key)}
          onLostPointerCapture={release(b.key)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {b.glyph ?? t('touchFireText')}
        </button>
      ))}
    </div>
  );
}
