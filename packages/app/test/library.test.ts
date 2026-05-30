/**
 * Library + 2-level composite nesting tests.
 *
 *   - snapshotAsSavedCircuit captures pins + doc faithfully
 *   - inferInterface extracts named inputs/outputs from a document
 *   - Two-level nesting (composite A uses composite B uses primitives)
 *     compiles to a flat netlist that simulates the same as a hand-
 *     flattened reference.
 */

import {
  asComponentId,
  createRegistry,
  createSimulator,
  lit,
  portKey,
  registerPrimitives,
} from '@gatecraft/engine';
import { describe, expect, it } from 'vitest';
import {
  asWireId,
  type CircuitDocument,
  type VisualComponent,
  type VisualWire,
} from '../src/model/document.js';
import {
  asSavedCircuitId,
  inferInterface,
  snapshotAsSavedCircuit,
} from '../src/model/library.js';
import { compileDocument } from '../src/model/netlist-sync.js';

function comp(
  id: string,
  kind: string,
  params: Record<string, number | string | boolean> = {},
): VisualComponent {
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
    comp('a', 'input', { width: 1, name: 'A' }),
    comp('b', 'input', { width: 1, name: 'B' }),
    comp('s', 'output', { width: 1, name: 'sum' }),
    comp('c', 'output', { width: 1, name: 'cout' }),
    comp('xor', 'xor', { width: 1, inputs: 2 }),
    comp('and', 'and', { width: 1, inputs: 2 }),
  ],
  wires: [
    wire('w1', ['a', 'out'], ['xor', 'in0']),
    wire('w2', ['b', 'out'], ['xor', 'in1']),
    wire('w3', ['a', 'out'], ['and', 'in0']),
    wire('w4', ['b', 'out'], ['and', 'in1']),
    wire('w5', ['xor', 'out'], ['s', 'in']),
    wire('w6', ['and', 'out'], ['c', 'in']),
  ],
};

describe('library', () => {
  it('inferInterface picks up named inputs/outputs in port order', () => {
    const iface = inferInterface(halfAdderDoc);
    expect(iface.inputs.map((p) => p.name)).toEqual(['A', 'B']);
    expect(iface.outputs.map((p) => p.name)).toEqual(['sum', 'cout']);
  });

  it('snapshotAsSavedCircuit round-trips name + doc + interface', () => {
    const id = asSavedCircuitId('lib_ha');
    const sc = snapshotAsSavedCircuit(id, 'HalfAdder', halfAdderDoc);
    expect(sc.id).toBe(id);
    expect(sc.name).toBe('HalfAdder');
    expect(sc.doc).toEqual(halfAdderDoc);
    expect(sc.inputs.map((p) => p.name)).toEqual(['A', 'B']);
    expect(sc.outputs.map((p) => p.name)).toEqual(['sum', 'cout']);
  });
});

/* -------------- Two-level nested composite test -------------- */

/**
 * Build a "full-adder" composite by wiring two half-adder composites
 * plus an OR — the canonical 2-level nest. Compile + simulate; expect
 * the truth table to match.
 */
describe('composite nesting (2 levels)', () => {
  it('full-adder built from two half-adder composites simulates correctly', () => {
    const haId = asSavedCircuitId('lib_ha');
    const ha = snapshotAsSavedCircuit(haId, 'HalfAdder', halfAdderDoc);
    const library = [ha];

    // Outer doc: 3 inputs (a, b, cin), 2 outputs (sum, cout), two HA
    // composite instances + one OR.
    const fullAdderDoc: CircuitDocument = {
      components: [
        comp('ia', 'input', { width: 1, name: 'a' }),
        comp('ib', 'input', { width: 1, name: 'b' }),
        comp('icin', 'input', { width: 1, name: 'cin' }),
        comp('osum', 'output', { width: 1, name: 'sum' }),
        comp('ocout', 'output', { width: 1, name: 'cout' }),
        comp('ha1', `composite:${haId}`, { refId: haId }),
        comp('ha2', `composite:${haId}`, { refId: haId }),
        comp('orCout', 'or', { width: 1, inputs: 2 }),
      ],
      wires: [
        // ha1 takes a + b
        wire('w1', ['ia', 'out'], ['ha1', 'A']),
        wire('w2', ['ib', 'out'], ['ha1', 'B']),
        // ha2 takes ha1.sum + cin
        wire('w3', ['ha1', 'sum'], ['ha2', 'A']),
        wire('w4', ['icin', 'out'], ['ha2', 'B']),
        // out sum = ha2.sum, cout = ha1.cout OR ha2.cout
        wire('w5', ['ha2', 'sum'], ['osum', 'in']),
        wire('w6', ['ha1', 'cout'], ['orCout', 'in0']),
        wire('w7', ['ha2', 'cout'], ['orCout', 'in1']),
        wire('w8', ['orCout', 'out'], ['ocout', 'in']),
      ],
    };

    const { netlist, diagnostics } = compileDocument(fullAdderDoc, library);
    expect(diagnostics).toEqual([]);

    const registry = createRegistry();
    registerPrimitives(registry);
    const sim = createSimulator(registry);
    sim.load(netlist);

    // Walk the full-adder truth table — find the input/output component
    // instances in the flat netlist by their `name` param.
    const findInputId = (name: string): string => {
      for (const [cid, inst] of netlist.components) {
        if (inst.kind === 'input' && String(inst.params['name']) === name) {
          return cid as unknown as string;
        }
      }
      throw new Error(`input ${name} not found`);
    };
    const findOutputNet = (name: string): string => {
      for (const [cid, inst] of netlist.components) {
        if (inst.kind === 'output' && String(inst.params['name']) === name) {
          const key = portKey(cid, 'in');
          const netId = netlist.portToNet.get(key);
          if (netId) return netId as unknown as string;
        }
      }
      throw new Error(`output ${name} not found`);
    };

    const aId = findInputId('a');
    const bId = findInputId('b');
    const cinId = findInputId('cin');
    const sumNet = findOutputNet('sum');
    const coutNet = findOutputNet('cout');

    const cases = [
      { a: 0, b: 0, cin: 0, sum: 0, cout: 0 },
      { a: 0, b: 0, cin: 1, sum: 1, cout: 0 },
      { a: 0, b: 1, cin: 0, sum: 1, cout: 0 },
      { a: 0, b: 1, cin: 1, sum: 0, cout: 1 },
      { a: 1, b: 0, cin: 0, sum: 1, cout: 0 },
      { a: 1, b: 0, cin: 1, sum: 0, cout: 1 },
      { a: 1, b: 1, cin: 0, sum: 0, cout: 1 },
      { a: 1, b: 1, cin: 1, sum: 1, cout: 1 },
    ];
    for (const c of cases) {
      sim.setInput({ componentId: aId as never, portName: 'out' }, lit(1, BigInt(c.a)));
      sim.setInput({ componentId: bId as never, portName: 'out' }, lit(1, BigInt(c.b)));
      sim.setInput({ componentId: cinId as never, portName: 'out' }, lit(1, BigInt(c.cin)));
      sim.settle();
      const snap = sim.snapshot();
      const sumVal = snap.nets.get(sumNet as never);
      const coutVal = snap.nets.get(coutNet as never);
      expect(Number(sumVal!.value)).toBe(c.sum);
      expect(Number(coutVal!.value)).toBe(c.cout);
    }
  });
});
