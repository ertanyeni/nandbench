import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * N-bit multiplier — out = a * b, expressed as a 2N-bit result split into
 * `lo` (low N bits) and `hi` (high N bits). Any X bit on an input forces
 * the entire output to X (full pessimism).
 */
export const multiplier: ComponentDefinition = {
  kind: 'multiplier',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    return [
      { name: 'a', direction: 'in', width },
      { name: 'b', direction: 'in', width },
      { name: 'lo', direction: 'out', width },
      { name: 'hi', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const a = ctx.read('a');
    const b = ctx.read('b');
    if (a.unknown !== 0n || b.unknown !== 0n || a.hiZ !== 0n || b.hiZ !== 0n) {
      ctx.write('lo', ctx.ops.allX(width));
      ctx.write('hi', ctx.ops.allX(width));
      return;
    }
    const product = a.value * b.value;
    const mask = (1n << BigInt(width)) - 1n;
    ctx.write('lo', ctx.ops.literal(width, product & mask));
    ctx.write('hi', ctx.ops.literal(width, (product >> BigInt(width)) & mask));
  },
};
