/**
 * Global keyboard shortcuts cheatsheet. Opens on `?` (or `Shift+/`)
 * and from the Toolbar overflow menu. Grouped by surface so the
 * reader can scan it.
 */

import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { ModalCloseButton } from './ModalCloseButton.js';

type Group = {
  title: string;
  rows: { keys: string; label: string }[];
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

function groups(): Group[] {
  return [
    {
      title: t('shortcuts.group.general'),
      rows: [
        { keys: '?', label: t('shortcuts.openCheatsheet') },
        { keys: `${MOD}+S`, label: t('shortcuts.save') },
        { keys: `${MOD}+P`, label: t('shortcuts.quickOpen') },
        { keys: `${MOD}+F`, label: t('shortcuts.fitView') },
        { keys: `${MOD}+/`, label: t('shortcuts.restartTour') },
      ],
    },
    {
      title: t('shortcuts.group.edit'),
      rows: [
        { keys: `${MOD}+Z`, label: t('shortcuts.undo') },
        { keys: `${MOD}+Shift+Z`, label: t('shortcuts.redo') },
        { keys: 'Delete · Backspace', label: t('shortcuts.deleteSel') },
        { keys: 'R', label: t('shortcuts.rotateSel') },
        { keys: `${MOD}+C`, label: t('shortcuts.copy') },
        { keys: `${MOD}+V`, label: t('shortcuts.paste') },
        { keys: `${MOD}+D`, label: t('shortcuts.duplicate') },
        { keys: `${MOD}+A`, label: t('shortcuts.selectAll') },
        { keys: '↑ ↓ ← →', label: t('shortcuts.nudge') },
      ],
    },
    {
      title: t('shortcuts.group.sim'),
      rows: [
        { keys: 'Space', label: t('shortcuts.playPause') },
        { keys: 'Shift+Space', label: t('shortcuts.step') },
      ],
    },
    {
      title: t('shortcuts.group.tabs'),
      rows: [
        { keys: `${MOD}+T`, label: t('shortcuts.newTab') },
        { keys: `${MOD}+W`, label: t('shortcuts.closeTab') },
      ],
    },
  ];
}

export function ShortcutsModal(): JSX.Element | null {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = (): void => setOpen(true);
    window.addEventListener('nandbench:open-shortcuts', onOpen);
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === '?' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        // Skip when typing inside a text input or contenteditable.
        const tgt = ev.target as HTMLElement | null;
        const tag = tgt?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tgt?.isContentEditable) return;
        ev.preventDefault();
        setOpen((o) => !o);
      } else if (open && ev.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('nandbench:open-shortcuts', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;
  const data = groups();
  return (
    <div
      className="gc-fade-in"
      onClick={() => setOpen(false)}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7, 9, 12, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="gc-modal-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 'min(560px, 92vw)',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#0f1115',
          border: '1px solid #2a3548',
          borderRadius: 12,
          padding: 22,
          color: '#e6e6e6',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <ModalCloseButton onClick={() => setOpen(false)} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t('shortcuts.title')}</div>
          <div style={{ fontSize: 12, color: '#9aa4b2', marginTop: 6 }}>
            {t('shortcuts.subtitle')}
          </div>
        </div>
        {data.map((g) => (
          <section key={g.title}>
            <div
              style={{
                fontSize: 11,
                color: '#7ea7d7',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 6,
              }}
            >
              {g.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {g.rows.map((r) => (
                <div
                  key={r.keys}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '5px 4px',
                    borderBottom: '1px solid #161b25',
                  }}
                >
                  <kbd
                    style={{
                      background: '#0c1018',
                      border: '1px solid #2a3548',
                      borderRadius: 5,
                      padding: '2px 8px',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 11,
                      color: '#facc15',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.keys}
                  </kbd>
                  <span style={{ fontSize: 12, color: '#dde4ef' }}>{r.label}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
