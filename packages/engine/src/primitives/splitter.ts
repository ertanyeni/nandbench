import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Bus splitter — slice a wide input into N equal-width sub-buses.
 *
 * Params:
 *   width  — bit width of `in` (default 8)
 *   fanout — number of sub-bus outputs (default = width; one wire per bit)
 *
 * Output i carries bits [i*chunk, (i+1)*chunk) of `in`, where
 *   chunk = width / fanout (must divide cleanly).
 *
 * v1 is unidirectional (input → outputs). Logisim's bidirectional splitter
 * is on the roadmap once `inout` plumbing is fully tested.
 */
export const splitter: ComponentDefinition = {
  kind: 'splitter',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    const fanout = Number(params['fanout'] ?? width);
    const chunk = Math.max(1, Math.floor(width / fanout));
    const ports: PortSpec[] = [{ name: 'in', direction: 'in', width }];
    for (let i = 0; i < fanout; i++) {
      ports.push({ name: `out${i}`, direction: 'out', width: chunk });
    }
    return ports;
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const fanout = Number(ctx.params['fanout'] ?? width);
    const chunk = Math.max(1, Math.floor(width / fanout));
    const v = ctx.read('in');
    for (let i = 0; i < fanout; i++) {
      const lo = i * chunk;
      const hi = lo + chunk;
      const slice: SignalValue = ctx.ops.slice(v, lo, Math.min(hi, v.width));
      ctx.write(`out${i}`, slice);
    }
  },
};
