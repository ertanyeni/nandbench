import {
  createRegistry,
  portKey,
  registerPrimitives,
  type ComponentId,
  type ComponentParams,
  type ComponentRegistry,
  type Diagnostic,
  type PortRef,
  type SignalValue,
} from '@gatecraft/engine';
import { useEffect, useState } from 'react';
import { UpdateParamsCommand } from '../commands/index.js';
import { t } from '../i18n/index.js';
import type { VisualComponent, VisualWire } from '../model/document.js';
import { helpForKind } from '../model/kind-help.js';
import { getShape } from '../model/kinds.js';
import { SURFACE } from './palette-tokens.js';
import { schemaForKind, type ParamField } from '../model/param-schema.js';
import { useAppStore } from '../model/store.js';

let cachedRegistry: ComponentRegistry | null = null;
function getRegistry(): ComponentRegistry {
  if (!cachedRegistry) {
    cachedRegistry = createRegistry();
    registerPrimitives(cachedRegistry);
  }
  return cachedRegistry;
}

export function Inspector(): JSX.Element | null {
  // Inspector follows the focused pane — when the user clicks into the
  // split canvas, this panel switches to that pane's document /
  // selection / diagnostics. Dispatch goes through the pane's own
  // dispatch action so param edits target the right document.
  const focused = useAppStore((s) => s.focusedPane);
  const document = useAppStore((s) => {
    if (focused === 'split' && s.splitDocumentId && s.splitDocumentId !== s.activeDocumentId) {
      return s.documents.get(s.splitDocumentId)?.document ?? s.document;
    }
    return s.document;
  });
  const selection = useAppStore((s) =>
    focused === 'split' ? s.splitSelection : s.selection,
  );
  const dispatch = useAppStore((s) => (focused === 'split' ? s.splitDispatch : s.dispatch));
  const compiled = useAppStore((s) => (focused === 'split' ? s.splitCompiled : s.compiled));
  const simDiagnostics = useAppStore((s) =>
    focused === 'split' ? s.splitSimDiagnostics : s.simDiagnostics,
  );

  const locale = useAppStore((s) => s.locale);
  void locale; // ensure re-render on locale flip

  const ids = [...selection.componentIds];
  if (ids.length === 0) return null;
  if (ids.length > 1) {
    return (
      <Frame>
        <Header>{t('inspector.multiSelected', { n: ids.length })}</Header>
        <Hint>{t('inspector.multiSelectedHint')}</Hint>
      </Frame>
    );
  }
  const component = document.components.find((c) => c.id === ids[0]);
  if (!component) return null;
  const schema = schemaForKind(component.kind);
  const localizedHelp = localizedHelpFor(component.kind);
  const fallbackHelp = helpForKind(component.kind);
  const help = localizedHelp ?? fallbackHelp;
  const headerText = help ? help.title : component.kind;
  const subhead = `${component.kind} · ${component.id.slice(0, 8)}`;

  const liveTab = (
    <>
      {(component.kind === 'input' || component.kind === 'button') ? (
        <DriveValueWidget component={component} />
      ) : null}
      <LiveValuesSection component={component} />
      <InternalStateSection component={component} />
      <MemoryDumpSection component={component} />
    </>
  );
  const paramsTab = (
    <>
      <CompositeEditSection component={component} />
      <LabelRow
        value={typeof component.params['label'] === 'string' ? component.params['label'] : ''}
        onCommit={(newLabel) => {
          const newParams: ComponentParams = { ...component.params, label: newLabel };
          dispatch(
            new UpdateParamsCommand(component.id, component.params, newParams, []),
          );
        }}
      />
      {schema && schema.length > 0 ? (
        schema.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={component.params[field.key]}
            onCommit={(newValue) => {
              const newParams: ComponentParams = { ...component.params, [field.key]: newValue };
              const dropped = computeDroppedWires(
                component.kind,
                component.id,
                component.params,
                newParams,
                document.wires,
              );
              dispatch(
                new UpdateParamsCommand(component.id, component.params, newParams, dropped),
              );
            }}
          />
        ))
      ) : (
        <Hint>{t('inspector.noLabelParamsHint')}</Hint>
      )}
    </>
  );
  const connectionsTab = <ConnectionsSection component={component} />;

  // Surface diagnostic + connection counts as small tab badges so the
  // user knows there's something worth checking without clicking each
  // tab. Diagnostics targeting *this* component count for the Live tab.
  const myDiagCount = [...compiled.diagnostics, ...simDiagnostics].filter((d) =>
    diagnosticTouchesComponent(d, component.id),
  ).length;
  const incidentCount = document.wires.filter(
    (w) =>
      w.endpoints[0].componentId === component.id ||
      w.endpoints[1].componentId === component.id,
  ).length;

  return (
    <Frame>
      <Header sub={subhead}>{headerText}</Header>
      {help ? <HelpBlock description={help.description} cheats={help.cheats} /> : null}
      <InspectorTabs
        tabs={[
          {
            id: 'live',
            label: t('inspector.tab.live'),
            content: liveTab,
            badge: myDiagCount > 0 ? { kind: 'alert', count: myDiagCount } : undefined,
          },
          { id: 'params', label: t('inspector.tab.params'), content: paramsTab },
          {
            id: 'connections',
            label: t('inspector.tab.connections'),
            content: connectionsTab,
            badge: incidentCount > 0 ? { kind: 'count', count: incidentCount } : undefined,
          },
        ]}
      />
    </Frame>
  );
}

