import type { PointerEvent as ReactPointerEvent } from 'react';
import styles from './TouchControls.module.css';

export type TouchKey = 'left' | 'right' | 'fire';

type Props = {
  onChange: (key: TouchKey, pressed: boolean) => void;
  disabled?: boolean;
};

const BUTTONS: { key: TouchKey; label: string; text: string }[] = [
  { key: 'left', label: 'Move left', text: '◀' },
  { key: 'fire', label: 'Fire', text: 'FIRE' },
  { key: 'right', label: 'Move right', text: '▶' },
];

/**
 * Hold-to-act buttons for touch screens (shown only on coarse pointers via
 * CSS). Pointer capture keeps a press alive while the thumb slides a little.
 */
export function TouchControls({ onChange, disabled = false }: Props) {
  const press = (key: TouchKey) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onChange(key, true);
  };
  const release = (key: TouchKey) => () => onChange(key, false);

  return (
    <div className={styles.touch} role="group" aria-label="Touch controls">
      {BUTTONS.map((b) => (
        <button
          key={b.key}
          type="button"
          className={`arc-btn ${b.key === 'fire' ? 'arc-btn--primary' : ''} ${styles.btn}`}
          aria-label={b.label}
          disabled={disabled}
          onPointerDown={press(b.key)}
          onPointerUp={release(b.key)}
          onPointerCancel={release(b.key)}
          onLostPointerCapture={release(b.key)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {b.text}
        </button>
      ))}
    </div>
  );
}
