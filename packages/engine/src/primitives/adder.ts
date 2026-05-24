import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Binary adder with carry-in / carry-out, parametric width.
 *
 * ports: a (width), b (width), cin (1) → s (width), cout (1)
 * Any X or Z on a, b, cin propagates as all-X on s and cout — there's no
 * meaningful arithmetic with undefined bits.
 */
export const adder: ComponentDefinition = {
  kind: 'adder',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [
      { name: 'a', direction: 'in', width },
      { name: 'b', direction: 'in', width },
      { name: 'cin', direction: 'in', width: 1 },
      { name: 's', direction: 'out', width },
      { name: 'cout', direction: 'out', width: 1 },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const a = ctx.read('a');
    const b = ctx.read('b');
    const cin = ctx.read('cin');
    if (isUndefined(a) || isUndefined(b) || isUndefined(cin)) {
      ctx.write('s', ctx.ops.allX(width));
      ctx.write('cout', ctx.ops.allX(1));
      return;
    }
    const sum = a.value + b.value + (cin.value & 1n);
    const mask = (1n << BigInt(width)) - 1n;
    const s: SignalValue = ctx.ops.literal(width, sum & mask);
    const cout: SignalValue = ctx.ops.literal(1, (sum >> BigInt(width)) & 1n);
    ctx.write('s', s);
    ctx.write('cout', cout);
  },
};

function isUndefined(v: SignalValue): boolean {
  return v.unknown !== 0n || v.hiZ !== 0n;
}
