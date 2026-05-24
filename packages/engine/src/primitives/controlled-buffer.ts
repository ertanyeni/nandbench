import { isHigh } from '../signal.js';
import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Controlled buffer (tri-state) — when `en` is 1, `out := in`; otherwise
 * `out := Z`. The classic building block for tri-state busses.
 *
 * When `en` is X (unknown), the output is X on every bit — we can't tell
 * whether the buffer is on.
 */
export const controlledBuffer: ComponentDefinition = {
  kind: 'controlled-buffer',
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
      ctx.write('out', ctx.read('in'));
    } else {
      ctx.write('out', ctx.ops.allZ(width));
    }
  },
};
