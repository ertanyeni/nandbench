import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Bit Adder (popcount) — counts the number of 1-bits in the input bus and
 * emits the count as an N-bit output (N = ceil(log2(width+1))).
 *
 * X or Z bits make the entire output X (we cannot determine the count).
 */
export const bitAdder: ComponentDefinition = {
  kind: 'bit-adder',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    const outWidth = Math.max(1, Math.ceil(Math.log2(width + 1)));
    return [
      { name: 'in', direction: 'in', width },
      { name: 'out', direction: 'out', width: outWidth },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const outWidth = Math.max(1, Math.ceil(Math.log2(width + 1)));
    const v = ctx.read('in');
    if (v.unknown !== 0n || v.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(outWidth));
      return;
    }
    let count = 0n;
    let bits = v.value;
    while (bits > 0n) {
      count += bits & 1n;
      bits >>= 1n;
    }
    ctx.write('out', ctx.ops.literal(outWidth, count));
  },
};
