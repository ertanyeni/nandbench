/**
 * Logisim Evolution `.circ` importer.
 *
 * A `.circ` file is an XML document with one `<project>` root, a flat list
 * of `<lib>` declarations (numbered) and one or more `<circuit>` nodes.
 * Each circuit holds:
 *   - `<comp lib="N" loc="(x,y)" name="…">` — a placed component
 *   - `<a name="…" val="…"/>` — child attributes for the comp
 *   - `<wire from="(a,b)" to="(c,d)"/>` — point-to-point wire segments
 *
 * Logisim wires are not tied to specific pins; they connect by spatial
 * coincidence — two endpoints meeting at the same coordinate are on the
 * same net. Our model requires PortRefs at every wire endpoint, so the
 * importer matches each wire end against the nearest pin of any placed
 * component (within a small tolerance). Endpoints with no matching pin
 * are dropped and surface as an import-time diagnostic.
 *
 * Only the most common Logisim primitives are mapped — exotic blocks
 * (transistors, TCL, SoC, FPGA-specific) fall through and report as
 * unsupported.
 */

import { asComponentId, type ComponentParams, type PortRef } from '@gatecraft/engine';
import {
  asWireId,
  type CircuitDocument,
  type Point,
  type VisualComponent,
  type VisualWire,
} from './document.js';
import { getShape, pinWorldPosition } from './kinds.js';
import { routeOrthogonal } from './routing.js';

export interface CircImportResult {
  readonly document: CircuitDocument;
  readonly diagnostics: readonly CircImportDiagnostic[];
}

export type CircImportDiagnostic =
  | { readonly kind: 'unknown-component'; readonly name: string; readonly lib: string }
  | { readonly kind: 'unbound-wire-endpoint'; readonly point: Point }
  | { readonly kind: 'unsupported-attribute'; readonly comp: string; readonly attr: string };

/** Pixels of slop allowed when matching a Logisim wire endpoint to a pin. */
const SNAP_TOLERANCE = 12;

/**
 * Parse a `.circ` XML string into a CircuitDocument. The main `<circuit>`
 * (or the first one) is imported; sub-circuits are ignored in v1.
 */
export function importCirc(xml: string): CircImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const parserErr = doc.querySelector('parsererror');
  if (parserErr) {
    throw new Error(`Malformed XML: ${parserErr.textContent ?? 'parse error'}`);
  }

  // The `<main>` element names the entry circuit; if absent, use the first.
  const mainNameAttr = doc.querySelector('main')?.getAttribute('name');
  const circuits = [...doc.querySelectorAll('circuit')];
  const target =
    (mainNameAttr && circuits.find((c) => c.getAttribute('name') === mainNameAttr)) ||
    circuits[0];
  if (!target) {
    return { document: { components: [], wires: [] }, diagnostics: [] };
  }

  return importCircuit(target);
}

function importCircuit(circuit: Element): CircImportResult {
  const diagnostics: CircImportDiagnostic[] = [];

  // 1. Parse comps.
  const rawComps: ParsedComp[] = [];
  for (const compEl of circuit.querySelectorAll(':scope > comp')) {
    const lib = compEl.getAttribute('lib') ?? '';
    const name = compEl.getAttribute('name') ?? '';
    const loc = parsePoint(compEl.getAttribute('loc') ?? '');
    if (!loc) continue;
    const attrs: Record<string, string> = {};
    for (const a of compEl.querySelectorAll(':scope > a')) {
      const k = a.getAttribute('name');
      const v = a.getAttribute('val');
      if (k && v !== null) attrs[k] = v;
    }
    rawComps.push({ lib, name, loc, attrs });
  }

  // 2. Map comps → VisualComponent.
  const components: VisualComponent[] = [];
  for (const rc of rawComps) {
    const mapped = mapComponent(rc);
    if (!mapped) {
      diagnostics.push({ kind: 'unknown-component', name: rc.name, lib: rc.lib });
      continue;
    }
    components.push(mapped);
  }

  // 3. Resolve pin world positions for every placed component, so we can
  //    snap wire endpoints to real ports.
  type PinEntry = { ref: PortRef; world: Point; side: 'left' | 'right' | 'top' | 'bottom' };
  const pinIndex: PinEntry[] = [];
  for (const c of components) {
    const shape = getShape(c.kind, c.params);
    for (const p of shape.pins) {
      pinIndex.push({
        ref: { componentId: c.id, portName: p.name },
        world: pinWorldPosition(c.position, shape, p.name),
        side: p.side,
      });
    }
  }
  const findPin = (pt: Point): PinEntry | undefined => {
    let best: { dist2: number; entry: PinEntry } | null = null;
    const tol2 = SNAP_TOLERANCE * SNAP_TOLERANCE;
    for (const e of pinIndex) {
      const dx = e.world.x - pt.x;
      const dy = e.world.y - pt.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= tol2 && (best === null || d2 < best.dist2)) {
        best = { dist2: d2, entry: e };
      }
    }
    return best?.entry;
  };

  // 4. Parse wires + resolve endpoints.
  const wires: VisualWire[] = [];
  let wireCounter = 0;
  for (const wireEl of circuit.querySelectorAll(':scope > wire')) {
    const from = parsePoint(wireEl.getAttribute('from') ?? '');
    const to = parsePoint(wireEl.getAttribute('to') ?? '');
    if (!from || !to) continue;
    // Wire endpoints are in Logisim's pixel space — scale them to our
    // world (×COORD_SCALE) before matching against the pin index.
    const a = findPin(scaledPoint(from));
    const b = findPin(scaledPoint(to));
    if (!a || !b) {
      if (!a) diagnostics.push({ kind: 'unbound-wire-endpoint', point: scaledPoint(from) });
      if (!b) diagnostics.push({ kind: 'unbound-wire-endpoint', point: scaledPoint(to) });
      continue;
    }
    wires.push({
      id: asWireId(`circ_w${wireCounter++}`),
      endpoints: [a.ref, b.ref],
      path: routeOrthogonal(a.world, b.world, a.side, b.side),
    });
  }

  return { document: { components, wires }, diagnostics };
}

