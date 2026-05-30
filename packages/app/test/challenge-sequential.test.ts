/**
 * Sequential challenge runner — verifies the new `ticks` field on
 * ChallengeCase drives the clock between setInput and snapshot.
 *
 * Test fixture: a single JK flip-flop wired up with named input pins
 * (J, K) and named output pins (Q). Cases walk through hold / set /
 * reset / toggle by setting J + K and pulsing the clock once.
 */

import { asComponentId } from '@gatecraft/engine';
import { describe, expect, it } from 'vitest';
import {
  asWireId,
  type CircuitDocument,
  type VisualComponent,
  type VisualWire,
} from '../src/model/document.js';
import { runChallenge } from '../src/model/challenge-runner.js';
import type { Challenge } from '../src/challenges.js';

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
    path: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
  };
}

const jkDoc: CircuitDocument = {
  components: [
    comp('ij', 'input', { width: 1, name: 'J' }),
    comp('ik', 'input', { width: 1, name: 'K' }),
    comp('ff', 'jk-flipflop', {}),
    comp('oq', 'output', { width: 1, name: 'Q' }),
  ],
  wires: [
    wire('w1', ['ij', 'out'], ['ff', 'j']),
    wire('w2', ['ik', 'out'], ['ff', 'k']),
    wire('w3', ['ff', 'q'], ['oq', 'in']),
  ],
};

describe('challenge-runner with sequential ticks', () => {
  it('JK flip-flop set / reset / toggle drives correctly with ticks=1', () => {
    // Each case carries forward the FF state, so the order matters.
    // Initial Q = 0.
    const challenge: Challenge = {
      inputs: ['J', 'K'],
      outputs: ['Q'],
      cases: [
        { in: [0, 0], out: [0], ticks: 1 }, // hold → 0
        { in: [1, 0], out: [1], ticks: 1 }, // set → 1
        { in: [0, 0], out: [1], ticks: 1 }, // hold → 1
        { in: [0, 1], out: [0], ticks: 1 }, // reset → 0
        { in: [1, 1], out: [1], ticks: 1 }, // toggle from 0 → 1
        { in: [1, 1], out: [0], ticks: 1 }, // toggle from 1 → 0
      ],
    };
    const result = runChallenge(jkDoc, [], challenge);
    if (result.kind === 'fail') {
      // Surface the mismatch for easier debugging.
      console.error('JK failures:', result.failures);
    }
    expect(result.kind).toBe('pass');
  });

  it('combinational cases without ticks still work (back-compat)', () => {
    const halfAdder: CircuitDocument = {
      components: [
        comp('a', 'input', { width: 1, name: 'A' }),
        comp('b', 'input', { width: 1, name: 'B' }),
        comp('s', 'output', { width: 1, name: 'sum' }),
        comp('c', 'output', { width: 1, name: 'cout' }),
        comp('x', 'xor', { width: 1, inputs: 2 }),
        comp('n', 'and', { width: 1, inputs: 2 }),
      ],
      wires: [
        wire('w1', ['a', 'out'], ['x', 'in0']),
        wire('w2', ['b', 'out'], ['x', 'in1']),
        wire('w3', ['a', 'out'], ['n', 'in0']),
        wire('w4', ['b', 'out'], ['n', 'in1']),
        wire('w5', ['x', 'out'], ['s', 'in']),
        wire('w6', ['n', 'out'], ['c', 'in']),
      ],
    };
    const result = runChallenge(halfAdder, [], {
      inputs: ['A', 'B'],
      outputs: ['sum', 'cout'],
      cases: [
        { in: [0, 0], out: [0, 0] },
        { in: [1, 1], out: [0, 1] },
        // No ticks: combinational path settles immediately.
      ],
    });
    expect(result.kind).toBe('pass');
  });
});
