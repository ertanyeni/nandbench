import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Absolute value — interprets the input as a two's-complement signed
 * integer and emits |in|. If `in` is the most-negative value (-2^(N-1)),
 * the result overflows back to itself (standard ALU behaviour); we mirror
 * that here rather than escaping to a wider output.
 */
export const absolute: ComponentDefinition = {
  kind: 'absolute',
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
    const signBit = 1n << BigInt(width - 1);
    const isNegative = (v.value & signBit) !== 0n;
    const abs = isNegative ? ((~v.value + 1n) & mask) : v.value;
    ctx.write('out', ctx.ops.literal(width, abs));
  },
};