interface ParsedComp {
  readonly lib: string;
  readonly name: string;
  readonly loc: Point;
  readonly attrs: Record<string, string>;
}

/**
 * Logisim coordinates are pixels at the canonical zoom; our world coords
 * are also pixels but our gates are typically 2× the Logisim default size
 * (a 50-px AND vs our 100-px AND). We scale Logisim positions by 2 so
 * imported circuits don't crowd the canvas.
 */
const COORD_SCALE = 2;

function scaledPoint(p: Point): Point {
  return { x: p.x * COORD_SCALE, y: p.y * COORD_SCALE };
}

/**
 * Logisim's `loc` attribute marks each component's *anchor pin* position
 * (output pin for sources/gates, the single wire-side pin for I/O pads).
 * Our document model uses top-left positioning, so we subtract the anchor
 * pin's local offset to convert.
 *
 * The map is partial — kinds not listed use plain top-left placement.
 */
const ANCHOR_PIN: Readonly<Record<string, string>> = {
  input: 'out',
  output: 'in',
  constant: 'out',
  clock: 'out',
  not: 'out',
  buffer: 'out',
  and: 'out',
  or: 'out',
  nand: 'out',
  nor: 'out',
  xor: 'out',
  xnor: 'out',
};

function locToTopLeft(loc: Point, kind: string, params: ComponentParams): Point {
  const scaled = scaledPoint(loc);
  const pinName = ANCHOR_PIN[kind];
  if (!pinName) return scaled;
  try {
    const shape = getShape(kind, params);
    const pin = shape.pins.find((p) => p.name === pinName);
    if (!pin) return scaled;
    return { x: scaled.x - pin.position.x, y: scaled.y - pin.position.y };
  } catch {
    return scaled;
  }
}

let importIdCounter = 0;
function nextId(prefix: string): string {
  return `circ_${prefix}_${++importIdCounter}`;
}

