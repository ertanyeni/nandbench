/**
 * Bridge between the document and the engine's net compiler.
 *
 * Two layers of work happen here:
 *   1. Composite expansion — every `composite` component in the document
 *      is replaced inline by its saved sub-circuit's components + wires,
 *      with namespaced ids so two instances of the same circuit don't
 *      collide. Recursive: composites nested inside composites get fully
 *      expanded into a flat netlist.
 *   2. Tunnel merging — same-label tunnels get virtual connections
 *      synthesized.
 *
 * The output is a NetlistInput that the engine's compileNetlist consumes
 * verbatim: the engine has no idea hierarchy or tunnels exist.
 */

import {
  compileNetlist,
  createRegistry,
  registerPrimitives,
  type CompiledNetlist,
  type ComponentId,
  type ComponentInstance,
  type ComponentRegistry,
  type Diagnostic,
  type NetlistInput,
  type PortRef,
} from '@nandbench/engine';
import type { CircuitDocument, VisualComponent, VisualWire } from './document.js';
import type { CompositePort, SavedCircuit } from './library.js';

let cachedRegistry: ComponentRegistry | null = null;
function getRegistry(): ComponentRegistry {
  if (!cachedRegistry) {
    cachedRegistry = createRegistry();
    registerPrimitives(cachedRegistry);
  }
  return cachedRegistry;
}

export interface CompiledState {
  readonly netlist: CompiledNetlist;
  readonly diagnostics: readonly Diagnostic[];
}

export function compileDocument(
  doc: CircuitDocument,
  library: readonly SavedCircuit[] = [],
): CompiledState {
  const libIndex = new Map<string, SavedCircuit>();
  for (const sc of library) libIndex.set(sc.id, sc);

  // Flatten composites + carry the per-port mapping that lets us turn the
  // composite instance's external pin into the corresponding inner pin.
  const flattenDiagnostics: Diagnostic[] = [];
  const flat = flattenDocument(doc, libIndex, {
    visited: new Set(),
    depth: 0,
    diagnostics: flattenDiagnostics,
  });

  const components: ComponentInstance[] = flat.components.map((c) => ({
    id: c.id,
    kind: c.kind,
    params: c.params,
    state: undefined as unknown,
  }));
  const connections: { a: PortRef; b: PortRef }[] = flat.wires.map((w) => ({
    a: w.endpoints[0],
    b: w.endpoints[1],
  }));

  // Tunnel-by-label virtual connections.
  const tunnelGroups = new Map<string, ComponentInstance[]>();
  for (const c of components) {
    if (c.kind !== 'tunnel') continue;
    const label = String(c.params['label'] ?? '');
    if (!label) continue;
    const width = Number(c.params['width'] ?? 1);
    const key = `${width}|${label}`;
    let group = tunnelGroups.get(key);
    if (!group) {
      group = [];
      tunnelGroups.set(key, group);
    }
    group.push(c);
  }
  for (const group of tunnelGroups.values()) {
    if (group.length < 2) continue;
    const hub = group[0]!;
    for (let i = 1; i < group.length; i++) {
      connections.push({
        a: { componentId: hub.id, portName: 'port' },
        b: { componentId: group[i]!.id, portName: 'port' },
      });
    }
  }

  const input: NetlistInput = { components, connections };
  const { netlist, diagnostics } = compileNetlist(input, getRegistry());
  return { netlist, diagnostics: [...flattenDiagnostics, ...diagnostics] };
}

const MAX_COMPOSITE_DEPTH = 32;

interface FlattenCtx {
  readonly visited: Set<string>;
  readonly depth: number;
  readonly diagnostics: Diagnostic[];
}

/* ------------------------ flattening ------------------------ */

interface FlatDoc {
  readonly components: readonly VisualComponent[];
  readonly wires: readonly VisualWire[];
}

