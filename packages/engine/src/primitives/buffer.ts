import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Identity buffer — out := in. Width-N pass-through. Useful for fan-out
 * isolation and as a visible "this is intentional" marker. A separate
 * primitive (rather than a wire) so the engine treats it as a unit and
 * the renderer can show signal flow direction.
 */
export const bufferGate: ComponentDefinition = {
  kind: 'buffer',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [
      { name: 'in', direction: 'in', width },
      { name: 'out', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    ctx.write('out', ctx.read('in'));
  },
};
