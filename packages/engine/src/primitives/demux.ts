import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

function selectWidth(outputs: number): number {
  if (outputs <= 1) return 1;
  return Math.max(1, Math.ceil(Math.log2(outputs)));
}

/**
 * 1-to-N demultiplexer.
 *   in   : data input,    width
 *   sel  : selector,      ceil(log2(outputs)) bits
 *   outN : N data outputs, width each
 *
 * The selected output gets `in`; non-selected outputs get all-Z (so they can
 * be tied to other drivers / left dangling without forcing 0). If `sel` has
 * any X/Z, all outputs become all-X.
 */
export const demux: ComponentDefinition = {
  kind: 'demux',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    const outputs = Number(params['outputs'] ?? 2);
    const sw = selectWidth(outputs);
    const ports: PortSpec[] = [
      { name: 'in', direction: 'in', width },
      { name: 'sel', direction: 'in', width: sw },
    ];
    for (let i = 0; i < outputs; i++) {
      ports.push({ name: `out${i}`, direction: 'out', width });
    }
    return ports;
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const outputs = Number(ctx.params['outputs'] ?? 2);
    const sel = ctx.read('sel');
    if (sel.unknown !== 0n || sel.hiZ !== 0n) {
      for (let i = 0; i < outputs; i++) ctx.write(`out${i}`, ctx.ops.allX(width));
      return;
    }
    const idx = Number(sel.value);
    const data = ctx.read('in');
    for (let i = 0; i < outputs; i++) {
      const v: SignalValue = i === idx ? data : ctx.ops.allZ(width);
      ctx.write(`out${i}`, v);
    }
  },
};
