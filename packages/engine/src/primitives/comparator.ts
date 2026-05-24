import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Magnitude comparator — outputs lt / eq / gt one-hot signals.
 *
 * params: width (default 1), signed (default false — interpret as two's complement)
 */
export const comparator: ComponentDefinition = {
  kind: 'comparator',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [
      { name: 'a', direction: 'in', width },
      { name: 'b', direction: 'in', width },
      { name: 'lt', direction: 'out', width: 1 },
      { name: 'eq', direction: 'out', width: 1 },
      { name: 'gt', direction: 'out', width: 1 },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const signed = Boolean(ctx.params['signed'] ?? false);
    const a = ctx.read('a');
    const b = ctx.read('b');
    if (isUndefined(a) || isUndefined(b)) {
      ctx.write('lt', ctx.ops.allX(1));
      ctx.write('eq', ctx.ops.allX(1));
      ctx.write('gt', ctx.ops.allX(1));
      return;
    }
    let av = a.value;
    let bv = b.value;
    if (signed) {
      const signBit = 1n << BigInt(width - 1);
      const range = 1n << BigInt(width);
      if (av & signBit) av -= range;
      if (bv & signBit) bv -= range;
    }
    ctx.write('lt', ctx.ops.literal(1, av < bv ? 1n : 0n));
    ctx.write('eq', ctx.ops.literal(1, av === bv ? 1n : 0n));
    ctx.write('gt', ctx.ops.literal(1, av > bv ? 1n : 0n));
  },
};

function isUndefined(v: SignalValue): boolean {
  return v.unknown !== 0n || v.hiZ !== 0n;
}
