import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';
import { suggestionsFor } from '../model/suggestions.js';
import { SURFACE } from './palette-tokens.js';

export function StatusBar(): JSX.Element {
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => {
    const handler = (): void => {
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1500);
    };
    window.addEventListener('gatecraft:saved-toast', handler);
    return () => window.removeEventListener('gatecraft:saved-toast', handler);
  }, []);
  const viewport = useAppStore((s) => s.viewport);
  const selection = useAppStore((s) => s.selection);
  const document = useAppStore((s) => s.document);
  const tool = useAppStore((s) => s.tool);
  const diagnostics = useAppStore((s) => s.compiled.diagnostics);
  const lastPlacedKind = useAppStore((s) => s.lastPlacedKind);
  const publishedFlash = useAppStore((s) => s.publishedFlash);
  const setPublishedFlash = useAppStore((s) => s.setPublishedFlash);
  const locale = useAppStore((s) => s.locale);
  void locale;

  // Auto-dismiss the publish toast after 5s so it doesn't linger forever.
  useEffect(() => {
    if (!publishedFlash) return;
    const id = window.setTimeout(() => setPublishedFlash(null), 5000);
    return () => window.clearTimeout(id);
  }, [publishedFlash, setPublishedFlash]);

  const zoomPct = Math.round(viewport.zoom * 100);
  const selCount = selection.componentIds.size;
  const selected =
    selCount === 1
      ? document.components.find((c) => selection.componentIds.has(c.id))
      : undefined;

  const toolLabel =
    tool.type === 'idle'
      ? t('statusBar.idle')
      : tool.type === 'place'
        ? t('statusBar.toolPlace', { kind: tool.kind })
        : tool.type === 'wire'
          ? t('statusBar.toolWire', {
              comp: String(tool.startPin.componentId).slice(0, 8),
              port: tool.startPin.portName,
            })
          : tool.type === 'marquee'
            ? t('statusBar.toolMarquee')
            : t('statusBar.toolMove', { n: tool.originalPositions.size });

  const diagCounts = countByKind(diagnostics);
  const diagLabel =
    diagnostics.length === 0
      ? t('statusBar.noDiagnostics')
      : Object.entries(diagCounts)
          .map(([k, n]) => `${n} ${k}`)
          .join(' · ');

  const suggestedKinds = lastPlacedKind ? suggestionsFor(lastPlacedKind).slice(0, 4) : [];
  const suggestionLabel =
    suggestedKinds.length > 0
      ? t('statusBar.suggestion', { kinds: suggestedKinds.map((k) => k.toUpperCase()).join(' · ') })
      : '';

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 24,
        padding: '4px 14px 4px 56px',
        background: SURFACE.chromeBg,
        borderTop: `1px solid ${SURFACE.borderColor}`,
        fontSize: 11,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        color: SURFACE.itemSubText,
        pointerEvents: 'none',
      }}
    >
      <span>{t('statusBar.zoom', { n: zoomPct })}</span>
      <span>{t('statusBar.pan', { x: viewport.panX.toFixed(0), y: viewport.panY.toFixed(0) })}</span>
      <span>{toolLabel}</span>
      <span style={{ color: diagnostics.length > 0 ? '#f59e0b' : '#9aa4b2' }}>{diagLabel}</span>
      {suggestionLabel ? (
        <span style={{ color: '#60a5fa' }}>{suggestionLabel}</span>
      ) : null}
      {savedFlash ? (
        <span
          className="gc-fade-in"
          style={{
            color: '#86efac',
            background: 'rgba(34,197,94,0.12)',
            padding: '2px 8px',
            borderRadius: 4,
            fontWeight: 700,
          }}
        >
          {t('statusBar.saved')}
        </span>
      ) : null}
      {publishedFlash ? (
        <button
          onClick={() => setPublishedFlash(null)}
          className="gc-fade-in"
          title={t('statusBar.publishedDismiss')}
          style={{
            color: '#dbeafe',
            background: 'rgba(96, 165, 250, 0.18)',
            border: '1px solid #3b6ec3',
            padding: '2px 10px',
            borderRadius: 4,
            fontWeight: 600,
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 11,
          }}
        >
          ↗ {t('statusBar.publishedToast', { name: publishedFlash.name })}
        </button>
      ) : null}
      <span style={{ marginLeft: 'auto' }}>
        {selCount === 0
          ? t('statusBar.noSelection')
          : selected
            ? t('statusBar.selectedSingle', { kind: selected.kind, id: selected.id.slice(0, 8) })
            : t('statusBar.selectedMulti', { n: selCount })}
      </span>
      <a
        href="https://github.com/ertanyeni/gatecraft"
        target="_blank"
        rel="noopener noreferrer"
        title={t('statusBar.sourceTitle')}
        style={{
          color: SURFACE.itemSubText,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          pointerEvents: 'auto',
        }}
      >
        <GithubMark />
        {t('statusBar.source')}
      </a>
    </div>
  );
}

function GithubMark(): JSX.Element {
  return (
    <svg width={12} height={12} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function countByKind(diags: readonly { kind: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of diags) out[d.kind] = (out[d.kind] ?? 0) + 1;
  return out;
}
