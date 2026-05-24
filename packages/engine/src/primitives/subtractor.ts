import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Binary subtractor — computes (a - b - bin) using two's-complement.
 *
 * ports: a (width), b (width), bin (1, borrow-in) → d (width), bout (1, borrow-out)
 * bout = 1 when the subtraction underflowed (a < b + bin).
 */
export const subtractor: ComponentDefinition = {
  kind: 'subtractor',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [
      { name: 'a', direction: 'in', width },
      { name: 'b', direction: 'in', width },
      { name: 'bin', direction: 'in', width: 1 },
      { name: 'd', direction: 'out', width },
      { name: 'bout', direction: 'out', width: 1 },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const a = ctx.read('a');
    const b = ctx.read('b');
    const bin = ctx.read('bin');
    if (isUndefined(a) || isUndefined(b) || isUndefined(bin)) {
      ctx.write('d', ctx.ops.allX(width));
      ctx.write('bout', ctx.ops.allX(1));
      return;
    }
    const mask = (1n << BigInt(width)) - 1n;
    const total = (a.value - b.value - (bin.value & 1n)) & ((1n << BigInt(width + 1)) - 1n);
    // bout is the high bit of (a - b - bin) wrapped to (width + 1) bits — set when underflow occurred.
    const d: SignalValue = ctx.ops.literal(width, total & mask);
    const underflow = a.value < b.value + (bin.value & 1n) ? 1n : 0n;
    ctx.write('d', d);
    ctx.write('bout', ctx.ops.literal(1, underflow));
  },
};

function isUndefined(v: SignalValue): boolean {
  return v.unknown !== 0n || v.hiZ !== 0n;
}
