import { bitXor } from '../signal.js';
import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Odd-parity gate — XOR of every input, bit-by-bit. The output is 1 when an
 * odd number of inputs are 1. Operates per-bit on N-bit busses, matching
 * Logisim's behaviour (each bit position is XOR'd across all inputs).
 */
export const oddParity: ComponentDefinition = {
  kind: 'odd-parity',
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
      acc = bitXor(acc, ctx.read(`in${i}`));
    }
    ctx.write('out', acc);
  },
};
