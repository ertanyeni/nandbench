import { bitNot } from '../signal.js';
import type { ComponentDefinition, PortSpec } from '../types.js';

export const notGate: ComponentDefinition = {
  kind: 'not',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [
      { name: 'in', direction: 'in', width },
      { name: 'out', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    ctx.write('out', bitNot(ctx.read('in')));
  },
};
