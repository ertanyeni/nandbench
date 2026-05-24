import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Exponentiator — out = (a ** b) mod 2^width. Uses BigInt arithmetic so
 * arbitrarily large `width` is fine. Negative `b` is undefined (we set
 * the output to X — there is no integer reciprocal in mod arithmetic).
 */
export const exponentiator: ComponentDefinition = {
  kind: 'exponentiator',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    return [
      { name: 'a', direction: 'in', width },
      { name: 'b', direction: 'in', width },
      { name: 'out', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const a = ctx.read('a');
    const b = ctx.read('b');
    if (a.unknown !== 0n || b.unknown !== 0n || a.hiZ !== 0n || b.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(width));
      return;
    }
    const mask = (1n << BigInt(width)) - 1n;
    // Fast modular exponentiation to avoid building huge intermediates.
    let result = 1n;
    let base = a.value & mask;
    let exp = b.value;
    while (exp > 0n) {
      if (exp & 1n) result = (result * base) & mask;
      base = (base * base) & mask;
      exp >>= 1n;
    }
    ctx.write('out', ctx.ops.literal(width, result));
  },
};
