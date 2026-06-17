import type { ComponentParams } from '@nandbench/engine';
import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import { getShape } from '../model/kinds.js';
import type { SavedCircuit } from '../model/library.js';
import { useAppStore } from '../model/store.js';
import { suggestionsFor } from '../model/suggestions.js';
import { PALETTE, SURFACE } from './palette-tokens.js';

interface PaletteItem {
  readonly kind: string;
  readonly label: string;
  /** i18n key for the hint subtitle (resolved with t()). */
  readonly hintKey: string;
  readonly params: ComponentParams;
}

interface PaletteCategory {
  readonly nameKey: string;
  readonly items: readonly PaletteItem[];
}

export const PALETTE_CATEGORIES: readonly PaletteCategory[] = [
  {
    nameKey: 'palette.categories.wiring',
    items: [
      { kind: 'input', label: 'IN', hintKey: 'hint.input', params: { width: 1 } },
      { kind: 'output', label: 'OUT', hintKey: 'hint.output', params: { width: 1 } },
      { kind: 'probe', label: 'PROBE', hintKey: 'hint.probe', params: { width: 1 } },
      { kind: 'constant', label: 'CONST', hintKey: 'hint.constant', params: { width: 1, value: '1' } },
      { kind: 'power', label: 'PWR', hintKey: 'hint.power', params: { width: 1 } },
      { kind: 'ground', label: 'GND', hintKey: 'hint.ground', params: { width: 1 } },
      { kind: 'clock', label: 'CLK', hintKey: 'hint.clock', params: {} },
      { kind: 'splitter', label: 'SPLIT', hintKey: 'hint.splitter', params: { width: 4, fanout: 4 } },
      { kind: 'tunnel', label: 'TUN', hintKey: 'hint.tunnel', params: { width: 1, label: 'X' } },
      { kind: 'bit-extender', label: 'EXT', hintKey: 'hint.bitExtender', params: { inWidth: 4, outWidth: 8, mode: 'zero' } },
      { kind: 'pull-resistor', label: 'PULL', hintKey: 'hint.pullResistor', params: { width: 1, direction: 'pullUp' } },
      { kind: 'por', label: 'POR', hintKey: 'hint.por', params: {} },
    ],
  },
  {
    nameKey: 'palette.categories.gates',
    items: [
      { kind: 'not', label: 'NOT', hintKey: 'hint.not', params: { width: 1 } },
      { kind: 'buffer', label: 'BUF', hintKey: 'hint.buffer', params: { width: 1 } },
      { kind: 'and', label: 'AND', hintKey: 'hint.and', params: { width: 1, inputs: 2 } },
      { kind: 'or', label: 'OR', hintKey: 'hint.or', params: { width: 1, inputs: 2 } },
      { kind: 'nand', label: 'NAND', hintKey: 'hint.nand', params: { width: 1, inputs: 2 } },
      { kind: 'nor', label: 'NOR', hintKey: 'hint.nor', params: { width: 1, inputs: 2 } },
      { kind: 'xor', label: 'XOR', hintKey: 'hint.xor', params: { width: 1, inputs: 2 } },
      { kind: 'xnor', label: 'XNOR', hintKey: 'hint.xnor', params: { width: 1, inputs: 2 } },
      { kind: 'odd-parity', label: 'ODD', hintKey: 'hint.oddParity', params: { width: 1, inputs: 4 } },
      { kind: 'even-parity', label: 'EVEN', hintKey: 'hint.evenParity', params: { width: 1, inputs: 4 } },
      { kind: 'controlled-buffer', label: 'CBUF', hintKey: 'hint.controlledBuffer', params: { width: 1 } },
      { kind: 'controlled-inverter', label: 'CINV', hintKey: 'hint.controlledInverter', params: { width: 1 } },
    ],
  },
  {
    nameKey: 'palette.categories.plexers',
    items: [
      { kind: 'mux', label: 'MUX', hintKey: 'hint.mux', params: { width: 1, inputs: 2 } },
      { kind: 'demux', label: 'DEMUX', hintKey: 'hint.demux', params: { width: 1, outputs: 2 } },
      { kind: 'decoder', label: 'DEC', hintKey: 'hint.decoder', params: { inputs: 2 } },
      { kind: 'priority-encoder', label: 'PRI', hintKey: 'hint.priorityEncoder', params: { select: 2 } },
      { kind: 'bit-selector', label: 'BSEL', hintKey: 'hint.bitSelector', params: { width: 8, group: 1 } },
    ],
  },
  {
    nameKey: 'palette.categories.arithmetic',
    items: [
      { kind: 'adder', label: 'ADD', hintKey: 'hint.adder', params: { width: 1 } },
      { kind: 'subtractor', label: 'SUB', hintKey: 'hint.subtractor', params: { width: 1 } },
      { kind: 'multiplier', label: 'MUL', hintKey: 'hint.multiplier', params: { width: 8 } },
      { kind: 'divider', label: 'DIV', hintKey: 'hint.divider', params: { width: 8 } },
      { kind: 'negator', label: 'NEG', hintKey: 'hint.negator', params: { width: 8 } },
      { kind: 'absolute', label: 'ABS', hintKey: 'hint.absolute', params: { width: 8 } },
      { kind: 'min-max', label: 'MIN/MAX', hintKey: 'hint.minMax', params: { width: 8, signed: false } },
      { kind: 'shifter', label: 'SHIFT', hintKey: 'hint.shifter', params: { width: 8, direction: 'left', arithmetic: false } },
      { kind: 'comparator', label: 'CMP', hintKey: 'hint.comparator', params: { width: 1, signed: false } },
      { kind: 'bit-adder', label: 'POPCNT', hintKey: 'hint.bitAdder', params: { width: 8 } },
      { kind: 'bit-finder', label: 'BFIND', hintKey: 'hint.bitFinder', params: { width: 8, direction: 'lowest' } },
      { kind: 'exponentiator', label: 'EXP', hintKey: 'hint.exponentiator', params: { width: 8 } },
      { kind: 'square-root', label: '√', hintKey: 'hint.squareRoot', params: { width: 8 } },
    ],
  },
  {
    nameKey: 'palette.categories.memory',
    items: [
      { kind: 'register', label: 'REG', hintKey: 'hint.register', params: { width: 1 } },
      { kind: 'counter', label: 'CNT', hintKey: 'hint.counter', params: { width: 4 } },
      { kind: 'shift-register', label: 'SHIFT', hintKey: 'hint.shiftRegister', params: { width: 4 } },
      { kind: 'ram', label: 'RAM', hintKey: 'hint.ram', params: { width: 8, addrBits: 4 } },
      { kind: 'rom', label: 'ROM', hintKey: 'hint.rom', params: { width: 8, addrBits: 4, data: '' } },
      { kind: 'd-flipflop', label: 'D-FF', hintKey: 'hint.dFlipFlop', params: {} },
      { kind: 't-flipflop', label: 'T-FF', hintKey: 'hint.tFlipFlop', params: {} },
      { kind: 'jk-flipflop', label: 'JK-FF', hintKey: 'hint.jkFlipFlop', params: {} },
      { kind: 'sr-flipflop', label: 'SR-FF', hintKey: 'hint.srFlipFlop', params: {} },
    ],
  },
  {
    nameKey: 'palette.categories.io',
    items: [
      { kind: 'button', label: 'BTN', hintKey: 'hint.button', params: {} },
      { kind: 'led', label: 'LED', hintKey: 'hint.led', params: {} },
      { kind: '7seg', label: '7-SEG', hintKey: 'hint.sevenSeg', params: {} },
    ],
  },
];