function mapComponent(rc: ParsedComp): VisualComponent | null {
  const name = rc.name;
  // We can usually distinguish by name alone; lib is informational.
  switch (name) {
    /* ---- Wiring ---- */
    case 'Pin': {
      const isOutput = rc.attrs['output'] === 'true';
      const widthBits = parseWidth(rc.attrs['width']) ?? 1;
      return makeComp(
        isOutput ? 'output' : 'input',
        rc.loc,
        { width: widthBits, name: rc.attrs['label'] ?? '' },
        nextId(isOutput ? 'out' : 'in'),
      );
    }
    case 'Constant':
      return makeComp(
        'constant',
        rc.loc,
        {
          width: parseWidth(rc.attrs['width']) ?? 1,
          value: parseValueLiteral(rc.attrs['value']) ?? '0',
        },
        nextId('const'),
      );
    case 'Clock':
      return makeComp('clock', rc.loc, {}, nextId('clk'));
    case 'Splitter': {
      const fanout = parseInt(rc.attrs['fanout'] ?? '2', 10) || 2;
      const widthBits = parseWidth(rc.attrs['incoming']) ?? parseWidth(rc.attrs['width']) ?? fanout;
      return makeComp(
        'splitter',
        rc.loc,
        { width: widthBits, fanout },
        nextId('split'),
      );
    }
    case 'Tunnel':
      return makeComp(
        'tunnel',
        rc.loc,
        {
          width: parseWidth(rc.attrs['width']) ?? 1,
          label: rc.attrs['label'] ?? '',
        },
        nextId('tun'),
      );

    /* ---- Gates ---- */
    case 'NOT Gate':
      return makeComp('not', rc.loc, { width: parseWidth(rc.attrs['width']) ?? 1 }, nextId('not'));
    case 'Buffer':
      return makeComp('buffer', rc.loc, { width: parseWidth(rc.attrs['width']) ?? 1 }, nextId('buf'));
    case 'AND Gate':
      return naryGate('and', rc);
    case 'OR Gate':
      return naryGate('or', rc);
    case 'NAND Gate':
      return naryGate('nand', rc);
    case 'NOR Gate':
      return naryGate('nor', rc);
    case 'XOR Gate':
      return naryGate('xor', rc);
    case 'XNOR Gate':
      return naryGate('xnor', rc);

    /* ---- Plexers ---- */
    case 'Multiplexer':
      return makeComp(
        'mux',
        rc.loc,
        {
          width: parseWidth(rc.attrs['width']) ?? 1,
          inputs: 1 << (parseInt(rc.attrs['select'] ?? '1', 10) || 1),
        },
        nextId('mux'),
      );
    case 'Demultiplexer':
      return makeComp(
        'demux',
        rc.loc,
        {
          width: parseWidth(rc.attrs['width']) ?? 1,
          outputs: 1 << (parseInt(rc.attrs['select'] ?? '1', 10) || 1),
        },
        nextId('demux'),
      );
    case 'Decoder':
      return makeComp(
        'decoder',
        rc.loc,
        { inputs: parseInt(rc.attrs['select'] ?? '2', 10) || 2 },
        nextId('dec'),
      );

    /* ---- Arithmetic ---- */
    case 'Adder':
      return makeComp('adder', rc.loc, { width: parseWidth(rc.attrs['width']) ?? 1 }, nextId('add'));
    case 'Subtractor':
      return makeComp('subtractor', rc.loc, { width: parseWidth(rc.attrs['width']) ?? 1 }, nextId('sub'));
    case 'Comparator':
      return makeComp(
        'comparator',
        rc.loc,
        {
          width: parseWidth(rc.attrs['width']) ?? 1,
          signed: rc.attrs['mode'] === 'signed',
        },
        nextId('cmp'),
      );

    /* ---- Memory ---- */
    case 'Register':
      return makeComp('register', rc.loc, { width: parseWidth(rc.attrs['width']) ?? 1 }, nextId('reg'));
    case 'Counter':
      return makeComp('counter', rc.loc, { width: parseWidth(rc.attrs['width']) ?? 4 }, nextId('cnt'));
    case 'Shift Register':
      return makeComp(
        'shift-register',
        rc.loc,
        { width: parseWidth(rc.attrs['length']) ?? 4 },
        nextId('shift'),
      );

    /* ---- I/O ---- */
    case 'Button':
      return makeComp('button', rc.loc, {}, nextId('btn'));
    case 'LED':
      return makeComp('led', rc.loc, {}, nextId('led'));
    case '7-Segment Display':
    case 'Seven-Segment Display':
      return makeComp('7seg', rc.loc, {}, nextId('7seg'));

    default:
      return null;
  }
}

function naryGate(kind: string, rc: ParsedComp): VisualComponent {
  const width = parseWidth(rc.attrs['width']) ?? 1;
  const inputs = parseInt(rc.attrs['inputs'] ?? '2', 10) || 2;
  return makeComp(kind, rc.loc, { width, inputs }, nextId(kind));
}

function makeComp(
  kind: string,
  loc: Point,
  params: ComponentParams,
  id: string,
): VisualComponent {
  return {
    id: asComponentId(id),
    kind,
    params,
    position: locToTopLeft(loc, kind, params),
    rotation: 0,
  };
}

function parsePoint(raw: string): Point | null {
  const m = raw.match(/\((-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\)/);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

function parseWidth(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Logisim writes constant values in mixed bases:
 *   `0x1A` `1A` (no prefix → hex by default) `b1010` `42` …
 * We keep it simple — pass hex with `0x` through, treat bare digits as
 * decimal, anything starting with `b` as binary. The Constant primitive
 * accepts decimal or `0xHEX`.
 */
function parseValueLiteral(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith('0x') || s.startsWith('0X')) return s;
  if (s.startsWith('b') || s.startsWith('B')) {
    try {
      const n = BigInt('0b' + s.slice(1));
      return `0x${n.toString(16)}`;
    } catch {
      return '0';
    }
  }
  // Bare hex digits in Logisim are typical for non-decimal widths.
  if (/^[0-9a-fA-F]+$/.test(s) && /[a-fA-F]/.test(s)) {
    return `0x${s}`;
  }
  return s;
}
