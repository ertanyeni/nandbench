import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import { LESSONS } from '../lessons.js';
import { PALETTE_CATEGORIES } from './Palette.js';
import { useAppStore } from '../model/store.js';
import type { ComponentParams } from '@nandbench/engine';

interface QuickItem {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly group: 'component' | 'library' | 'lesson' | 'action';
  readonly perform: () => void;
}

/**
 * Command palette — Cmd/Ctrl+P opens a global launcher that searches
 * across:
 *   - palette components (drops you into place-tool)
 *   - saved sub-circuits (library entries)
 *   - lessons (opens the lessons panel pointed at the match)
 *   - common actions (toggle palette, open assistant, etc.)
 *
 * Result rows are flat; the `group` field colors a 12px chip on the
 * left so the user knows which kind of action they're about to fire.
 */
export function QuickopenModal(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const library = useAppStore((s) => s.library);
  const setTool = useAppStore((s) => s.setTool);
  const locale = useAppStore((s) => s.locale);
  void locale;

  useEffect(() => {
    const onKey = (ev: KeyboardEvent): void => {
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'p' || ev.key === 'P' || ev.key === 'k' || ev.key === 'K')) {
        ev.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setActiveIdx(0);
      } else if (open && ev.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const items: readonly QuickItem[] = useMemo(() => {
    const out: QuickItem[] = [];
    // Components from palette spec.
    for (const cat of PALETTE_CATEGORIES) {
      for (const item of cat.items) {
        out.push({
          id: `c:${item.kind}`,
          label: item.label,
          hint: t(item.hintKey),
          group: 'component',
          perform: () => {
            setTool({
              type: 'place',
              kind: item.kind,
              params: item.params as ComponentParams,
              ghostWorld: null,
            });
          },
        });
      }
    }
    // Library saved circuits.
    for (const sc of library) {
      out.push({
        id: `l:${sc.id}`,
        label: sc.name,
        hint: t('quickopen.libraryHint'),
        group: 'library',
        perform: () => {
          setTool({
            type: 'place',
            kind: `composite:${sc.id}`,
            params: { refId: sc.id } as unknown as ComponentParams,
            ghostWorld: null,
          });
        },
      });
    }
    // Lessons.
    for (const lesson of LESSONS) {
      out.push({
        id: `s:${lesson.id}`,
        label: t(lesson.titleKey),
        hint: t('quickopen.lessonHint'),
        group: 'lesson',
        perform: () => window.dispatchEvent(new Event('nandbench:open-lessons')),
      });
    }
    // Built-in actions.
    out.push(
      {
        id: 'a:assistant',
        label: t('toolbar.assistantLong'),
        hint: t('quickopen.actionHint'),
        group: 'action',
        perform: () => window.dispatchEvent(new Event('nandbench:open-assistant')),
      },
      {
        id: 'a:glossary',
        label: t('toolbar.glossary'),
        hint: t('quickopen.actionHint'),
        group: 'action',
        perform: () => window.dispatchEvent(new Event('nandbench:open-glossary')),
      },
      {
        id: 'a:history',
        label: t('toolbar.history'),
        hint: t('quickopen.actionHint'),
        group: 'action',
        perform: () => window.dispatchEvent(new Event('nandbench:open-history')),
      },
      {
        id: 'a:waveform',
        label: t('toolbar.waveform'),
        hint: t('quickopen.actionHint'),
        group: 'action',
        perform: () => window.dispatchEvent(new Event('nandbench:open-waveform')),
      },
      {
        id: 'a:newCircuit',
        label: t('toolbar.newCircuitLong'),
        hint: t('quickopen.actionHint'),
        group: 'action',
        perform: () => window.dispatchEvent(new Event('nandbench:open-template-picker')),
      },
    );
    return out;
  }, [library, setTool]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 50);
    return items
      .filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.hint.toLowerCase().includes(q) ||
          it.group.includes(q),
      )
      .slice(0, 50);
  }, [items, query]);

  // Keep active index in range when filter shrinks.
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered, activeIdx]);

  if (!open) return null;

  const commit = (idx: number): void => {
    const it = filtered[idx];
    if (!it) return;
    setOpen(false);
    it.perform();
  };

  const onInputKey = (ev: React.KeyboardEvent<HTMLInputElement>): void => {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      commit(activeIdx);
    }
  };

  return (
    <div
      className="gc-fade-in"
      onClick={() => setOpen(false)}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7, 9, 12, 0.5)',
        zIndex: 220,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '12vh',
      }}
    >
      <div
        className="gc-modal-pop"
        role="dialog"
        aria-modal="true"
        aria-label={t('quickopen.title')}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 90vw)',
          maxHeight: '60vh',
          background: '#0f1115',
          border: '1px solid #2a3548',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={onInputKey}
          placeholder={t('quickopen.placeholder')}
          style={{
            background: '#0c1018',
            border: 'none',
            borderBottom: '1px solid #2a3548',
            color: '#dde4ef',
            padding: '12px 16px',
            font: 'inherit',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 16,
                color: '#7c8696',
                fontSize: 12,
                fontStyle: 'italic',
              }}
            >
              {t('quickopen.empty')}
            </div>
          ) : null}
          {filtered.map((it, i) => (
            <button
              key={it.id}
              onClick={() => commit(i)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                gap: 10,
                alignItems: 'center',
                width: '100%',
                background: i === activeIdx ? '#1f2632' : 'transparent',
                border: 'none',
                color: '#dde4ef',
                padding: '8px 14px',
                cursor: 'pointer',
                font: 'inherit',
                textAlign: 'left',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  fontWeight: 700,
                  color:
                    it.group === 'component'
                      ? '#86efac'
                      : it.group === 'library'
                        ? '#a78bfa'
                        : it.group === 'lesson'
                          ? '#60a5fa'
                          : '#f59e0b',
                  textAlign: 'left',
                }}
              >
                {it.group}
              </span>
              <span>{it.label}</span>
              <span style={{ fontSize: 11, color: '#7c8696' }}>{it.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
