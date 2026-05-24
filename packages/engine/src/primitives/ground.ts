import type { ComponentDefinition, PortSpec } from '../types.js';

/** Ground source — drives `out` to all-zeros. Dual of [[power]]. */
export const ground: ComponentDefinition = {
  kind: 'ground',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'out', direction: 'out', width }];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    ctx.write('out', ctx.ops.literal(width, 0n));
  },
};