export function Palette(): JSX.Element | null {
  const tool = useAppStore((s) => s.tool);
  const setTool = useAppStore((s) => s.setTool);
  const library = useAppStore((s) => s.library);
  const deleteSavedCircuit = useAppStore((s) => s.deleteSavedCircuit);
  const lastPlacedKind = useAppStore((s) => s.lastPlacedKind);
  const locale = useAppStore((s) => s.locale);
  const paletteOpen = useAppStore((s) => s.paletteOpen);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState('');

  // Recompute suggested kinds when last-placed changes. Locale is in deps so
  // the t() text in hints re-renders when language flips.
  const suggested = useMemo<Set<string>>(
    () => new Set(lastPlacedKind ? suggestionsFor(lastPlacedKind) : []),
    [lastPlacedKind],
  );

  // Filter categories by the search query. Empty query → unfiltered.
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PALETTE_CATEGORIES;
    return PALETTE_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((it) => {
        const hint = t(it.hintKey).toLowerCase();
        return (
          it.kind.toLowerCase().includes(q) ||
          it.label.toLowerCase().includes(q) ||
          hint.includes(q)
        );
      }),
    })).filter((cat) => cat.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, locale]);

  void locale;
  if (!paletteOpen) return null;

  const toggleCategory = (name: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div
      data-tour="palette"
      style={{
        position: 'absolute',
        // Left sidebar. Slightly lighter than the global sidebarBg so
        // tiny shape sketches + small text stay readable — this panel
        // is read-heavy compared to other docked surfaces.
        top: 44,
        left: 44,
        bottom: 24,
        width: 248,
        padding: 0,
        background: '#1a1f2a',
        borderRight: `1px solid ${SURFACE.borderColor}`,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflowY: 'auto',
        color: '#e6ebf4',
      }}
    >
      {/* Sidebar title bar — VSCode "EXPLORER" style: small caps, muted,
       *  no background, single bottom divider. Sits flush against the
       *  header above it. */}
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.9,
          color: SURFACE.headerSubtext,
          padding: '10px 12px 9px',
          borderBottom: `1px solid ${SURFACE.borderColor}`,
          background: 'transparent',
          fontWeight: 700,
        }}
      >
        {t('palette.title')}
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('palette.searchPlaceholder')}
        style={{
          margin: '4px 4px 6px',
          padding: '5px 8px',
          fontSize: 12,
          background: '#0c1018',
          border: '1px solid #2a3548',
          borderRadius: 5,
          color: '#dde4ef',
          outline: 'none',
        }}
      />
      {/* Library is the first thing the user sees — composite circuits
       *  they've published live here. Showing it on top (even when empty,
       *  with a hint) makes "how do I call my sub-circuit from main?"
       *  answer itself: it lands here. */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
        <CategoryHeader
          label={t('palette.categories.library')}
          collapsed={false}
          onToggle={() => undefined}
        />
        {library.length === 0 ? (
          <div
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: PALETTE.hintColor,
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
            }}
          >
            {t('palette.libraryEmptyHint')}
          </div>
        ) : (
          library.map((sc) => (
            <LibraryRow
              key={sc.id}
              sc={sc}
              active={tool.type === 'place' && tool.kind === `composite:${sc.id}`}
              onPlace={() => {
                if (tool.type === 'place' && tool.kind === `composite:${sc.id}`) {
                  setTool({ type: 'idle' });
                } else {
                  setTool({
                    type: 'place',
                    kind: `composite:${sc.id}`,
                    params: { refId: sc.id },
                    ghostWorld: null,
                  });
                }
              }}
              onDelete={() => {
                if (window.confirm(t('palette.libraryDeleteConfirm', { name: sc.name }))) {
                  deleteSavedCircuit(sc.id);
                }
              }}
            />
          ))
        )}
      </div>
      {filteredCategories.map((cat) => {
        // When a search is active, force every matching category open so the
        // hits are visible without an extra click.
        const isCollapsed = search.trim().length === 0 && collapsed.has(cat.nameKey);
        return (
          <div key={cat.nameKey} style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
            <CategoryHeader
              label={t(cat.nameKey)}
              collapsed={isCollapsed}
              onToggle={() => toggleCategory(cat.nameKey)}
            />
            {!isCollapsed &&
              cat.items.map((item) => {
                const active = tool.type === 'place' && tool.kind === item.kind;
                const isSuggested = suggested.has(item.kind);
                return (
                  <PaletteItemRow
                    key={item.kind}
                    kind={item.kind}
                    label={item.label}
                    hint={t(item.hintKey)}
                    params={item.params}
                    active={active}
                    suggested={isSuggested}
                    onClick={() => {
                      if (active) {
                        setTool({ type: 'idle' });
                      } else {
                        setTool({
                          type: 'place',
                          kind: item.kind,
                          params: item.params,
                          ghostWorld: null,
                        });
                      }
                    }}
                  />
                );
              })}
          </div>
        );
      })}
      <div style={{ height: 1, background: '#1f2632', margin: '8px 4px 6px' }} />
      <div
        style={{
          fontSize: PALETTE.hintFontSize,
          padding: '0 8px 4px',
          color: PALETTE.hintColor,
          lineHeight: 1.5,
        }}
      >
        {t('palette.instructions')}
      </div>
    </div>
  );
}

