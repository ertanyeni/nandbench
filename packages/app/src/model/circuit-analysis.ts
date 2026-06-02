/**
 * Static analysis of a CircuitDocument. Pure derivation — no
 * simulation, no live state. Drives the "Analysis" tab in the export
 * modal and feeds into the Markdown report.
 *
 * Metrics:
 *   - gate count by kind
 *   - top-level inputs / outputs with widths
 *   - wire count + longest wire path length (in points)
 *   - critical-path depth — longest combinational chain (BFS through
 *     the netlist, treating sequential components as boundary nodes)
 *   - fan-out histogram — distribution of "how many sinks does one
 *     driver feed"
 *   - sequential flag — true if the design contains any flip-flop /
 *     latch / register / counter / RAM (so we know not to print a
 *     truth table for it)
 */

import type { CircuitDocument, VisualComponent } from './document.js';
import { compileDocument } from './netlist-sync.js';
import type { SavedCircuit } from './library.js';

export interface CircuitAnalysis {
  componentCount: number;
  wireCount: number;
  longestWireSegments: number;
  byKind: Record<string, number>;
  inputs: { name: string; width: number }[];
  outputs: { name: string; width: number }[];
  criticalPathDepth: number;
  fanOutHistogram: { fanOut: number; portCount: number }[];
  isSequential: boolean;
  sequentialElements: { kind: string; count: number }[];
}

const INPUT_KINDS = new Set(['input', 'button']);
const OUTPUT_KINDS = new Set(['output', 'led']);
const SEQUENTIAL_KINDS = new Set([
  'register',
  'counter',
  'shiftRegister',
  'dFlipFlop',
  'jkFlipFlop',
  'tFlipFlop',
  'srFlipFlop',
  'ram',
  'rom',
]);

function portName(c: VisualComponent): string {
  const n = c.params['name'];
  return typeof n === 'string' && n ? n : c.id.slice(0, 6);
}

function width(c: VisualComponent): number {
  return Math.max(1, Number(c.params['width'] ?? 1));
}

export function analyzeCircuit(
  doc: CircuitDocument,
  library: readonly SavedCircuit[],
): CircuitAnalysis {
  const byKind: Record<string, number> = {};
  const inputs: { name: string; width: number }[] = [];
  const outputs: { name: string; width: number }[] = [];
  const sequentialBy = new Map<string, number>();

  for (const c of doc.components) {
    byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
    if (INPUT_KINDS.has(c.kind)) inputs.push({ name: portName(c), width: width(c) });
    if (OUTPUT_KINDS.has(c.kind)) outputs.push({ name: portName(c), width: width(c) });
    if (SEQUENTIAL_KINDS.has(c.kind)) {
      sequentialBy.set(c.kind, (sequentialBy.get(c.kind) ?? 0) + 1);
    }
  }
  inputs.sort((a, b) => a.name.localeCompare(b.name));
  outputs.sort((a, b) => a.name.localeCompare(b.name));

  let longestWireSegments = 0;
  for (const w of doc.wires) {
    if (w.path.length - 1 > longestWireSegments) longestWireSegments = w.path.length - 1;
  }

  const compiled = compileDocument(doc, library);
  const { criticalPathDepth, fanOutHistogram } = depthAndFanOut(doc, compiled);

  const sequentialElements = Array.from(sequentialBy.entries())
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => a.kind.localeCompare(b.kind));

  return {
    componentCount: doc.components.length,
    wireCount: doc.wires.length,
    longestWireSegments,
    byKind,
    inputs,
    outputs,
    criticalPathDepth,
    fanOutHistogram,
    isSequential: sequentialElements.length > 0,
    sequentialElements,
  };
}

/**
 * Compute the depth of the longest input-to-output combinational chain
 * and a fan-out histogram. Sequential components break the chain — we
 * treat them as both sinks (terminating the prior level) and sources
 * (starting a new level at 0).
 */
