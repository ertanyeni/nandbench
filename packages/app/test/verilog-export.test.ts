/**
 * Verilog export + testbench generator smoke tests.
 *
 * We don't assert on exact byte output (Verilog formatting is verbose
 * and would couple the test to cosmetic choices), but check the
 * structurally important pieces:
 *   - module header with the right name + port list
 *   - one `gc_*` instance per primitive component
 *   - testbench drives every challenge case as $display lines
 */

import { asComponentId } from '@gatecraft/engine';
import { describe, expect, it } from 'vitest';
import {
  asWireId,
  type CircuitDocument,
  type VisualComponent,
  type VisualWire,
} from '../src/model/document.js';
import { exportVerilog } from '../src/model/verilog-export.js';
import { exportTestbench } from '../src/model/verilog-testbench.js';

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

describe('exportVerilog', () => {
  const halfAdder: CircuitDocument = {
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

  it('emits module header with sanitized name + input/output ports', () => {
    const out = exportVerilog(halfAdder, [], 'half_adder');
    expect(out).toMatch(/module\s+half_adder\s*\(/);
    expect(out).toMatch(/input.*\bA\b/);
    expect(out).toMatch(/input.*\bB\b/);
    expect(out).toMatch(/output.*\bsum\b/);
    expect(out).toMatch(/output.*\bcout\b/);
    expect(out).toMatch(/endmodule/);
  });

  it('includes one gc_xor and one gc_and instance for the half-adder', () => {
    const out = exportVerilog(halfAdder, []);
    expect(out).toMatch(/gc_xor/);
    expect(out).toMatch(/gc_and/);
  });

  it('sanitizes module names with invalid Verilog characters', () => {
    const out = exportVerilog(halfAdder, [], 'My Bad Name!');
    expect(out).toMatch(/module\s+My_Bad_Name_/);
  });
});

describe('exportTestbench', () => {
  it('produces a testbench module that drives every case and counts fails', () => {
    const tb = exportTestbench(
      {
        inputs: ['A', 'B'],
        outputs: ['sum', 'cout'],
        cases: [
          { in: [0, 0], out: [0, 0] },
          { in: [1, 1], out: [0, 1] },
        ],
      },
      { dutModuleName: 'half_adder', lessonId: 'half-adder' },
    );
    expect(tb).toMatch(/module\s+tb_half_adder/);
    // One reg per input, one wire per output.
    expect(tb).toMatch(/reg A;/);
    expect(tb).toMatch(/reg B;/);
    expect(tb).toMatch(/wire sum;/);
    expect(tb).toMatch(/wire cout;/);
    // DUT instance.
    expect(tb).toMatch(/half_adder\s+dut/);
    // Each case appears as a comment + assignment.
    expect(tb).toMatch(/\/\/ case 1/);
    expect(tb).toMatch(/\/\/ case 2/);
    // Final PASS / FAIL display.
    expect(tb).toMatch(/PASS/);
    expect(tb).toMatch(/FAILED/);
  });

  it('sanitizes lesson id for the module name', () => {
    const tb = exportTestbench(
      { inputs: ['x'], outputs: ['y'], cases: [] },
      { dutModuleName: 'm', lessonId: 'foo bar/baz' },
    );
    expect(tb).toMatch(/module\s+tb_foo_bar_baz/);
  });
});
