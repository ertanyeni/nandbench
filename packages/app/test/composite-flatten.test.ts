/**
 * Composite expansion behaves identically to a manually-flattened circuit.
 *
 * Strategy: build a half-adder as a saved circuit; build the SAME circuit
 * by hand inline; verify both compileDocument outputs produce a netlist
 * with matching net counts and that the simulator's truth-table behavior
 * agrees on a few inputs.
 */

import { describe, expect, it } from 'vitest';
import {
  asComponentId,
  createRegistry,
  createSimulator,
  lit,
  registerPrimitives,
  type ComponentInstance,
} from '@gatecraft/engine';
import { asWireId, type CircuitDocument, type VisualComponent, type VisualWire } from '../src/model/document.js';
import { asSavedCircuitId, snapshotAsSavedCircuit } from '../src/model/library.js';
import { compileDocument } from '../src/model/netlist-sync.js';

function comp(id: string, kind: string, params: Record<string, number | string | boolean> = {}): VisualComponent {
  return {
    id: asComponentId(id),
    kind,
    params,
    position: { x: 0, y: 0 },
    rotation: 0,
  };
}

function wire(id: string, a: [string, string], b: [string, string]): VisualWire {
  return {
    id: asWireId(id),
    endpoints: [
      { componentId: asComponentId(a[0]), portName: a[1] },
      { componentId: asComponentId(b[0]), portName: b[1] },
    ],
    path: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
  };
}

const halfAdderDoc: CircuitDocument = {
  components: [
    comp('a', 'input', { width: 1 }),
    comp('b', 'input', { width: 1 }),
    comp('x', 'xor', { width: 1, inputs: 2 }),
    comp('n', 'and', { width: 1, inputs: 2 }),
    comp('sum', 'output', { width: 1 }),
    comp('cout', 'output', { width: 1 }),
  ],
  wires: [
    wire('w1', ['a', 'out'], ['x', 'in0']),
    wire('w2', ['b', 'out'], ['x', 'in1']),
    wire('w3', ['a', 'out'], ['n', 'in0']),
    wire('w4', ['b', 'out'], ['n', 'in1']),
    wire('w5', ['x', 'out'], ['sum', 'in']),
    wire('w6', ['n', 'out'], ['cout', 'in']),
  ],
};

