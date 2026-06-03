/**
 * Hand-authored 1-bit full adder — the same circuit the engine's tests build,
 * laid out visually so Faz 1 has something to render.
 *
 *   sum  = (a XOR b) XOR cin
 *   cout = (a AND b) OR (cin AND (a XOR b))
 *
 * Wires are authored as orthogonal paths through grid points. They may
 * visually overlap where one source fans out to multiple sinks — junction
 * dots will be drawn in Faz 2 once the editor exists.
 */

import { asComponentId, type ComponentId, type PortRef } from '@nandbench/engine';
import { asWireId, type CircuitDocument, type VisualComponent, type VisualWire } from '../model/document.js';

const port = (id: string, name: string): PortRef => ({
  componentId: asComponentId(id),
  portName: name,
});

const comp = (
  id: string,
  kind: string,
  position: { x: number; y: number },
  params: Record<string, number | string | boolean> = {},
): VisualComponent => ({
  id: asComponentId(id),
  kind,
  params,
  position,
  rotation: 0,
});

const wire = (
  id: string,
  from: PortRef,
  to: PortRef,
  path: readonly { x: number; y: number }[],
): VisualWire => ({
  id: asWireId(id),
  endpoints: [from, to],
  path,
});

const components: VisualComponent[] = [
  // Inputs (left column)
  comp('in_a', 'input', { x: 40, y: 80 }, { width: 1, name: 'a' }),
  comp('in_b', 'input', { x: 40, y: 160 }, { width: 1, name: 'b' }),
  comp('in_cin', 'input', { x: 40, y: 380 }, { width: 1, name: 'cin' }),

  // Stage 1: XOR for sum, ANDs for cout
  comp('x1', 'xor', { x: 220, y: 80 }, { width: 1, inputs: 2 }),
  comp('a1', 'and', { x: 220, y: 240 }, { width: 1, inputs: 2 }),
  comp('a2', 'and', { x: 220, y: 380 }, { width: 1, inputs: 2 }),

  // Stage 2: XOR completes sum, OR completes cout
  comp('x2', 'xor', { x: 480, y: 80 }, { width: 1, inputs: 2 }),
  comp('o1', 'or', { x: 480, y: 320 }, { width: 1, inputs: 2 }),

  // Outputs (right column)
  comp('out_sum', 'output', { x: 680, y: 105 }, { width: 1, name: 'sum' }),
  comp('out_cout', 'output', { x: 680, y: 345 }, { width: 1, name: 'cout' }),
];

const wires: VisualWire[] = [
  // in_a fan-out: x1.in0, a1.in0
  wire(
    'w_a_x1',
    port('in_a', 'out'),
    port('x1', 'in0'),
    [
      { x: 100, y: 95 },
      { x: 160, y: 95 },
      { x: 160, y: 100 },
      { x: 220, y: 100 },
    ],
  ),
  wire(
    'w_a_a1',
    port('in_a', 'out'),
    port('a1', 'in0'),
    [
      { x: 100, y: 95 },
      { x: 160, y: 95 },
      { x: 160, y: 260 },
      { x: 220, y: 260 },
    ],
  ),

  // in_b fan-out: x1.in1, a1.in1
  wire(
    'w_b_x1',
    port('in_b', 'out'),
    port('x1', 'in1'),
    [
      { x: 100, y: 175 },
      { x: 180, y: 175 },
      { x: 180, y: 140 },
      { x: 220, y: 140 },
    ],
  ),
  wire(
    'w_b_a1',
    port('in_b', 'out'),
    port('a1', 'in1'),
    [
      { x: 100, y: 175 },
      { x: 180, y: 175 },
      { x: 180, y: 300 },
      { x: 220, y: 300 },
    ],
  ),

  // in_cin fan-out: x2.in1, a2.in0
  wire(
    'w_cin_a2',
    port('in_cin', 'out'),
    port('a2', 'in0'),
    [
      { x: 100, y: 395 },
      { x: 160, y: 395 },
      { x: 160, y: 400 },
      { x: 220, y: 400 },
    ],
  ),
  wire(
    'w_cin_x2',
    port('in_cin', 'out'),
    port('x2', 'in1'),
    [
      { x: 100, y: 395 },
      { x: 140, y: 395 },
      { x: 140, y: 140 },
      { x: 480, y: 140 },
    ],
  ),

  // x1.out fan-out: x2.in0, a2.in1
  wire(
    'w_x1_x2',
    port('x1', 'out'),
    port('x2', 'in0'),
    [
      { x: 320, y: 120 },
      { x: 400, y: 120 },
      { x: 400, y: 100 },
      { x: 480, y: 100 },
    ],
  ),
  wire(
    'w_x1_a2',
    port('x1', 'out'),
    port('a2', 'in1'),
    [
      { x: 320, y: 120 },
      { x: 360, y: 120 },
      { x: 360, y: 440 },
      { x: 220, y: 440 },
    ],
  ),

  // a1.out → o1.in0
  wire(
    'w_a1_o1',
    port('a1', 'out'),
    port('o1', 'in0'),
    [
      { x: 320, y: 280 },
      { x: 440, y: 280 },
      { x: 440, y: 340 },
      { x: 480, y: 340 },
    ],
  ),

  // a2.out → o1.in1
  wire(
    'w_a2_o1',
    port('a2', 'out'),
    port('o1', 'in1'),
    [
      { x: 320, y: 420 },
      { x: 420, y: 420 },
      { x: 420, y: 380 },
      { x: 480, y: 380 },
    ],
  ),

  // x2.out → out_sum.in
  wire(
    'w_x2_sum',
    port('x2', 'out'),
    port('out_sum', 'in'),
    [
      { x: 580, y: 120 },
      { x: 680, y: 120 },
    ],
  ),

  // o1.out → out_cout.in
  wire(
    'w_o1_cout',
    port('o1', 'out'),
    port('out_cout', 'in'),
    [
      { x: 580, y: 360 },
      { x: 680, y: 360 },
    ],
  ),
];

export const fullAdderDocument: CircuitDocument = { components, wires };

export const fullAdderComponentIds: readonly ComponentId[] = components.map((c) => c.id);
