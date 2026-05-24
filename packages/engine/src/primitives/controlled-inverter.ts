import { bitNot, isHigh } from '../signal.js';
import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Controlled inverter (tri-state) — when `en` is 1, `out := NOT(in)`;
 * otherwise `out := Z`. Mirror of [[controlledBuffer]] with negation on
 * the active output.
 */
export const controlledInverter: ComponentDefinition = {
  kind: 'controlled-inverter',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [
      { name: 'in', direction: 'in', width },
      { name: 'en', direction: 'in', width: 1 },
      { name: 'out', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const en = ctx.read('en');
    if (en.unknown !== 0n) {
      ctx.write('out', ctx.ops.allX(width));
      return;
    }
    if (isHigh(en)) {
      ctx.write('out', bitNot(ctx.read('in')));
    } else {
      ctx.write('out', ctx.ops.allZ(width));
    }
  },
};
