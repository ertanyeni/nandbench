import { useEffect, useMemo, useState } from 'react';
import {
  CATEGORY_LABEL_KEYS,
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
  type GlossaryTerm,
} from '../glossary.js';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';

/**
 * Right-side slide-in panel listing every glossary term with its definition.
 * Search box filters by name + description. Opens via Toolbar "sözlük"
 * button (window event), closes with Esc or backdrop.
 */
export function GlossaryPanel(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const locale = useAppStore((s) => s.locale);
  void locale;

  useEffect(() => {
    const onOpen = (): void => {
      window.dispatchEvent(
        new CustomEvent('gatecraft:close-side-panels', { detail: { except: 'glossary' } }),
      );
      setOpen(true);
    };
    const onCloseSiblings = (ev: Event): void => {
      const except = (ev as CustomEvent<{ except?: string }>).detail?.except;
      if (except !== 'glossary') setOpen(false);
    };
    window.addEventListener('gatecraft:open-glossary', onOpen);
    window.addEventListener('gatecraft:close-side-panels', onCloseSiblings);
    const onKey = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('gatecraft:open-glossary', onOpen);
      window.removeEventListener('gatecraft:close-side-panels', onCloseSiblings);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /**
   * Filter + bucket the glossary. Returned as an ordered list of
   * `[category, terms]` pairs so the panel can render a header per
   * category without empty sections.
   */
  const grouped = useMemo<readonly [GlossaryCategory, readonly GlossaryTerm[]][]>(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? GLOSSARY.filter(
          (term) =>
            t(term.nameKey).toLowerCase().includes(q) ||
            t(term.descKey).toLowerCase().includes(q),
        )
      : GLOSSARY;
    const buckets = new Map<GlossaryCategory, GlossaryTerm[]>();
    for (const term of filtered) {
      const arr = buckets.get(term.category);
      if (arr) arr.push(term);
      else buckets.set(term.category, [term]);
    }
    return GLOSSARY_CATEGORIES.filter((c) => buckets.has(c)).map(
      (c) => [c, buckets.get(c) as readonly GlossaryTerm[]] as const,
    );
  }, [query, locale]);
  const totalFiltered = useMemo(
    () => grouped.reduce((sum, [, ts]) => sum + ts.length, 0),
    [grouped],
  );

  if (!open) return null;

  /**
   * Split `text` around case-insensitive occurrences of `query` and wrap
   * each match in a yellow-on-dark <mark>. Empty query returns the raw
   * string. Regex is escaped so user input like `(` doesn't blow up.
   */
  function highlightMatches(text: string, q: string): React.ReactNode {
    const trimmed = q.trim();
    if (!trimmed) return text;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(re);
    return parts.map((p, i) =>
      i % 2 === 1 ? (
        <mark
          key={i}
          style={{
            background: 'rgba(250, 204, 21, 0.32)',
            color: '#fef9c3',
            borderRadius: 2,
            padding: '0 2px',
          }}
        >
          {p}
        </mark>
      ) : (
        p
      ),
    );
  }

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
        aria-label={t('glossary.title')}
        style={{
          width: 'min(420px, 90vw)',
          height: '100%',
          background: '#0f1115',
          borderLeft: '1px solid #1f2632',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 32px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #1f2632' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e6e6e6' }}>
                {t('glossary.title')}
              </div>
              <div style={{ fontSize: 11, color: '#9aa4b2', marginTop: 4, lineHeight: 1.5 }}>
                {t('glossary.subtitle')}
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
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('glossary.search')}
            style={{
              marginTop: 10,
              width: '100%',
              boxSizing: 'border-box',
              background: '#0c1018',
              border: '1px solid #1f2632',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#e6e6e6',
              font: 'inherit',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 4px 16px' }}>
          {totalFiltered === 0 ? (
            <div style={{ padding: '12px 16px', color: '#7c8696', fontSize: 12 }}>
              {t('glossary.empty')}
            </div>
          ) : (
            grouped.map(([category, terms]) => (
              <section key={category}>
                <div
                  style={{
                    padding: '14px 16px 6px',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#7ea7d7',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    borderBottom: '1px solid #161b25',
                    background: '#0c1018',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  {t(CATEGORY_LABEL_KEYS[category])}
                  <span style={{ marginLeft: 8, color: '#5b6675', fontWeight: 600 }}>
                    {terms.length}
                  </span>
                </div>
                {terms.map((term) => (
                  <div
                    key={term.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '10px 14px',
                      borderBottom: '1px solid #161b25',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e6e6e6' }}>
                      {highlightMatches(t(term.nameKey), query)}
                    </span>
                    <span
                      style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, lineHeight: 1.55 }}
                    >
                      {highlightMatches(t(term.descKey), query)}
                    </span>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
