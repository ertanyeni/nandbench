/**
 * Headless challenge runner — compiles a document, drives every case
 * through a fresh simulator instance, returns pass/fail per case.
 *
 * No worker is involved: the runner is small enough to run inline on the
 * main thread (≤ ~10 cases × small circuits).
 */

import {
  createRegistry,
  createSimulator,
  lit,
  portKey,
  registerPrimitives,
  type ComponentRegistry,
  type PortRef,
} from '@gatecraft/engine';
import type { Challenge } from '../challenges.js';
import type { CircuitDocument, VisualComponent } from './document.js';
import type { SavedCircuit } from './library.js';
import { compileDocument } from './netlist-sync.js';

let cachedRegistry: ComponentRegistry | null = null;
function getRegistry(): ComponentRegistry {
  if (!cachedRegistry) {
    cachedRegistry = createRegistry();
    registerPrimitives(cachedRegistry);
  }
  return cachedRegistry;
}

export type ChallengeResult =
  | { kind: 'pass' }
  | {
      kind: 'fail';
      failures: readonly { caseIdx: number; expected: readonly number[]; got: readonly (number | string)[] }[];
    }
  | { kind: 'error'; message: string };

/**
 * Find a component by its `params.name`. We accept any kind for inputs
 * (input or button), and any kind for outputs (output or led).
 */
function findByName(
  doc: CircuitDocument,
  name: string,
  kinds: readonly string[],
): VisualComponent | undefined {
  return doc.components.find(
    (c) => kinds.includes(c.kind) && String(c.params['name'] ?? '') === name,
  );
}

export function runChallenge(
  doc: CircuitDocument,
  library: readonly SavedCircuit[],
  challenge: Challenge,
): ChallengeResult {
  try {
    // Resolve named pins.
    const inputPins: { ref: PortRef; width: number }[] = [];
    for (const name of challenge.inputs) {
      const c = findByName(doc, name, ['input', 'button']);
      if (!c) {
        return { kind: 'error', message: `Missing input pin named "${name}"` };
      }
      inputPins.push({
        ref: { componentId: c.id, portName: 'out' },
        width: Number(c.params['width'] ?? 1),
      });
    }
    const outputPins: { ref: PortRef }[] = [];
    for (const name of challenge.outputs) {
      const c = findByName(doc, name, ['output', 'led']);
      if (!c) {
        return { kind: 'error', message: `Missing output pin named "${name}"` };
      }
      outputPins.push({ ref: { componentId: c.id, portName: 'in' } });
    }

    const compiled = compileDocument(doc, library);
    const registry = getRegistry();
    const sim = createSimulator(registry);
    sim.load(compiled.netlist);

    const failures: { caseIdx: number; expected: number[]; got: (number | string)[] }[] = [];
    challenge.cases.forEach((c, caseIdx) => {
      // Drive every input.
      c.in.forEach((v, i) => {
        const pin = inputPins[i]!;
        sim.setInput(pin.ref, lit(pin.width, BigInt(v)));
      });
      // For sequential circuits (D / JK / T flip-flop, register, counter,
      // shift register, FSM) the case can request N clock-edge pulses
      // between setInput and the snapshot read. Default 0 keeps existing
      // combinational challenges fast.
      const ticks = c.ticks ?? 0;
      for (let i = 0; i < ticks; i++) {
        sim.tickClock();
      }
      sim.settle();
      const snap = sim.snapshot();
      const got: (number | string)[] = outputPins.map((op) => {
        const netId = compiled.netlist.portToNet.get(
          portKey(op.ref.componentId, op.ref.portName),
        );
        if (!netId) return '?';
        const value = snap.nets.get(netId);
        if (!value) return '?';
        if (value.unknown !== 0n) return 'X';
        if (value.hiZ !== 0n) return 'Z';
        return Number(value.value);
      });
      const matches = got.every((g, i) => g === c.out[i]);
      if (!matches) {
        failures.push({ caseIdx, expected: [...c.out], got });
      }
    });
    if (failures.length === 0) return { kind: 'pass' };
    return { kind: 'fail', failures };
  } catch (e) {
    return {
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
