import type { ComponentId, SignalValue } from '@gatecraft/engine';
import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';
import type { SimClient } from '../workers/sim-client.js';
import { SURFACE } from './palette-tokens.js';

/**
 * Waveform viewer — bottom panel that records the live snapshot value
 * of selected output ports over time and renders a classic time-series
 * trace per signal.
 *
 * V1 captures into an in-memory ring buffer (no worker plumbing), so it
 * only reflects the values seen while the panel is open + running. Each
 * trace is rendered into a canvas: rows = signals, x-axis = ticks.
 *
 * Selection model: every output port of every selected component is
 * recorded. If no components are selected, the panel falls back to
 * tracking every `output` / `led` / `probe` pin in the document.
 */

const HISTORY_LIMIT = 512;

interface TraceSample {
  readonly t: number; // tick index (monotonic)
  readonly bits: bigint; // truncated to width
  readonly x: bigint; // unknown bits
  readonly z: bigint; // hi-Z bits
  readonly width: number;
}

interface Trace {
  readonly portKey: string;
  readonly label: string;
  readonly samples: TraceSample[];
}

export function WaveformPanel(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const traces = useRef<Map<string, Trace>>(new Map());
  const tickRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [, force] = useState(0);

  const document_ = useAppStore((s) => s.document);
  const selection = useAppStore((s) => s.selection);
  const snap = useAppStore((s) => s.simSnapshot);
  const netlist = useAppStore((s) => s.compiled.netlist);
  const running = useAppStore((s) => s.running);

  useEffect(() => {
    const onOpen = (): void => setOpen(true);
    window.addEventListener('gatecraft:open-waveform', onOpen);
    const onKey = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('gatecraft:open-waveform', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Determine the set of ports to track.
  const tracked = useTrackedPorts(document_, selection.componentIds as ReadonlySet<ComponentId>);

  // On every snapshot, append a sample. We don't trust subscribe order, so
  // we drive purely off the snapshot's `tick` field when present.
  useEffect(() => {
    if (!open || !snap || !netlist) return;
    const tick = snap.tick ?? ++tickRef.current;
    for (const entry of tracked) {
      const netId = netlist.portToNet.get(entry.portKey as never);
      if (!netId) continue;
      const value = snap.nets.get(netId);
      if (!value) continue;
      let trace = traces.current.get(entry.label);
      if (!trace) {
        trace = { portKey: entry.portKey, label: entry.label, samples: [] };
        traces.current.set(entry.label, trace);
      }
      trace.samples.push({
        t: tick,
        bits: value.value,
        x: value.unknown,
        z: value.hiZ,
        width: value.width,
      });
      if (trace.samples.length > HISTORY_LIMIT) trace.samples.shift();
    }
    // Drop traces for ports no longer in the set.
    for (const key of [...traces.current.keys()]) {
      if (!tracked.some((p) => p.label === key)) traces.current.delete(key);
    }
    force((n) => n + 1);
  }, [snap, open, netlist, tracked]);

  // Render every tick.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !open) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(0, 0, cssW, cssH);

    const tracesArr = [...traces.current.values()];
    if (tracesArr.length === 0) {
      ctx.fillStyle = '#7c8696';
      ctx.font = `12px ui-sans-serif, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('waveform.empty'), cssW / 2, cssH / 2);
      return;
    }

    const labelW = 80;
    const rowH = (cssH - 12) / tracesArr.length;
    const traceW = cssW - labelW - 8;
    // Time range = newest 200 samples (or fewer).
    const maxSamples = Math.min(
      HISTORY_LIMIT,
      Math.max(...tracesArr.map((tr) => tr.samples.length), 1),
    );
    const stepX = traceW / Math.max(1, maxSamples - 1);

    tracesArr.forEach((tr, row) => {
      const y0 = 6 + row * rowH;
      const yMid = y0 + rowH / 2;
      const high = y0 + 6;
      const low = y0 + rowH - 6;
      // Label.
      ctx.fillStyle = '#a8b4c7';
      ctx.font = `10px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tr.label.slice(0, 14), 6, yMid);
      // Baseline.
      ctx.strokeStyle = '#1f2632';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(labelW, low);
      ctx.lineTo(cssW - 4, low);
      ctx.stroke();
      // Trace path. We render as a step-line on the low/high rails.
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let prevY: number | null = null;
      tr.samples.forEach((s, i) => {
        const x = labelW + i * stepX;
        const widthMask = (1n << BigInt(s.width)) - 1n;
        let y: number;
        if (s.x !== 0n) y = (high + low) / 2;
        else if ((s.z & widthMask) === widthMask) y = (high + low) / 2;
        else y = (s.bits & 1n) === 1n ? high : low;
        if (prevY === null) {
          ctx.moveTo(x, y);
        } else {
          if (prevY !== y) ctx.lineTo(x, prevY);
          ctx.lineTo(x, y);
        }
        prevY = y;
      });
      ctx.stroke();
    });
  });

  if (!open) return null;

  return (
    <div
      className="gc-slide-up"
      role="region"
      aria-label={t('waveform.title')}
      style={{
        position: 'absolute',
        left: 304,
        right: 16,
        bottom: 30,
        height: 220,
        background: SURFACE.chromeBg,
        border: SURFACE.chromeBorder,
        borderRadius: 10,
        backdropFilter: SURFACE.chromeBlur,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 6,
        boxShadow: '0 -4px 14px rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderBottom: '1px solid #2a3548',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: '#dde4ef' }}>
          {t('waveform.title')}{' '}
          <span style={{ color: '#7c8696', fontWeight: 400, marginLeft: 6 }}>
            {running ? '●' : '○'} {traces.current.size} {t('waveform.signals')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => {
              traces.current.clear();
              tickRef.current = 0;
              force((n) => n + 1);
            }}
            style={pillBtn}
          >
            {t('waveform.clear')}
          </button>
          <button
            onClick={() => {
              // Pull the last 512 ticks from the worker — useful when the
              // panel was opened mid-run and the in-memory buffer is empty.
              const client = (window as unknown as { __sim?: SimClient }).__sim;
              if (!client) return;
              const offHistory = client.onHistory((wireTraces) => {
                offHistory();
                for (const [pk, samples] of wireTraces) {
                  const entry = [...tracked].find((p) => p.portKey === pk);
                  const label = entry?.label ?? pk;
                  traces.current.set(label, {
                    portKey: pk,
                    label,
                    samples: samples.map((s) => ({
                      t: s.tick,
                      bits: s.value.value,
                      x: s.value.unknown,
                      z: s.value.hiZ,
                      width: s.value.width,
                    })),
                  });
                }
                force((n) => n + 1);
              });
              client.requestHistory(tracked.map((p) => p.portKey));
            }}
            title={t('waveform.refreshTooltip')}
            style={pillBtn}
          >
            {t('waveform.refresh')}
          </button>
          <button onClick={() => setOpen(false)} style={pillBtn}>
            ×
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

const pillBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #2a3548',
  color: '#cbd5e1',
  borderRadius: 5,
  padding: '3px 8px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 11,
};

function useTrackedPorts(
  doc: ReturnType<typeof useAppStore.getState>['document'],
  selectedIds: ReadonlySet<ComponentId>,
): readonly { portKey: string; label: string }[] {
  // Selected components → all their outputs.
  // Otherwise → every `output` / `led` / `probe` pin (the natural sinks).
  const out: { portKey: string; label: string }[] = [];
  if (selectedIds.size > 0) {
    for (const c of doc.components) {
      if (!selectedIds.has(c.id)) continue;
      // Without registry access here, we hard-code the most common output names.
      for (const port of ['out', 'q', 'sum', 'co', 'cout', 'lo', 'hi']) {
        out.push({
          portKey: `${c.id}::${port}`,
          label: `${c.kind}:${String(c.params['name'] ?? c.id.slice(0, 4))}:${port}`,
        });
      }
    }
  } else {
    for (const c of doc.components) {
      if (c.kind === 'output' || c.kind === 'led' || c.kind === 'probe') {
        out.push({
          portKey: `${c.id}::in`,
          label: String(c.params['name'] ?? c.id.slice(0, 8)),
        });
      }
    }
  }
  return out;
}
