import type { ComponentId, Diagnostic, PortRef } from '@gatecraft/engine';
import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import { getShape, pinWorldPosition } from '../model/kinds.js';
import { useAppStore } from '../model/store.js';

/**
 * Live diagnostics panel — the user-facing surface of the engine's debugging
 * channel. Lists every current diagnostic, color-coded by severity, with
 * click-to-focus that selects the affected component and pans the viewport
 * so the marker is on screen.
 */
export function DiagnosticsPanel(): JSX.Element {
  const compile = useAppStore((s) => s.compiled.diagnostics);
  const sim = useAppStore((s) => s.simDiagnostics);
  const locale = useAppStore((s) => s.locale);
  void locale;
  const [collapsed, setCollapsed] = useState(false);
  const all: readonly Diagnostic[] = [...compile, ...sim];
  const listRef = useRef<HTMLDivElement | null>(null);
  // When a new diagnostic appears, scroll the list to the bottom so the
  // freshest entry is visible without the user having to chase it.
  useEffect(() => {
    if (collapsed || all.length === 0) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [all.length, collapsed]);
  if (all.length === 0) return <Empty />;

  const counts = countByKind(all);

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        bottom: 34,
        width: 280,
        maxHeight: '40vh',
        background: 'rgba(20, 24, 32, 0.94)',
        border: '1px solid #3a2a2a',
        borderRadius: 10,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: '#2a1d1d',
          border: 'none',
          color: '#fca5a5',
          font: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span>⚠ {t('diagnostics.title', { n: all.length })}</span>
        <span style={{ fontSize: 10, color: '#9aa4b2' }}>{collapsed ? '▶' : '▼'}</span>
      </button>
      <div
        style={{
          padding: '4px 12px',
          fontSize: 10,
          color: '#9aa4b2',
          background: '#1a1212',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {Object.entries(counts).map(([k, n]) => (
          <span key={k}>
            <strong style={{ color: severityColor(k as Diagnostic['kind']) }}>{n}</strong> {k}
          </span>
        ))}
      </div>
      {!collapsed ? (
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
          {all.map((d, i) => (
            <DiagnosticRow key={i} diag={d} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Empty(): JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        bottom: 34,
        padding: '6px 12px',
        background: 'rgba(20, 24, 32, 0.85)',
        border: '1px solid #1f3220',
        borderRadius: 8,
        fontSize: 11,
        color: '#86efac',
        backdropFilter: 'blur(6px)',
      }}
    >
      ✓ {t('diagnostics.empty')}
    </div>
  );
}

function DiagnosticRow({ diag }: { diag: Diagnostic }): JSX.Element {
  const summary = describeDiagnostic(diag);
  const color = severityColor(diag.kind);

  return (
    <button
      onClick={() => focusOnDiagnostic(diag)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        borderTop: '1px solid #1f2632',
        color: '#e6e6e6',
        padding: '8px 12px',
        cursor: 'pointer',
        font: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#252b38';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: 999,
            background: color,
          }}
        />
        <strong style={{ fontSize: 11, color }}>{diag.kind}</strong>
        <span style={{ fontSize: 10, color: '#7c8696' }}>{summary.target}</span>
      </div>
      <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.4 }}>{summary.detail}</div>
    </button>
  );
}

function severityColor(kind: Diagnostic['kind']): string {
  switch (kind) {
    case 'width-mismatch':
      return '#f59e0b';
    case 'multi-driver':
      return '#ef4444';
    case 'oscillation':
      return '#a855f7';
    case 'floating-input':
      return '#3b82f6';
    case 'composite-cycle':
      return '#ef4444';
    case 'composite-depth-exceeded':
      return '#f59e0b';
  }
}

function describeDiagnostic(d: Diagnostic): { target: string; detail: string } {
  switch (d.kind) {
    case 'width-mismatch':
      return {
        target: t('diagnostics.target.widthMismatch', {
          port: `${d.port.componentId.slice(0, 8)}:${d.port.portName}`,
        }),
        detail: t('diagnostics.detail.widthMismatch', { got: d.got, expected: d.expected }),
      };
    case 'multi-driver':
      return {
        target: t('diagnostics.target.multiDriver', {
          n: d.drivers.length,
          net: d.net.slice(0, 6),
        }),
        detail: t('diagnostics.detail.multiDriver'),
      };
    case 'oscillation':
      return {
        target: t('diagnostics.target.oscillation', { n: d.nets.length }),
        detail: t('diagnostics.detail.oscillation'),
      };
    case 'floating-input':
      return {
        target: t('diagnostics.target.floatingInput', {
          port: `${d.port.componentId.slice(0, 8)}:${d.port.portName}`,
        }),
        detail: t('diagnostics.detail.floatingInput'),
      };
    case 'composite-cycle':
      return {
        target: t('diagnostics.target.compositeCycle'),
        detail: t('diagnostics.detail.compositeCycle', { chain: d.chain.join(' → ') }),
      };
    case 'composite-depth-exceeded':
      return {
        target: t('diagnostics.target.compositeDepth'),
        detail: t('diagnostics.detail.compositeDepth', { depth: d.depth }),
      };
  }
}

function countByKind(diags: readonly Diagnostic[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of diags) out[d.kind] = (out[d.kind] ?? 0) + 1;
  return out;
}

/**
 * Select the diagnostic's component and pan the viewport so the offending
 * marker is centered in the visible canvas.
 */
function focusOnDiagnostic(diag: Diagnostic): void {
  const store = useAppStore.getState();
  let componentId: ComponentId | undefined;
  let port: PortRef | undefined;
  if (diag.kind === 'width-mismatch' || diag.kind === 'floating-input') {
    componentId = diag.port.componentId;
    port = diag.port;
  } else if (diag.kind === 'multi-driver') {
    const first = diag.drivers[0];
    componentId = first?.componentId;
    port = first;
  } else if (diag.kind === 'oscillation') {
    const firstNetId = diag.nets[0];
    const net = firstNetId ? store.compiled.netlist.nets.get(firstNetId) : undefined;
    const refs = net ? [...net.drivers, ...net.sinks] : [];
    const first = refs[0];
    componentId = first?.componentId;
    port = first;
  }
  if (!componentId) return;
  store.setSelection([componentId]);
  // Pan so the affected port (or component center) lands near screen center.
  if (port) {
    const comp = store.document.components.find((c) => c.id === port!.componentId);
    if (!comp) return;
    const shape = getShape(comp.kind, comp.params);
    const world = pinWorldPosition(comp.position, shape, port.portName);
    const viewport = store.viewport;
    const targetScreenX = window.innerWidth / 2;
    const targetScreenY = window.innerHeight / 2;
    const panX = world.x - targetScreenX / viewport.zoom;
    const panY = world.y - targetScreenY / viewport.zoom;
    store.setViewport({ ...viewport, panX, panY });
    // Ask the renderer to flash a halo at that world point so the user
    // visually catches what we just panned to.
    window.dispatchEvent(
      new CustomEvent('gatecraft:pulse-at', { detail: { x: world.x, y: world.y } }),
    );
  }
}
