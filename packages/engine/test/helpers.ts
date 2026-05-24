/**
 * Test helpers — small DSL for building circuits in tests.
 * Keeps actual test files focused on inputs and expected outputs.
 */

import {
  asComponentId,
  compileNetlist,
  createRegistry,
  createSimulator,
  lit,
  portKey,
  registerPrimitives,
  signalOps,
  type ComponentId,
  type ComponentInstance,
  type ComponentRegistry,
  type CompiledNetlist,
  type Diagnostic,
  type Logic,
  type NetlistInput,
  type PortRef,
  type SignalValue,
  type Simulator,
} from '../src/index.js';

export interface CircuitBuilder {
  add(kind: string, id: string, params?: Record<string, number | string | boolean>): ComponentId;
  wire(from: PortRef, to: PortRef): void;
  port(id: string, portName: string): PortRef;
  build(): BuiltCircuit;
}

export interface BuiltCircuit {
  sim: Simulator;
  registry: ComponentRegistry;
  netlist: CompiledNetlist;
  compileDiagnostics: readonly Diagnostic[];
}

export function newCircuit(): CircuitBuilder {
  const components: ComponentInstance[] = [];
  const connections: { a: PortRef; b: PortRef }[] = [];
  const knownIds = new Set<string>();

  const add: CircuitBuilder['add'] = (kind, id, params = {}) => {
    if (knownIds.has(id)) throw new Error(`Duplicate component id ${id}`);
    knownIds.add(id);
    const cid = asComponentId(id);
    components.push({ id: cid, kind, params, state: undefined as unknown });
    return cid;
  };

  const wire: CircuitBuilder['wire'] = (a, b) => {
    connections.push({ a, b });
  };

  const port: CircuitBuilder['port'] = (id, portName) => ({
    componentId: asComponentId(id),
    portName,
  });

  const build = (): BuiltCircuit => {
    const registry = createRegistry();
    registerPrimitives(registry);
    const input: NetlistInput = { components, connections };
    const { netlist, diagnostics } = compileNetlist(input, registry);
    const sim = createSimulator(registry);
    sim.load(netlist);
    return { sim, registry, netlist, compileDiagnostics: diagnostics };
  };

  return { add, wire, port, build };
}

/** Resolve a PortRef to its current net value via the netlist's portToNet map. */
export function portValue(circuit: BuiltCircuit, port: PortRef): SignalValue {
  const netId = circuit.netlist.portToNet.get(portKey(port.componentId, port.portName));
  if (!netId) throw new Error(`Port ${port.componentId}:${port.portName} is not bound to any net`);
  const snap = circuit.sim.snapshot();
  const v = snap.nets.get(netId);
  if (!v) throw new Error(`No value found for net ${netId}`);
  return v;
}

export type Classification = bigint | 'X' | 'Z' | 'MIXED';

export function classify(v: SignalValue): Classification {
  const definedBits = (1n << BigInt(v.width)) - 1n;
  const undef = v.unknown | v.hiZ;
  if (undef === 0n) return v.value;
  if (undef === definedBits) {
    if (v.unknown === definedBits) return 'X';
    if (v.hiZ === definedBits) return 'Z';
  }
  return 'MIXED';
}

/**
 * Build a circuit with named external inputs and probe outputs.
 * The harness wires Input pins and Output probes for you; `wireUp` glues
 * primitives between them.
 */
export interface Harness {
  sim: Simulator;
  circuit: BuiltCircuit;
  setBits(inputName: string, value: number | bigint): void;
  setLogic(inputName: string, bits: Logic[]): void;
  observe(probeName: string): Classification;
  observeRaw(probeName: string): SignalValue;
  tickClock(): void;
  diagnostics(): readonly Diagnostic[];
}

export function buildHarness(
  inputs: Record<string, number>,
  probes: Record<string, number>,
  wireUp: (b: CircuitBuilder, refs: HarnessRefs) => void,
): Harness {
  const b = newCircuit();
  const refs: HarnessRefs = { in: {}, probe: {} };

  for (const [name, width] of Object.entries(inputs)) {
    const id = b.add('input', `_in_${name}`, { width });
    refs.in[name] = { componentId: id, portName: 'out' };
  }
  for (const [name, width] of Object.entries(probes)) {
    const id = b.add('output', `_probe_${name}`, { width });
    refs.probe[name] = { componentId: id, portName: 'in' };
  }

  wireUp(b, refs);

  const circuit = b.build();
  circuit.sim.settle();

  return {
    sim: circuit.sim,
    circuit,
    setBits(name, raw) {
      const ref = refs.in[name];
      if (!ref) throw new Error(`Unknown input ${name}`);
      const width = inputs[name]!;
      const v = lit(width, typeof raw === 'bigint' ? raw : BigInt(raw));
      circuit.sim.setInput(ref, v);
      circuit.sim.settle();
    },
    setLogic(name, bits) {
      const ref = refs.in[name];
      if (!ref) throw new Error(`Unknown input ${name}`);
      const v = signalOps.fromLogic(bits);
      circuit.sim.setInput(ref, v);
      circuit.sim.settle();
    },
    observe(name) {
      const ref = refs.probe[name];
      if (!ref) throw new Error(`Unknown probe ${name}`);
      return classify(portValue(circuit, ref));
    },
    observeRaw(name) {
      const ref = refs.probe[name];
      if (!ref) throw new Error(`Unknown probe ${name}`);
      return portValue(circuit, ref);
    },
    tickClock() {
      circuit.sim.tickClock();
    },
    diagnostics: () => circuit.sim.diagnostics(),
  };
}

export interface HarnessRefs {
  in: Record<string, PortRef>;
  probe: Record<string, PortRef>;
}
