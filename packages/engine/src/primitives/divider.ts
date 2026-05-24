import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * N-bit divider — out_q = a / b (truncated), out_r = a mod b. Both inputs
 * and outputs are width N. Division by zero produces X on both outputs
 * (undefined behaviour, mirrored from real hardware where divider state
 * machines stall or trap).
 */
export const divider: ComponentDefinition = {
  kind: 'divider',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    return [
      { name: 'a', direction: 'in', width },
      { name: 'b', direction: 'in', width },
      { name: 'q', direction: 'out', width },
      { name: 'r', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const a = ctx.read('a');
    const b = ctx.read('b');
    if (a.unknown !== 0n || b.unknown !== 0n || a.hiZ !== 0n || b.hiZ !== 0n) {
      ctx.write('q', ctx.ops.allX(width));
      ctx.write('r', ctx.ops.allX(width));
      return;
    }
    if (b.value === 0n) {
      ctx.write('q', ctx.ops.allX(width));
      ctx.write('r', ctx.ops.allX(width));
      return;
    }
    ctx.write('q', ctx.ops.literal(width, a.value / b.value));
    ctx.write('r', ctx.ops.literal(width, a.value % b.value));
  },
};
