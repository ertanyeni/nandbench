import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Two's-complement negator — out := -in (mod 2^width). Equivalent to
 * `(~in) + 1` on N-bit values. X/Z inputs make the whole output X.
 */
export const negator: ComponentDefinition = {
  kind: 'negator',
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
    const mask = (1n << BigInt(width)) - 1n;
    const neg = (~v.value + 1n) & mask;
    ctx.write('out', ctx.ops.literal(width, neg));
  },
};
