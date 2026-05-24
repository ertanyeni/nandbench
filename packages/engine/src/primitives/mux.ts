import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * N-to-1 multiplexer.
 *   - data inputs:  in0, in1, ... in{N-1}   each of `width` bits
 *   - selector:     sel                       ceil(log2(N)) bits
 *   - output:       out                       `width` bits
 *
 * If `sel` has any X or Z bit, the output is all-X.
 *
 * Params: { width?: number = 1, inputs?: number = 2 }.
 */
function selectWidth(inputs: number): number {
  if (inputs <= 1) return 1;
  return Math.max(1, Math.ceil(Math.log2(inputs)));
}

export const muxGate: ComponentDefinition = {
  kind: 'mux',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    const inputs = Number(params['inputs'] ?? 2);
    const sw = selectWidth(inputs);
    const ports: PortSpec[] = [];
    for (let i = 0; i < inputs; i++) {
      ports.push({ name: `in${i}`, direction: 'in', width });
    }
    ports.push({ name: 'sel', direction: 'in', width: sw });
    ports.push({ name: 'out', direction: 'out', width });
    return ports;
  },
  evaluate(ctx) {
    const inputs = Number(ctx.params['inputs'] ?? 2);
    const width = Number(ctx.params['width'] ?? 1);
    const sel = ctx.read('sel');
    // If any bit of sel is X or Z, the selection is undefined => output X.
    if (sel.unknown !== 0n || sel.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(width));
      return;
    }
    const idx = Number(sel.value);
    if (idx < 0 || idx >= inputs) {
      // Out-of-range selector (e.g. sel width > log2(inputs) and high bit set).
      ctx.write('out', ctx.ops.allX(width));
      return;
    }
    const chosen: SignalValue = ctx.read(`in${idx}`);
    ctx.write('out', chosen);
  },
};
