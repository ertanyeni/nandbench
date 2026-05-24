import { bitAnd } from '../signal.js';
import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * AND gate, bitwise across `width`-bit buses with N inputs.
 *
 * Params: { width?: number = 1, inputs?: number = 2 }
 */
export const andGate: ComponentDefinition = {
  kind: 'and',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    const inputs = Number(params['inputs'] ?? 2);
    const ports: PortSpec[] = [];
    for (let i = 0; i < inputs; i++) {
      ports.push({ name: `in${i}`, direction: 'in', width });
    }
    ports.push({ name: 'out', direction: 'out', width });
    return ports;
  },
  evaluate(ctx) {
    const inputs = Number(ctx.params['inputs'] ?? 2);
    let acc: SignalValue = ctx.read('in0');
    for (let i = 1; i < inputs; i++) {
      acc = bitAnd(acc, ctx.read(`in${i}`));
    }
    ctx.write('out', acc);
  },
};
