import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Square root — integer floor(sqrt(in)). Bit-width preserved; large inputs
 * fit because the floor sqrt of any N-bit number is at most an N-bit
 * number. Uses Newton's method on BigInts to avoid floating-point quirks
 * at high precision.
 */
export const squareRoot: ComponentDefinition = {
  kind: 'square-root',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    return [
      { name: 'in', direction: 'in', width },
      { name: 'out', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const v = ctx.read('in');
    if (v.unknown !== 0n || v.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(width));
      return;
    }
    ctx.write('out', ctx.ops.literal(width, bigintSqrt(v.value)));
  },
};

function bigintSqrt(n: bigint): bigint {
  if (n < 0n) return 0n;
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) >> 1n;
  while (y < x) {
    x = y;
    y = (x + n / x) >> 1n;
  }
  return x;
}