function CategoryHeader({
  label,
  collapsed,
  onToggle,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onToggle}
      style={{
        // Darker chrome strip with a soft inner highlight + bottom rule
        // — sits visibly above the item list, so the eye picks up the
        // section break without reading the text.
        display: 'grid',
        gridTemplateColumns: '4px 1fr 16px',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '10px 12px 9px',
        background: 'linear-gradient(180deg, #0e131c 0%, #0a0e16 100%)',
        border: 'none',
        borderTop: `1px solid ${SURFACE.borderColor}`,
        borderBottom: '1px solid #1d2532',
        boxShadow: 'inset 0 1px 0 rgba(126, 167, 215, 0.06)',
        color: '#cbd5e1',
        font: 'inherit',
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.9px',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {/* left accent rail — colored when expanded, dim when collapsed */}
      <span
        aria-hidden
        style={{
          height: 12,
          width: 3,
          borderRadius: 2,
          background: collapsed ? '#2a3548' : '#60a5fa',
          boxShadow: collapsed ? 'none' : '0 0 6px rgba(96, 165, 250, 0.55)',
        }}
      />
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 9, opacity: 0.7, textAlign: 'right' }}>
        {collapsed ? '▶' : '▼'}
      </span>
    </button>
  );
}

function PaletteItemRow({
  kind,
  label,
  hint,
  params,
  active,
  suggested,
  onClick,
}: {
  kind: string;
  label: string;
  hint: string;
  params: ComponentParams;
  active: boolean;
  suggested: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      data-tour={kind === 'and' ? 'palette-and' : undefined}
      title={suggested ? t('palette.suggestion.tooltip') : hint}
      style={{
        position: 'relative',
        // Two-column grid: [preview 40px] [label + wrapped hint stack].
        // The hint now wraps to a second line when needed so long
        // descriptions ("Pull-up / pull-down kaynağı") stay readable
        // instead of being truncated with an ellipsis.
        display: 'grid',
        gridTemplateColumns: '40px 1fr',
        alignItems: 'center',
        gap: 10,
        padding: '7px 10px 7px 14px',
        marginLeft: 4,
        marginRight: 2,
        background: active ? PALETTE.itemBgActive : 'transparent',
        border: `1px solid ${active ? PALETTE.itemBorderActive : 'transparent'}`,
        borderRadius: 5,
        color: PALETTE.itemColor,
        cursor: 'pointer',
        font: 'inherit',
        fontWeight: 500,
        fontSize: PALETTE.itemFontSize,
        boxShadow: suggested && !active ? PALETTE.suggestionGlow : undefined,
        transition: 'background 0.1s, box-shadow 0.2s',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = PALETTE.itemBgHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 4,
          top: 6,
          bottom: 6,
          width: 2,
          borderRadius: 1,
          background: active ? PALETTE.itemAccentBar : suggested ? PALETTE.suggestionBorder : 'transparent',
        }}
      />
      <span style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <PaletteShapePreview kind={kind} params={params} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
        <span style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: 13, color: '#e6e6e6' }}>
          {label}
        </span>
        <span
          style={{
            color: PALETTE.itemSubColor,
            fontWeight: 400,
            fontSize: 11,
            lineHeight: 1.35,
            // Wrap to a second line; clamp at 2 lines so very long
            // hints still cap the row height. Native title attribute on
            // the button is the escape hatch for the full string.
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}

function LibraryRow({
  sc,
  active,
  onPlace,
  onDelete,
}: {
  sc: SavedCircuit;
  active: boolean;
  onPlace: () => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 2, marginLeft: 4, marginRight: 2 }}>
      <button
        onClick={onPlace}
        title={`${sc.inputs.length} in / ${sc.outputs.length} out`}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 10px',
          background: active ? PALETTE.itemBgActive : 'transparent',
          border: `1px solid ${active ? PALETTE.itemBorderActive : 'transparent'}`,
          color: PALETTE.itemColor,
          borderRadius: 5,
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 500,
          fontSize: PALETTE.itemFontSize,
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = PALETTE.itemBgHover;
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ fontWeight: 600 }}>{sc.name}</span>
        <span style={{ color: PALETTE.itemSubColor, fontWeight: 400, fontSize: 10 }}>
          {sc.inputs.length}→{sc.outputs.length}
        </span>
      </button>
      <button
        onClick={onDelete}
        title="×"
        style={{
          background: 'transparent',
          color: '#7c8696',
          border: 'none',
          borderRadius: 5,
          padding: '5px 8px',
          cursor: 'pointer',
          fontSize: 11,
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Small canvas-backed preview of a primitive's shape. We render at native
 * resolution into a 36×22 box, computing a fit-to-bbox transform so the
 * shape draws at a consistent visual weight regardless of its real size.
 *
 * Pin dots are skipped — the strokes alone read as the silhouette and
 * pins add visual noise at this scale.
 */
function PaletteShapePreview({
  kind,
  params,
}: {
  kind: string;
  params: ComponentParams;
}): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);
  // Cheap memo key — for primitives the params object identity doesn't
  // change, but we still serialize for safety.
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = 36;
    const H = 22;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    let shape;
    try {
      shape = getShape(kind, params);
    } catch {
      return; // unknown kind — leave empty
    }
    const pad = 3;
    const sx = (W - pad * 2) / shape.bbox.w;
    const sy = (H - pad * 2) / shape.bbox.h;
    const scale = Math.min(sx, sy);
    const drawW = shape.bbox.w * scale;
    const drawH = shape.bbox.h * scale;
    const offX = (W - drawW) / 2;
    const offY = (H - drawH) / 2;
    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);
    try {
      shape.draw(ctx, { selected: false });
    } catch {
      /* ignore draw errors */
    }
    ctx.restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, paramsKey]);

  return (
    <canvas
      ref={ref}
      width={36}
      height={22}
      style={{
        width: 36,
        height: 22,
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}
