import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Combined min/max — emits both `min(a, b)` and `max(a, b)` on separate
 * outputs. `signed=true` interprets inputs as two's-complement.
 */
export const minMax: ComponentDefinition = {
  kind: 'min-max',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    return [
      { name: 'a', direction: 'in', width },
      { name: 'b', direction: 'in', width },
      { name: 'min', direction: 'out', width },
      { name: 'max', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const signed = Boolean(ctx.params['signed'] ?? false);
    const a = ctx.read('a');
    const b = ctx.read('b');
    if (a.unknown !== 0n || b.unknown !== 0n || a.hiZ !== 0n || b.hiZ !== 0n) {
      ctx.write('min', ctx.ops.allX(width));
      ctx.write('max', ctx.ops.allX(width));
      return;
    }
    const av = signed ? toSigned(a.value, width) : a.value;
    const bv = signed ? toSigned(b.value, width) : b.value;
    const minV = av < bv ? a.value : b.value;
    const maxV = av < bv ? b.value : a.value;
    ctx.write('min', ctx.ops.literal(width, minV));
    ctx.write('max', ctx.ops.literal(width, maxV));
  },
};

function toSigned(raw: bigint, width: number): bigint {
  const signBit = 1n << BigInt(width - 1);
  if ((raw & signBit) === 0n) return raw;
  return raw - (1n << BigInt(width));
}