function diagnosticTouchesComponent(d: Diagnostic, id: ComponentId): boolean {
  if (d.kind === 'width-mismatch' || d.kind === 'floating-input') {
    return d.port.componentId === id;
  }
  if (d.kind === 'multi-driver') return d.drivers.some((p) => p.componentId === id);
  return false;
}

function InspectorTabs({
  tabs,
}: {
  tabs: readonly {
    id: string;
    label: string;
    content: React.ReactNode;
    badge?: { kind: 'alert' | 'count'; count: number };
  }[];
}): JSX.Element {
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid #2a3548',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active}
            onClick={() => setActive(tab.id)}
            style={{
              background: 'transparent',
              color: tab.id === active ? '#dde4ef' : '#7c8696',
              border: 'none',
              borderBottom: `2px solid ${tab.id === active ? '#60a5fa' : 'transparent'}`,
              padding: '6px 10px',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 11,
              fontWeight: tab.id === active ? 700 : 500,
              transition: 'color 120ms, border-color 120ms',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>{tab.label}</span>
            {tab.badge ? (
              <span
                aria-label={`${tab.badge.count}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 14,
                  height: 14,
                  padding: '0 4px',
                  borderRadius: 7,
                  fontSize: 9,
                  fontWeight: 700,
                  color: tab.badge.kind === 'alert' ? '#fee2e2' : '#dbeafe',
                  background:
                    tab.badge.kind === 'alert'
                      ? 'rgba(239, 68, 68, 0.85)'
                      : 'rgba(96, 165, 250, 0.32)',
                }}
              >
                {tab.badge.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{activeTab?.content}</div>
    </div>
  );
}

/** Reads kindHelp.* keys from i18n if present; null if no localized version. */
function localizedHelpFor(kind: string): { title: string; description: string; cheats?: readonly string[] } | null {
  // Mapping kind → kindHelp keyspace. shift-register and 7seg use camelCase.
  const helpKey =
    kind === 'shift-register' ? 'shiftRegister' : kind === '7seg' ? 'sevenSeg' : kind;
  const titleKey = `kindHelp.${helpKey}.title`;
  const descKey = `kindHelp.${helpKey}.description`;
  const title = t(titleKey);
  const desc = t(descKey);
  if (title === titleKey || desc === descKey) return null;
  const original = helpForKind(kind);
  return { title, description: desc, cheats: original?.cheats };
}

function computeDroppedWires(
  kind: string,
  componentId: ComponentId,
  oldParams: ComponentParams,
  newParams: ComponentParams,
  wires: readonly VisualWire[],
): readonly VisualWire[] {
  const def = getRegistry().get(kind);
  if (!def) return [];
  const oldPortNames = new Set(def.ports(oldParams).map((p) => p.name));
  const newPortNames = new Set(def.ports(newParams).map((p) => p.name));
  const removed = new Set<string>();
  for (const name of oldPortNames) if (!newPortNames.has(name)) removed.add(name);
  if (removed.size === 0) return [];
  return wires.filter((w) => {
    const [a, b] = w.endpoints;
    return (
      (a.componentId === componentId && removed.has(a.portName)) ||
      (b.componentId === componentId && removed.has(b.portName))
    );
  });
}

/* ------------------------ field renderers ------------------------ */

/**
 * Free-form display label. Every component gets one, so it lives in
 * `params.label` (a generic key the engine ignores) and renders above
 * the bbox on the canvas. Empty string = hidden.
 */
function LabelRow({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (next: string) => void;
}): JSX.Element {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: '#9aa4b2',
          fontWeight: 700,
        }}
      >
        {t('inspector.labelField')}
      </label>
      <input
        type="text"
        value={draft}
        placeholder={t('inspector.labelPlaceholder')}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (draft !== value) onCommit(draft);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            setDraft(value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          background: '#0c1018',
          border: '1px solid #2a3548',
          borderRadius: 4,
          color: '#dde4ef',
          padding: '4px 8px',
          font: 'inherit',
          fontSize: 12,
          outline: 'none',
        }}
      />
    </div>
  );
}

interface FieldRowProps {
  field: ParamField;
  value: number | string | boolean | undefined;
  onCommit: (next: number | string | boolean) => void;
}

function FieldRow({ field, value, onCommit }: FieldRowProps): JSX.Element {
  if (field.type === 'number') {
    return <NumberField field={field} value={typeof value === 'number' ? value : field.default} onCommit={onCommit} />;
  }
  if (field.type === 'string') {
    return <StringField field={field} value={typeof value === 'string' ? value : field.default} onCommit={onCommit} />;
  }
  if (field.type === 'boolean') {
    return <BooleanField field={field} value={typeof value === 'boolean' ? value : field.default} onCommit={onCommit} />;
  }
  return <EnumField field={field} value={typeof value === 'string' ? value : field.default} onCommit={onCommit} />;
}

function NumberField({
  field,
  value,
  onCommit,
}: {
  field: Extract<ParamField, { type: 'number' }>;
  value: number;
  onCommit: (n: number) => void;
}): JSX.Element {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string): void => {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setError(t('inspector.fieldErrors.notNumber'));
      return;
    }
    if (field.options && !field.options.includes(n)) {
      setError(t('inspector.fieldErrors.options', { options: field.options.join(', ') }));
      return;
    }
    if (field.min !== undefined && n < field.min) {
      setError(t('inspector.fieldErrors.min', { min: field.min }));
      return;
    }
    if (field.max !== undefined && n > field.max) {
      setError(t('inspector.fieldErrors.max', { max: field.max }));
      return;
    }
    setError(null);
    if (n !== value) onCommit(n);
  };

  if (field.options) {
    return (
      <Row label={fieldLabel(field)}>
        <select
          value={value}
          onChange={(e) => onCommit(Number(e.target.value))}
          style={selectStyle}
        >
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </Row>
    );
  }
  return (
    <Row label={fieldLabel(field)} error={error}>
      <input
        type="number"
        value={draft}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit(draft);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={inputStyle}
      />
    </Row>
  );
}

function StringField({
  field,
  value,
  onCommit,
}: {
  field: Extract<ParamField, { type: 'string' }>;
  value: string;
  onCommit: (s: string) => void;
}): JSX.Element {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw: string): void => {
    if (field.validate) {
      const err = field.validate(raw);
      if (err) {
        setError(err);
        return;
      }
    }
    setError(null);
    if (raw !== value) onCommit(raw);
  };

  return (
    <Row label={fieldLabel(field)} error={error}>
      <input
        type="text"
        value={draft}
        placeholder={field.placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit(draft);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={inputStyle}
      />
    </Row>
  );
}

function BooleanField({
  field,
  value,
  onCommit,
}: {
  field: Extract<ParamField, { type: 'boolean' }>;
  value: boolean;
  onCommit: (b: boolean) => void;
}): JSX.Element {
  return (
    <Row label={fieldLabel(field)}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onCommit(e.target.checked)}
          style={{ accentColor: '#60a5fa' }}
        />
        <span style={{ fontSize: 11, color: '#9aa4b2' }}>{value ? 'on' : 'off'}</span>
      </label>
    </Row>
  );
}

function EnumField({
  field,
  value,
  onCommit,
}: {
  field: Extract<ParamField, { type: 'enum' }>;
  value: string;
  onCommit: (s: string) => void;
}): JSX.Element {
  return (
    <Row label={fieldLabel(field)}>
      <select value={value} onChange={(e) => onCommit(e.target.value)} style={selectStyle}>
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Row>
  );
}

/** Resolve a ParamField's label through i18n when a labelKey is provided. */
function fieldLabel(field: ParamField): string {
  if (field.labelKey) return t(field.labelKey);
  return field.label;
}

/* ------------------------ Drive value widget --------------------- */

/**
 * Reads the current snapshot value of the input's out-net and lets the user
 * drive a new value via Simulator.setInput. 1-bit pins render as a toggle;
 * multi-bit pins render as a numeric input (decimal or hex).
 */
function DriveValueWidget({ component }: { component: VisualComponent }): JSX.Element {
  const netlist = useAppStore((s) => s.compiled.netlist);
  const snap = useAppStore((s) => s.simSnapshot);
  const width = Number(component.params['width'] ?? 1);
  const netId = netlist.portToNet.get(portKey(component.id, 'out'));
  const current = netId ? snap?.nets.get(netId) : undefined;

  const writeValue = (raw: bigint): void => {
    const sim = (window as unknown as { __sim?: { setInput: (p: unknown, v: SignalValue) => void } }).__sim;
    if (!sim) return;
    const mask = (1n << BigInt(width)) - 1n;
    const v: SignalValue = { width, value: raw & mask, unknown: 0n, hiZ: 0n };
    sim.setInput({ componentId: component.id, portName: 'out' }, v);
  };

  if (width === 1) {
    const isHigh = !!current && current.unknown === 0n && current.hiZ === 0n && current.value !== 0n;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: '#9aa4b2' }}>{t('inspector.driveValue')}</label>
        <button
          onClick={() => writeValue(isHigh ? 0n : 1n)}
          style={{
            padding: '6px 10px',
            background: isHigh ? '#1e3a23' : '#1c2230',
            border: `1px solid ${isHigh ? '#22c55e' : '#1f2632'}`,
            color: isHigh ? '#86efac' : '#cbd5e1',
            borderRadius: 6,
            font: 'inherit',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {isHigh ? t('inspector.driveValueHigh') : t('inspector.driveValueLow')}
        </button>
      </div>
    );
  }

  // Multi-bit: numeric input.
  return <MultiBitValueRow width={width} current={current} writeValue={writeValue} />;
}

function MultiBitValueRow({
  width,
  current,
  writeValue,
}: {
  width: number;
  current: SignalValue | undefined;
  writeValue: (v: bigint) => void;
}): JSX.Element {
  const initial =
    current && current.unknown === 0n && current.hiZ === 0n
      ? `0x${current.value.toString(16)}`
      : '0';
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(initial);
    // We only want to resync when the *engine* value changes — when the user
    // is typing, leave the draft alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.value, current?.unknown, current?.hiZ]);

  const commit = (raw: string): void => {
    const s = raw.trim();
    if (!s) {
      setError(t('inspector.fieldErrors.empty'));
      return;
    }
    try {
      const n = BigInt(s);
      const mask = (1n << BigInt(width)) - 1n;
      const masked = n & mask;
      setError(null);
      writeValue(masked);
    } catch {
      setError(t('inspector.fieldErrors.badLiteral'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#9aa4b2' }}>
        {t('inspector.driveValueMultiBit', { width })}
      </label>
      <input
        type="text"
        value={draft}
        placeholder={t('inspector.driveValuePlaceholder')}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit(draft);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          background: '#0f1115',
          color: '#e6e6e6',
          border: '1px solid #1f2632',
          borderRadius: 5,
          padding: '5px 8px',
          fontSize: 12,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {error ? <span style={{ fontSize: 10, color: '#ef4444' }}>{error}</span> : null}
    </div>
  );
}

/* ------------------------ Live values ---------------------------- */

function LiveValuesSection({ component }: { component: VisualComponent }): JSX.Element | null {
  const netlist = useAppStore((s) => s.compiled.netlist);
  const snap = useAppStore((s) => s.simSnapshot);
  const def = getRegistry().get(component.kind);
  // Composite: skip (rendered as one block; live values for inner aren't useful here).
  if (component.kind.startsWith('composite:')) return null;
  if (!def) return null;
  const ports = def.ports(component.params);
  if (ports.length === 0) return null;
  return (
    <SectionBlock title={t('inspector.liveValues')}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {ports.map((p) => {
          const netId = netlist.portToNet.get(portKey(component.id, p.name));
          const v = netId ? snap?.nets.get(netId) : undefined;
          return (
            <ValuePill key={p.name} portName={p.name} signal={v} width={p.width} dir={p.direction} />
          );
        })}
      </div>
    </SectionBlock>
  );
}

function ValuePill({
  portName,
  signal,
  width,
  dir,
}: {
  portName: string;
  signal: SignalValue | undefined;
  width: number;
  dir: 'in' | 'out' | 'inout';
}): JSX.Element {
  let label: string;
  let color = '#cbd5e1';
  let bg = '#0f1115';
  if (!signal) {
    label = '—';
  } else if (signal.unknown !== 0n) {
    label = 'X';
    color = '#ef4444';
  } else if (signal.hiZ !== 0n) {
    label = 'Z';
    color = '#3b82f6';
  } else if (width === 1) {
    label = signal.value !== 0n ? '1' : '0';
    color = signal.value !== 0n ? '#86efac' : '#9aa4b2';
    if (signal.value !== 0n) bg = '#142a18';
  } else {
    label = `0x${signal.value.toString(16)}`;
    color = '#cbd5e1';
  }
  const arrow = dir === 'in' ? '←' : dir === 'out' ? '→' : '↔';
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: 4,
        alignItems: 'baseline',
        padding: '3px 6px',
        background: bg,
        border: '1px solid #1f2632',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <span style={{ color: '#7c8696', fontSize: 9 }}>{portName}</span>
      <span style={{ color: '#7c8696', fontSize: 9 }}>{arrow}</span>
      <span style={{ color, fontWeight: 600 }}>{label}</span>
    </span>
  );
}

/* ------------------------ Internal state ------------------------- */

function InternalStateSection({ component }: { component: VisualComponent }): JSX.Element | null {
  const states = useAppStore((s) => s.simComponentStates);
  const def = getRegistry().get(component.kind);
  if (!def?.isSequential) return null;
  const state = states.get(component.id);
  return (
    <SectionBlock title={t('inspector.internalState')}>
      {state === undefined ? (
        <Hint>{t('inspector.stateUnavailable')}</Hint>
      ) : (
        <div style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#cbd5e1' }}>
          {formatState(component.kind, state)}
        </div>
      )}
    </SectionBlock>
  );
}

function formatState(kind: string, state: unknown): string {
  if (typeof state !== 'object' || state === null) return String(state);
  if (kind === 'clock') {
    const high = (state as { high?: boolean }).high;
    return `high = ${high ? '1' : '0'}`;
  }
  if (kind === 'register') {
    const stored = (state as { stored?: SignalValue }).stored;
    if (!stored) return '—';
    return `stored = 0x${stored.value.toString(16)} (${stored.width}-bit)`;
  }
  if (kind === 'counter') {
    const count = (state as { count?: bigint }).count;
    return count !== undefined ? `count = ${count.toString()}` : '—';
  }
  if (kind === 'shift-register') {
    const data = (state as { data?: bigint }).data;
    return data !== undefined ? `data = 0x${data.toString(16)}` : '—';
  }
  return JSON.stringify(state, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

/* ------------------------ Memory dump ---------------------------- */

const MEMORY_PAGE_SIZE = 64;

/**
 * RAM/ROM memory inspector. For RAM, reads live cells from the worker's
 * componentStates payload; for ROM, parses the static `data` param.
 *
 * Renders an 8-cell-wide hex grid, paginated to keep React happy on
 * large address spaces (16-bit RAM = 64K cells, we only show one page
 * at a time + jump controls).
 */
function MemoryDumpSection({ component }: { component: VisualComponent }): JSX.Element | null {
  const states = useAppStore((s) => s.simComponentStates);
  const [page, setPage] = useState(0);

  if (component.kind !== 'ram' && component.kind !== 'rom') return null;

  const width = Number(component.params['width'] ?? 8);
  const addrBits = Number(component.params['addrBits'] ?? 4);
  const cellCount = Math.min(1 << Math.min(addrBits, 16), 0x10000);
  const totalPages = Math.max(1, Math.ceil(cellCount / MEMORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const startIdx = safePage * MEMORY_PAGE_SIZE;
  const endIdx = Math.min(startIdx + MEMORY_PAGE_SIZE, cellCount);

  // Resolve every cell in the visible range to a bigint.
  const cells: bigint[] = [];
  if (component.kind === 'ram') {
    const raw = states.get(component.id) as { cells?: Map<bigint, bigint> } | undefined;
    const map = raw?.cells;
    for (let i = startIdx; i < endIdx; i++) {
      cells.push(map?.get(BigInt(i)) ?? 0n);
    }
  } else {
    const parsed = parseRomDataLocal(String(component.params['data'] ?? ''));
    for (let i = startIdx; i < endIdx; i++) {
      cells.push(parsed[i] ?? 0n);
    }
  }

  const hexW = Math.max(2, Math.ceil(width / 4));
  const pad = (v: bigint): string => v.toString(16).padStart(hexW, '0').toUpperCase();

  return (
    <SectionBlock title={t('inspector.memorySection')}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          color: '#9aa4b2',
          marginBottom: 4,
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={safePage === 0}
          style={pageBtnStyle(safePage === 0)}
        >
          ‹
        </button>
        <span>
          {t('inspector.memoryPageInfo', {
            from: `0x${startIdx.toString(16).toUpperCase()}`,
            to: `0x${(endIdx - 1).toString(16).toUpperCase()}`,
            total: `0x${(cellCount - 1).toString(16).toUpperCase()}`,
          })}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={safePage >= totalPages - 1}
          style={pageBtnStyle(safePage >= totalPages - 1)}
        >
          ›
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 2,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11,
        }}
      >
        {cells.map((v, i) => (
          <span
            key={i}
            title={`0x${(startIdx + i).toString(16).toUpperCase()} → 0x${pad(v)}`}
            style={{
              padding: '3px 4px',
              background: v === 0n ? '#0c1018' : '#1c2540',
              color: v === 0n ? '#7c8696' : '#cbd5e1',
              borderRadius: 3,
              textAlign: 'center',
            }}
          >
            {pad(v)}
          </span>
        ))}
      </div>
    </SectionBlock>
  );
}

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: '1px solid #2a3548',
    color: disabled ? '#3a4150' : '#cbd5e1',
    borderRadius: 4,
    padding: '1px 6px',
    cursor: disabled ? 'default' : 'pointer',
    font: 'inherit',
    fontSize: 11,
    opacity: disabled ? 0.5 : 1,
  };
}

function parseRomDataLocal(raw: string): readonly bigint[] {
  if (!raw.trim()) return [];
  return raw
    .trim()
    .split(/\s+/)
    .map((tok) => {
      try {
        return BigInt(tok.startsWith('0x') || tok.startsWith('0X') ? tok : `0x${tok}`);
      } catch {
        return 0n;
      }
    });
}

/* ------------------------ Connections ---------------------------- */

/* ------------------------ Composite drill-in -------------------- */

/**
 * Composite-instance widget — "Edit in tab" CTA that opens the referenced
 * library entry as a fresh tab. Mirrors the canvas double-click path, but
 * surfaced in the Inspector so a single click is enough.
 */
function CompositeEditSection({ component }: { component: VisualComponent }): JSX.Element | null {
  const library = useAppStore((s) => s.library);
  const newDocument = useAppStore((s) => s.newDocument);
  if (!component.kind.startsWith('composite:')) return null;
  const refId = String(component.params['refId'] ?? '');
  const saved = library.find((sc) => sc.id === refId);
  if (!saved) {
    return (
      <div
        style={{
          fontSize: 11,
          color: '#f59e0b',
          padding: '6px 8px',
          background: '#1c1610',
          border: '1px solid #4a2f0a',
          borderRadius: 6,
        }}
      >
        {t('inspector.compositeMissing')}
      </div>
    );
  }
  const open = (): void => {
    newDocument({ name: saved.name, document: saved.doc });
    useAppStore.setState({
      activeDocumentOrigin: { kind: 'library', refId: saved.id },
    });
  };
  return (
    <SectionBlock title={t('inspector.compositeSection')}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span
          style={{
            fontSize: 11,
            color: '#a8b4c7',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            background: '#0f1115',
            border: '1px solid #2a3548',
            borderRadius: 4,
            padding: '2px 8px',
          }}
        >
          {saved.name}
        </span>
        <button
          onClick={open}
          style={{
            marginLeft: 'auto',
            background: '#1f3a66',
            border: '1px solid #3b6ec3',
            color: '#e6e6e6',
            borderRadius: 5,
            padding: '4px 10px',
            font: 'inherit',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('inspector.compositeEdit')}
        </button>
      </div>
    </SectionBlock>
  );
}

function ConnectionsSection({ component }: { component: VisualComponent }): JSX.Element | null {
  const wires = useAppStore((s) => s.document.wires);
  const components = useAppStore((s) => s.document.components);
  const netlist = useAppStore((s) => s.compiled.netlist);
  const snap = useAppStore((s) => s.simSnapshot);
  const setSelection = useAppStore((s) => s.setSelection);
  const setViewport = useAppStore((s) => s.setViewport);

  const focusInCanvas = (id: ComponentId): void => {
    const target = components.find((c) => c.id === id);
    if (!target) return;
    setSelection([id]);
    try {
      const shape = getShape(target.kind, target.params);
      const cx = target.position.x + shape.bbox.w / 2;
      const cy = target.position.y + shape.bbox.h / 2;
      const vp = useAppStore.getState().viewport;
      // Account for the docked sidebars (palette left + inspector
      // right) so the component lands in the *visible* editor center,
      // not the raw window center.
      const paletteOpen = useAppStore.getState().paletteOpen;
      const leftDock = paletteOpen ? 292 : 44; // activity bar (+ palette)
      const inspectorW = readInspectorWidth();
      const visibleW = window.innerWidth - leftDock - inspectorW;
      const visibleH = window.innerHeight - 78 - 24;
      setViewport({
        zoom: vp.zoom,
        panX: cx - leftDock / vp.zoom - visibleW / vp.zoom / 2,
        panY: cy - 78 / vp.zoom - visibleH / vp.zoom / 2,
      });
      // Pulse the landing spot so the user catches what just moved.
      window.dispatchEvent(
        new CustomEvent('gatecraft:pulse-at', { detail: { x: cx, y: cy } }),
      );
    } catch {
      /* shape missing — selection alone is fine */
    }
  };

  const incident = wires.filter(
    (w) =>
      w.endpoints[0].componentId === component.id ||
      w.endpoints[1].componentId === component.id,
  );
  if (incident.length === 0) {
    return (
      <SectionBlock title={t('inspector.connections')}>
        <Hint>{t('inspector.noConnections')}</Hint>
      </SectionBlock>
    );
  }
  const rows = incident.slice(0, 6).map((w) => {
    const mineFirst = w.endpoints[0].componentId === component.id;
    const myPort = mineFirst ? w.endpoints[0] : w.endpoints[1];
    const otherPort = mineFirst ? w.endpoints[1] : w.endpoints[0];
    const otherComp = components.find((c) => c.id === otherPort.componentId);
    const netId = netlist.portToNet.get(portKey(myPort.componentId, myPort.portName));
    const v = netId ? snap?.nets.get(netId) : undefined;
    return { w, myPort, otherPort, otherComp, signal: v };
  });
  return (
    <SectionBlock title={t('inspector.connections')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map(({ w, myPort, otherPort, otherComp, signal }) => (
          <button
            key={w.id}
            onClick={() => otherComp && focusInCanvas(otherComp.id)}
            title={t('inspector.connectionClickHint')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 6px',
              background: 'transparent',
              border: '1px solid #1f2632',
              borderRadius: 4,
              color: '#cbd5e1',
              font: 'inherit',
              fontSize: 10,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              cursor: otherComp ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            <span>
              <span style={{ color: '#7c8696' }}>{myPort.portName} →</span>{' '}
              {otherComp ? `${otherComp.kind}:${otherPort.portName}` : '?'}
            </span>
            <span style={{ color: pillColor(signal), fontWeight: 600 }}>{pillLabel(signal)}</span>
          </button>
        ))}
        {incident.length > 6 ? (
          <span style={{ fontSize: 10, color: '#7c8696', padding: '2px 6px' }}>
            +{incident.length - 6} more
          </span>
        ) : null}
      </div>
    </SectionBlock>
  );
}

function pillLabel(v: SignalValue | undefined): string {
  if (!v) return '—';
  if (v.unknown !== 0n) return 'X';
  if (v.hiZ !== 0n) return 'Z';
  if (v.width === 1) return v.value !== 0n ? '1' : '0';
  return `0x${v.value.toString(16)}`;
}
function pillColor(v: SignalValue | undefined): string {
  if (!v) return '#7c8696';
  if (v.unknown !== 0n) return '#ef4444';
  if (v.hiZ !== 0n) return '#3b82f6';
  if (v.value !== 0n) return '#86efac';
  return '#9aa4b2';
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          color: '#9aa4b2',
          fontWeight: 700,
          paddingTop: 2,
          borderTop: '1px solid #1f2632',
          paddingBottom: 2,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// PortRef'i kullanmadığımız bir yerde tutmak için imports temizliği:
void (null as unknown as PortRef);

/* ------------------------ atoms ---------------------------------- */

const INSPECTOR_WIDTH_KEY = 'gatecraft:inspector-width';
function readInspectorWidth(): number {
  try {
    const raw = localStorage.getItem(INSPECTOR_WIDTH_KEY);
    const n = raw ? Number(raw) : NaN;
    if (Number.isFinite(n) && n >= 240 && n <= 600) return n;
  } catch {
    /* ignore */
  }
  return 300;
}

function Frame({ children }: { children: React.ReactNode }): JSX.Element {
  const [width, setWidth] = useState(readInspectorWidth);
  const splitView = useAppStore((s) => s.splitView);
  const splitOrientation = useAppStore((s) => s.splitOrientation);
  // Right-side split shrinks the Inspector inward so the two right
  // panels don't overlap. Bottom-side split lets the Inspector keep
  // its full height — they don't compete for horizontal space then.
  const inspectorRight = splitView && splitOrientation === 'right' ? '40%' : 0;
  const inspectorBottom = splitView && splitOrientation === 'bottom' ? 'calc(45% + 24px)' : 24;
  return (
    <div
      style={{
        position: 'absolute',
        // Right-edge sidebar — mirrors VSCode's secondary sidebar.
        // Spans the full editor height between the tab strip and the
        // status bar. When the split-view pane is open we slide the
        // Inspector inside the split rather than overlapping it.
        top: 78,
        right: inspectorRight,
        bottom: inspectorBottom,
        width,
        padding: 12,
        background: SURFACE.sidebarBg,
        borderLeft: `1px solid ${SURFACE.borderColor}`,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflowY: 'auto',
      }}
    >
      {children}
      <div
        onPointerDown={(ev) => {
          ev.preventDefault();
          let lastX = ev.clientX;
          const onMove = (e: PointerEvent): void => {
            const dx = e.clientX - lastX;
            lastX = e.clientX;
            setWidth((w) => {
              // Dragging the LEFT edge inward (positive dx) shrinks
              // the panel; outward (negative dx) grows it.
              const next = Math.max(240, Math.min(600, w - dx));
              try {
                localStorage.setItem(INSPECTOR_WIDTH_KEY, String(next));
              } catch {
                /* ignore */
              }
              return next;
            });
          };
          const onUp = (): void => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: -3,
          width: 6,
          height: '100%',
          cursor: 'ew-resize',
        }}
        aria-label="Inspector resize handle"
      />
    </div>
  );
}

function Header({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}): JSX.Element {
  return (
    <div style={{ padding: '0 2px 6px', borderBottom: '1px solid #1f2632' }}>
      <div
        style={{
          fontSize: 13,
          color: '#e6e6e6',
          fontWeight: 600,
        }}
      >
        {children}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            color: '#7c8696',
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function HelpBlock({
  description,
  cheats,
}: {
  description: string;
  cheats?: readonly string[];
}): JSX.Element {
  return (
    <div style={{ fontSize: 12, lineHeight: 1.6, color: '#dde4ef' }}>
      <div>{description}</div>
      {cheats && cheats.length > 0 ? (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#a8b4c7',
            fontSize: 11,
          }}
        >
          {cheats.map((c, i) => (
            <span
              key={i}
              style={{
                padding: '3px 7px',
                background: '#0f1115',
                border: '1px solid #2a3548',
                borderRadius: 4,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }): JSX.Element {
  return <div style={{ fontSize: 11, color: '#7c8696', lineHeight: 1.5 }}>{children}</div>;
}

function Row({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}): JSX.Element {
  // If `error` looks like an i18n key (dot-path), translate it; otherwise
  // render it verbatim. t() falls back to the raw key for unknown ones.
  const displayedError = error
    ? error.includes('.')
      ? t(error)
      : error
    : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#9aa4b2' }}>{label}</label>
      {children}
      {displayedError ? (
        <span style={{ fontSize: 10, color: '#ef4444' }}>{displayedError}</span>
      ) : null}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0f1115',
  color: '#e6e6e6',
  border: '1px solid #1f2632',
  borderRadius: 5,
  padding: '5px 8px',
  font: 'inherit',
  fontSize: 12,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
};

