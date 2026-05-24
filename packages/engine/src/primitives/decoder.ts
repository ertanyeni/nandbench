import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * N-to-2^N one-hot decoder.
 *   sel  : selector, N bits (params.inputs, default 2 → 4 outputs)
 *   outI : 1-bit one-hot; only the output indexed by sel is high.
 *
 * If `sel` has any X/Z bit, all outputs go X.
 */
export const decoder: ComponentDefinition = {
  kind: 'decoder',
  ports(params): readonly PortSpec[] {
    const inputs = Number(params['inputs'] ?? 2);
    const outputs = 1 << inputs;
    const ports: PortSpec[] = [{ name: 'sel', direction: 'in', width: inputs }];
    for (let i = 0; i < outputs; i++) {
      ports.push({ name: `out${i}`, direction: 'out', width: 1 });
    }
    return ports;
  },
  evaluate(ctx) {
    const inputs = Number(ctx.params['inputs'] ?? 2);
    const outputs = 1 << inputs;
    const sel = ctx.read('sel');
    if (sel.unknown !== 0n || sel.hiZ !== 0n) {
      for (let i = 0; i < outputs; i++) ctx.write(`out${i}`, ctx.ops.allX(1));
      return;
    }
    const idx = Number(sel.value);
    for (let i = 0; i < outputs; i++) {
      const v: SignalValue = ctx.ops.literal(1, i === idx ? 1n : 0n);
      ctx.write(`out${i}`, v);
    }
  },
};