describe('Composite flatten — half-adder equivalence', () => {
  it('expands to the same net count as the flat half-adder', () => {
    const savedId = asSavedCircuitId('ha-1');
    const saved = snapshotAsSavedCircuit(savedId, 'Half Adder', halfAdderDoc);

    // Equivalent flat doc: same as halfAdderDoc.
    const flat = compileDocument(halfAdderDoc, []);

    // Composite usage: a single instance referring to the saved circuit, with
    // external pins (input a / b / output sum / cout) wired up.
    const usage: CircuitDocument = {
      components: [
        comp('ext_a', 'input', { width: 1 }),
        comp('ext_b', 'input', { width: 1 }),
        comp('ha', `composite:${savedId}`, { refId: savedId }),
        comp('ext_sum', 'output', { width: 1 }),
        comp('ext_cout', 'output', { width: 1 }),
      ],
      wires: [
        wire('u1', ['ext_a', 'out'], ['ha', 'in0']),
        wire('u2', ['ext_b', 'out'], ['ha', 'in1']),
        wire('u3', ['ha', 'out0'], ['ext_sum', 'in']),
        wire('u4', ['ha', 'out1'], ['ext_cout', 'in']),
      ],
    };
    const expanded = compileDocument(usage, [saved]);

    // The expanded usage has the same net count as the flat doc — both
    // have an internal A net, B net, XOR.out, AND.out, plus a single
    // external sum/cout pin connection per output.
    expect(expanded.netlist.nets.size).toBe(flat.netlist.nets.size);
    expect(expanded.diagnostics).toEqual([]);
  });

  it('simulates identically to the flat half-adder on the full truth table', () => {
    const savedId = asSavedCircuitId('ha-2');
    const saved = snapshotAsSavedCircuit(savedId, 'Half Adder', halfAdderDoc);
    const usage: CircuitDocument = {
      components: [
        comp('ext_a', 'input', { width: 1 }),
        comp('ext_b', 'input', { width: 1 }),
        comp('ha', `composite:${savedId}`, { refId: savedId }),
        comp('ext_sum', 'output', { width: 1 }),
        comp('ext_cout', 'output', { width: 1 }),
      ],
      wires: [
        wire('u1', ['ext_a', 'out'], ['ha', 'in0']),
        wire('u2', ['ext_b', 'out'], ['ha', 'in1']),
        wire('u3', ['ha', 'out0'], ['ext_sum', 'in']),
        wire('u4', ['ha', 'out1'], ['ext_cout', 'in']),
      ],
    };
    const { netlist } = compileDocument(usage, [saved]);
    const registry = createRegistry();
    registerPrimitives(registry);
    const sim = createSimulator(registry);
    sim.load(netlist);

    const drive = (compId: string, value: 0 | 1): void => {
      sim.setInput({ componentId: asComponentId(compId), portName: 'out' }, lit(1, BigInt(value)));
    };
    const readNet = (compId: string, portName: string): bigint => {
      const k = `${compId}:${portName}` as never;
      const snap = sim.snapshot();
      const netId = netlist.portToNet.get(k);
      const v = netId ? snap.nets.get(netId) : undefined;
      if (!v) throw new Error(`no value for ${compId}:${portName}`);
      return v.value;
    };

    for (const [a, b] of [[0, 0], [0, 1], [1, 0], [1, 1]] as const) {
      drive('ext_a', a);
      drive('ext_b', b);
      sim.settle();
      const sum = a ^ b;
      const cout = a & b;
      expect(readNet('ext_sum', 'in')).toBe(BigInt(sum));
      expect(readNet('ext_cout', 'in')).toBe(BigInt(cout));
    }
  });

  it('cycle guard: A→B→A produces a composite-cycle diagnostic without throwing', () => {
    // Construct a self-referential pair by mutual references. Saved circuit A
    // contains a placeholder for B, and B references A. We model the
    // references with composite kinds whose refIds point at each other.
    const idA = asSavedCircuitId('cycle-a');
    const idB = asSavedCircuitId('cycle-b');
    const docA: CircuitDocument = {
      components: [comp('inner_b', `composite:${idB}`, { refId: idB })],
      wires: [],
    };
    const docB: CircuitDocument = {
      components: [comp('inner_a', `composite:${idA}`, { refId: idA })],
      wires: [],
    };
    const savedA = snapshotAsSavedCircuit(idA, 'A', docA);
    const savedB = snapshotAsSavedCircuit(idB, 'B', docB);

    const usage: CircuitDocument = {
      components: [comp('root', `composite:${idA}`, { refId: idA })],
      wires: [],
    };
    const { diagnostics } = compileDocument(usage, [savedA, savedB]);
    expect(diagnostics.some((d) => d.kind === 'composite-cycle')).toBe(true);
  });

  it('two instances of the same composite stay independent (no state collision)', () => {
    const savedId = asSavedCircuitId('ha-3');
    const saved = snapshotAsSavedCircuit(savedId, 'Half Adder', halfAdderDoc);
    const usage: CircuitDocument = {
      components: [
        comp('a1', 'input', { width: 1 }),
        comp('b1', 'input', { width: 1 }),
        comp('a2', 'input', { width: 1 }),
        comp('b2', 'input', { width: 1 }),
        comp('h1', `composite:${savedId}`, { refId: savedId }),
        comp('h2', `composite:${savedId}`, { refId: savedId }),
        comp('s1', 'output', { width: 1 }),
        comp('s2', 'output', { width: 1 }),
      ],
      wires: [
        wire('w1', ['a1', 'out'], ['h1', 'in0']),
        wire('w2', ['b1', 'out'], ['h1', 'in1']),
        wire('w3', ['h1', 'out0'], ['s1', 'in']),
        wire('w4', ['a2', 'out'], ['h2', 'in0']),
        wire('w5', ['b2', 'out'], ['h2', 'in1']),
        wire('w6', ['h2', 'out0'], ['s2', 'in']),
      ],
    };
    const { netlist, diagnostics } = compileDocument(usage, [saved]);
    expect(diagnostics).toEqual([]);
    // Inner XOR is unique per instance via namespaced ids: h1/x and h2/x.
    const inner = [...netlist.components.values()].filter((c) => c.kind === 'xor');
    expect(inner).toHaveLength(2);
    const ids = inner.map((c: ComponentInstance) => c.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
