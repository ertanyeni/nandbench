import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';

/**
 * History inspector — shows the active tab's undo + redo stacks as a
 * vertical timeline. Click any past entry to "jump back" (multi-undo).
 * Click any future entry to redo up to it.
 *
 * Opens via the `nandbench:open-history` window event.
 */
export function HistoryPanel(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const history = useAppStore((s) => s.history);
  const redoStack = useAppStore((s) => s.redoStack);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);

  useEffect(() => {
    const onOpen = (): void => {
      window.dispatchEvent(
        new CustomEvent('nandbench:close-side-panels', { detail: { except: 'history' } }),
      );
      setOpen(true);
    };
    const onCloseSiblings = (ev: Event): void => {
      const except = (ev as CustomEvent<{ except?: string }>).detail?.except;
      if (except !== 'history') setOpen(false);
    };
    window.addEventListener('nandbench:open-history', onOpen);
    window.addEventListener('nandbench:close-side-panels', onCloseSiblings);
    const onKey = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('nandbench:open-history', onOpen);
      window.removeEventListener('nandbench:close-side-panels', onCloseSiblings);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  // Rewind to a specific point — call `undo` enough times to bring us to
  // the target index. Going "forward" into the redo stack calls `redo`.
  const rewindTo = (idx: number): void => {
    // history[idx] is the command we want as the *latest*. Pop until then.
    const steps = history.length - 1 - idx;
    for (let i = 0; i < steps; i++) undo();
  };
  const forwardTo = (idx: number): void => {
    // redoStack[0] is the next command to redo. Reach `idx` from the end.
    const steps = redoStack.length - idx;
    for (let i = 0; i < steps; i++) redo();
  };

  return (
    <div
      className="gc-fade-in"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 110,
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      <div
        className="gc-slide-right"
        role="complementary"
        aria-label={t('history.title')}
        style={{
          width: 'min(360px, 85vw)',
          height: '100%',
          background: '#0f1115',
          borderLeft: '1px solid #2a3548',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 32px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #1f2632' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e6e6e6' }}>
                {t('history.title')}
              </div>
              <div style={{ fontSize: 11, color: '#9aa4b2', marginTop: 4, lineHeight: 1.5 }}>
                {t('history.subtitle')}
              </div>
              <div style={{ fontSize: 10, color: '#7c8696', marginTop: 6 }}>
                {history.length} {t('history.past')} · {redoStack.length} {t('history.future')}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t('assistant.close')}
              title={t('assistant.close')}
              style={{
                background: 'transparent',
                border: '1px solid #2a3548',
                color: '#9aa4b2',
                borderRadius: 5,
                padding: '3px 8px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '6px 4px 16px' }}>
          {/* Future (redo) — newest first. */}
          {redoStack.length > 0 ? (
            <div style={{ padding: '8px 12px 4px', fontSize: 10, color: '#9aa4b2', textTransform: 'uppercase', letterSpacing: 0.7 }}>
              {t('history.future')}
            </div>
          ) : null}
          {[...redoStack]
            .reverse()
            .map((cmd, i) => (
              <Row
                key={`f${i}`}
                label={cmd.label}
                tone="future"
                onClick={() => forwardTo(redoStack.length - 1 - i)}
              />
            ))}
          {/* Present marker. */}
          <div
            style={{
              fontSize: 10,
              color: '#86efac',
              fontWeight: 700,
              padding: '8px 12px 4px',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              borderTop: '1px dashed #243054',
              borderBottom: '1px dashed #243054',
              margin: '4px 4px',
              background: 'rgba(34,197,94,0.06)',
            }}
          >
            ● {t('history.now')}
          </div>
          {/* Past (history) — newest first. */}
          {history.length > 0 ? (
            <div style={{ padding: '8px 12px 4px', fontSize: 10, color: '#9aa4b2', textTransform: 'uppercase', letterSpacing: 0.7 }}>
              {t('history.past')}
            </div>
          ) : null}
          {[...history].reverse().map((cmd, i) => {
            const idx = history.length - 1 - i;
            return (
              <Row
                key={`p${i}`}
                label={cmd.label}
                tone="past"
                onClick={() => rewindTo(idx - 1)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: 'past' | 'future';
  onClick: () => void;
}): JSX.Element {
  const color = tone === 'past' ? '#cbd5e1' : '#a8b4c7';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: 'calc(100% - 16px)',
        margin: '2px 8px',
        padding: '6px 10px',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 5,
        color,
        font: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1c2230')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: tone === 'past' ? '#4a5566' : '#3b6ec3' }}>{tone === 'past' ? '↶' : '↷'}</span>
      <span>{label}</span>
    </button>
  );
}
