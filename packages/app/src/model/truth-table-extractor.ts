/**
 * Automatic truth-table extraction. Walks every combination of the
 * top-level inputs, drives them through a fresh simulator instance,
 * reads the named outputs, and returns the table as both a structured
 * value and pre-formatted Markdown / CSV strings.
 *
 * Mirrors the shape of `challenge-runner.ts` — same input/output
 * conventions (kind `input|button` for inputs, `output|led` for
 * outputs, `params.name` is the column header).
 *
 * Each input's width is honoured — a 4-bit input enumerates 2⁴ values
 * per column. The total row count is `2^Σ(width)`. To stay sane in
 * the UI we cap at `MAX_ROWS_HARD` (4096); anything bigger returns
 * `tooLarge` so the caller can render a sampled or capped table.
 */

import {
  createRegistry,
  createSimulator,
  lit,
  portKey,
  registerPrimitives,
  type ComponentRegistry,
  type PortRef,
} from '@nandbench/engine';
import type { CircuitDocument, VisualComponent } from './document.js';
import type { SavedCircuit } from './library.js';
import { compileDocument } from './netlist-sync.js';

const MAX_ROWS_HARD = 4096;

let cachedRegistry: ComponentRegistry | null = null;
function getRegistry(): ComponentRegistry {
  if (!cachedRegistry) {
    cachedRegistry = createRegistry();
    registerPrimitives(cachedRegistry);
  }
  return cachedRegistry;
}

export interface TruthTablePort {
  name: string;
  width: number;
}

export interface TruthTable {
  inputs: readonly TruthTablePort[];
  outputs: readonly TruthTablePort[];
  /** One row per input combination; values are stringified (e.g. "0", "1", "X", "Z"). */
  rows: readonly { in: readonly string[]; out: readonly string[] }[];
}

export type ExtractionResult =
  | { kind: 'ok'; table: TruthTable }
  | { kind: 'empty'; reason: 'no-inputs' | 'no-outputs' }
  | { kind: 'too-large'; rowCount: number; cap: number }
  | { kind: 'error'; message: string };

function topLevelInputs(doc: CircuitDocument): VisualComponent[] {
  return doc.components
    .filter((c) => c.kind === 'input' || c.kind === 'button')
    .slice()
    .sort(sortByName);
}

function topLevelOutputs(doc: CircuitDocument): VisualComponent[] {
  return doc.components
    .filter((c) => c.kind === 'output' || c.kind === 'led')
    .slice()
    .sort(sortByName);
}

function sortByName(a: VisualComponent, b: VisualComponent): number {
  const na = String(a.params['name'] ?? a.id);
  const nb = String(b.params['name'] ?? b.id);
  return na.localeCompare(nb);
}

function portName(c: VisualComponent): string {
  const name = c.params['name'];
  if (typeof name === 'string' && name.trim()) return name.trim();
  return c.id.slice(0, 6);
}

function width(c: VisualComponent): number {
  return Math.max(1, Number(c.params['width'] ?? 1));
}

export function extractTruthTable(
  doc: CircuitDocument,
  library: readonly SavedCircuit[],
): ExtractionResult {
  try {
    const inComps = topLevelInputs(doc);
    const outComps = topLevelOutputs(doc);
    if (inComps.length === 0) return { kind: 'empty', reason: 'no-inputs' };
    if (outComps.length === 0) return { kind: 'empty', reason: 'no-outputs' };

    const totalBits = inComps.reduce((s, c) => s + width(c), 0);
    const rowCount = 2 ** totalBits;
    if (rowCount > MAX_ROWS_HARD) {
      return { kind: 'too-large', rowCount, cap: MAX_ROWS_HARD };
    }

    const inputs: TruthTablePort[] = inComps.map((c) => ({
      name: portName(c),
      width: width(c),
    }));
    const outputs: TruthTablePort[] = outComps.map((c) => ({
      name: portName(c),
      width: width(c),
    }));

    const inputPins: { ref: PortRef; width: number }[] = inComps.map((c) => ({
      ref: { componentId: c.id, portName: 'out' },
      width: width(c),
    }));
    const outputPins: { ref: PortRef }[] = outComps.map((c) => ({
      ref: { componentId: c.id, portName: 'in' },
    }));

    const compiled = compileDocument(doc, library);
    const registry = getRegistry();
    const sim = createSimulator(registry);
    sim.load(compiled.netlist);

    const rows: { in: string[]; out: string[] }[] = [];

    // Enumerate as a single big number then split per input width.
    for (let r = 0; r < rowCount; r++) {
      let remaining = BigInt(r);
      const inputValues: bigint[] = [];
      // Most-significant first — first input column iterates slowest.
      for (let i = inComps.length - 1; i >= 0; i--) {
        const w = inputPins[i]!.width;
        const mask = (1n << BigInt(w)) - 1n;
        inputValues.unshift(remaining & mask);
        remaining >>= BigInt(w);
      }
      // Drive every input.
      inputPins.forEach((pin, i) => {
        sim.setInput(pin.ref, lit(pin.width, inputValues[i] ?? 0n));
      });
      sim.settle();
      const snap = sim.snapshot();
      const got: string[] = outputPins.map((op) => {
        const netId = compiled.netlist.portToNet.get(
          portKey(op.ref.componentId, op.ref.portName),
        );
        if (!netId) return '?';
        const value = snap.nets.get(netId);
        if (!value) return '?';
        if (value.unknown !== 0n) return 'X';
        if (value.hiZ !== 0n) return 'Z';
        return String(value.value);
      });
      rows.push({
        in: inputValues.map((v, i) => formatValue(v, inputs[i]!.width)),
        out: got,
      });
    }
    return { kind: 'ok', table: { inputs, outputs, rows } };
  } catch (e) {
    return {
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

function formatValue(v: bigint, w: number): string {
  // 1-bit columns render as plain 0/1; wider as binary so the table
  // reads as a true truth table.
  if (w === 1) return String(v);
  const s = v.toString(2);
  return s.padStart(w, '0');
}

export function tableToMarkdown(table: TruthTable): string {
  const header = `| ${table.inputs.map((p) => p.name).join(' | ')} | ${table.outputs.map((p) => p.name).join(' | ')} |`;
  const sep = `| ${table.inputs.map(() => '---').join(' | ')} | ${table.outputs.map(() => '---').join(' | ')} |`;
  const body = table.rows
    .map((r) => `| ${r.in.join(' | ')} | ${r.out.join(' | ')} |`)
    .join('\n');
  return `${header}\n${sep}\n${body}`;
}

export function tableToCSV(table: TruthTable): string {
  const header = [...table.inputs.map((p) => p.name), ...table.outputs.map((p) => p.name)].join(
    ',',
  );
  const body = table.rows.map((r) => [...r.in, ...r.out].join(',')).join('\n');
  return `${header}\n${body}`;
}