function depthAndFanOut(
  doc: CircuitDocument,
  compiled: ReturnType<typeof compileDocument>,
): { criticalPathDepth: number; fanOutHistogram: { fanOut: number; portCount: number }[] } {
  // Adjacency: for each component, the set of downstream components
  // reachable through one wire hop. Walk every wire endpoint pair: if
  // one side is an output port and the other is an input port (by the
  // component kind's shape), the source feeds the sink.
  const downstream = new Map<string, Set<string>>();
  const fanOutPerPort = new Map<string, number>();
  for (const w of doc.wires) {
    const a = w.endpoints[0];
    const b = w.endpoints[1];
    if (!a || !b) continue;
    const aId = String(a.componentId);
    const bId = String(b.componentId);
    // We don't know which endpoint is driver vs sink without consulting
    // the kind shapes — for the purpose of depth, treat as bidirectional
    // contribution to a DAG. Cycles will simply be ignored by the BFS.
    const arr = downstream.get(aId) ?? new Set<string>();
    arr.add(bId);
    downstream.set(aId, arr);
    const brr = downstream.get(bId) ?? new Set<string>();
    brr.add(aId);
    downstream.set(bId, brr);
    fanOutPerPort.set(
      `${aId}:${a.portName}`,
      (fanOutPerPort.get(`${aId}:${a.portName}`) ?? 0) + 1,
    );
    fanOutPerPort.set(
      `${bId}:${b.portName}`,
      (fanOutPerPort.get(`${bId}:${b.portName}`) ?? 0) + 1,
    );
  }

  // Sources: every top-level input + every output of a sequential.
  // Cast through `string` so the Map/Set anahtarları branded id'lerle
  // çatışmasın — Map içeriği saf string olarak tutuluyor.
  const seqIds = new Set<string>(
    doc.components.filter((c) => SEQUENTIAL_KINDS.has(c.kind)).map((c) => String(c.id)),
  );
  const inputIds = doc.components
    .filter((c) => INPUT_KINDS.has(c.kind))
    .map((c) => String(c.id));
  const startIds = [...inputIds, ...seqIds];

  let criticalPathDepth = 0;
  for (const start of startIds) {
    // BFS, but stop at sequential components (they're "boundaries").
    const dist = new Map<string, number>();
    dist.set(start, 0);
    const queue: string[] = [start];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const d = dist.get(id) ?? 0;
      if (d > criticalPathDepth) criticalPathDepth = d;
      // Don't traverse out of a sequential element after the boundary.
      if (id !== start && seqIds.has(id)) continue;
      const next = downstream.get(id);
      if (!next) continue;
      for (const m of next) {
        if (dist.has(m)) continue;
        dist.set(m, d + 1);
        queue.push(m);
      }
    }
  }

  // Fan-out histogram: bucket per fan-out count.
  const hist = new Map<number, number>();
  for (const [, fo] of fanOutPerPort) {
    hist.set(fo, (hist.get(fo) ?? 0) + 1);
  }
  const fanOutHistogram = Array.from(hist.entries())
    .map(([fanOut, portCount]) => ({ fanOut, portCount }))
    .sort((a, b) => a.fanOut - b.fanOut);

  // Suppress unused parameter warning — compiled netlist will become
  // useful if we want to walk by netId in the future.
  void compiled;

  return { criticalPathDepth, fanOutHistogram };
}

export function analysisToMarkdown(a: CircuitAnalysis): string {
  const lines: string[] = [];
  lines.push('## Analysis');
  lines.push('');
  lines.push(`- Components: **${a.componentCount}**`);
  lines.push(`- Wires: **${a.wireCount}** (longest path: ${a.longestWireSegments} segments)`);
  lines.push(`- Critical-path depth (gate-delay units): **${a.criticalPathDepth}**`);
  lines.push(`- Sequential? **${a.isSequential ? 'yes' : 'no'}**`);
  if (a.sequentialElements.length > 0) {
    lines.push(
      `  - Sequential elements: ${a.sequentialElements.map((s) => `${s.kind}×${s.count}`).join(', ')}`,
    );
  }
  lines.push('');
  lines.push('### Component breakdown');
  lines.push('');
  lines.push('| Kind | Count |');
  lines.push('| --- | --- |');
  for (const [kind, count] of Object.entries(a.byKind).sort()) {
    lines.push(`| ${kind} | ${count} |`);
  }
  if (a.inputs.length > 0) {
    lines.push('');
    lines.push('### Top-level inputs');
    lines.push('');
    lines.push('| Name | Width |');
    lines.push('| --- | --- |');
    for (const p of a.inputs) lines.push(`| ${p.name} | ${p.width} |`);
  }
  if (a.outputs.length > 0) {
    lines.push('');
    lines.push('### Top-level outputs');
    lines.push('');
    lines.push('| Name | Width |');
    lines.push('| --- | --- |');
    for (const p of a.outputs) lines.push(`| ${p.name} | ${p.width} |`);
  }
  if (a.fanOutHistogram.length > 0) {
    lines.push('');
    lines.push('### Fan-out histogram');
    lines.push('');
    lines.push('| Fan-out | Ports |');
    lines.push('| --- | --- |');
    for (const b of a.fanOutHistogram) lines.push(`| ${b.fanOut} | ${b.portCount} |`);
  }
  return lines.join('\n');
}