function flattenDocument(
  doc: CircuitDocument,
  library: ReadonlyMap<string, SavedCircuit>,
  ctx: FlattenCtx,
): FlatDoc {
  const components: VisualComponent[] = [];
  const wires: VisualWire[] = [];

  // For each composite, after expanding inside, record the mapping from
  // (composite.id, externalPortName) → inner namespaced component id. The
  // composite's incident wires then get their endpoints translated to the
  // inner pin.
  type Mapping = ReadonlyMap<string, { componentId: ComponentId; portName: string }>;
  const compositeMapping = new Map<ComponentId, Mapping>();

  for (const c of doc.components) {
    if (!c.kind.startsWith('composite:')) {
      components.push(c);
      continue;
    }
    const refId = String(c.params['refId'] ?? '');
    const saved = library.get(refId);
    if (!saved) {
      // Library entry missing — keep the visual but drop electrical effect.
      components.push(c);
      continue;
    }
    // Cycle guard: a composite cannot transitively contain itself.
    if (ctx.visited.has(refId)) {
      ctx.diagnostics.push({
        kind: 'composite-cycle',
        chain: [...ctx.visited, refId],
      } as Diagnostic);
      // Drop electrical effect AND the unresolved composite placeholder.
      continue;
    }
    if (ctx.depth >= MAX_COMPOSITE_DEPTH) {
      ctx.diagnostics.push({
        kind: 'composite-depth-exceeded',
        depth: ctx.depth,
      } as Diagnostic);
      continue;
    }
    const expansion = expandComposite(c, saved, library, {
      visited: new Set([...ctx.visited, refId]),
      depth: ctx.depth + 1,
      diagnostics: ctx.diagnostics,
    });
    components.push(...expansion.components);
    wires.push(...expansion.wires);
    compositeMapping.set(c.id, expansion.portMap);
  }

  // Translate wire endpoints that point at a composite's external port.
  for (const w of doc.wires) {
    const a = translateEndpoint(w.endpoints[0], compositeMapping);
    const b = translateEndpoint(w.endpoints[1], compositeMapping);
    wires.push({ ...w, endpoints: [a, b] });
  }

  return { components, wires };
}

function translateEndpoint(
  ref: PortRef,
  mapping: ReadonlyMap<ComponentId, ReadonlyMap<string, { componentId: ComponentId; portName: string }>>,
): PortRef {
  const m = mapping.get(ref.componentId);
  if (!m) return ref;
  const target = m.get(ref.portName);
  if (!target) return ref;
  return { componentId: target.componentId, portName: target.portName };
}

interface ExpansionResult {
  readonly components: readonly VisualComponent[];
  readonly wires: readonly VisualWire[];
  /** External port name (on the composite instance) → inner component port. */
  readonly portMap: ReadonlyMap<string, { componentId: ComponentId; portName: string }>;
}

function expandComposite(
  instance: VisualComponent,
  saved: SavedCircuit,
  library: ReadonlyMap<string, SavedCircuit>,
  ctx: FlattenCtx,
): ExpansionResult {
  // First recursively flatten the inner doc.
  const inner = flattenDocument(saved.doc, library, ctx);
  // Prefix every inner id with `${instance.id}/` to avoid collisions
  // across multiple instances of the same composite.
  const idPrefix = `${instance.id}/`;
  const remap = (id: ComponentId): ComponentId => (idPrefix + id) as ComponentId;

  const components: VisualComponent[] = inner.components.map((c) => ({
    ...c,
    id: remap(c.id),
    // Hide the inner Input/Output pins visually by translating them off-screen.
    // The composite's instance bbox already represents the unit visually.
    position: { x: c.position.x + 100_000, y: c.position.y + 100_000 },
  }));
  const wires: VisualWire[] = inner.wires.map((w) => ({
    ...w,
    id: (idPrefix + w.id) as VisualWire['id'],
    endpoints: [
      { componentId: remap(w.endpoints[0].componentId), portName: w.endpoints[0].portName },
      { componentId: remap(w.endpoints[1].componentId), portName: w.endpoints[1].portName },
    ],
    path: w.path.map((p) => ({ x: p.x + 100_000, y: p.y + 100_000 })),
  }));

  // Build the external-port → inner-pin map. Composite inputs map to the
  // saved circuit's `input` (or button) components' `out` port; outputs to
  // `output`/`led` components' `in` port.
  const portMap = new Map<string, { componentId: ComponentId; portName: string }>();
  for (const p of saved.inputs) {
    portMap.set(p.name, { componentId: remap(p.innerComponentId), portName: 'out' });
  }
  for (const p of saved.outputs) {
    portMap.set(p.name, { componentId: remap(p.innerComponentId), portName: 'in' });
  }

  return { components, wires, portMap };
}

/**
 * The set of external ports a composite instance exposes — derived from
 * its referenced saved circuit. Returned in a stable order (inputs first,
 * outputs after) so the renderer can lay them out predictably.
 */
export function compositePorts(
  saved: SavedCircuit,
): readonly CompositePort[] {
  return [...saved.inputs, ...saved.outputs];
}
