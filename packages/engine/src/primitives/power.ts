import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Power source — drives `out` to all-ones (logical high) on every bit.
 * Conceptually a `Constant(width=1, value=0x1)` but rendered distinctly so
 * power rails are visible at a glance. N-bit widths are supported so it
 * doubles as a "tie all bits high" source.
 */
export const power: ComponentDefinition = {
  kind: 'power',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'out', direction: 'out', width }];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const mask = (1n << BigInt(width)) - 1n;
    ctx.write('out', ctx.ops.literal(width, mask));
  },
};
