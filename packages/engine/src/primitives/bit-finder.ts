import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Bit Finder — locates the lowest or highest set bit in the input. Outputs
 * the position as a log2(width)-bit index plus a `found` flag (0 when the
 * input is all zeros).
 *
 * Params:
 *   - `width` (default 8): data bus width
 *   - `direction` ('lowest' | 'highest', default 'lowest')
 */
export const bitFinder: ComponentDefinition = {
  kind: 'bit-finder',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    const idxWidth = Math.max(1, Math.ceil(Math.log2(width)));
    return [
      { name: 'in', direction: 'in', width },
      { name: 'idx', direction: 'out', width: idxWidth },
      { name: 'found', direction: 'out', width: 1 },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const idxWidth = Math.max(1, Math.ceil(Math.log2(width)));
    const dir = String(ctx.params['direction'] ?? 'lowest');
    const v = ctx.read('in');

    if (v.unknown !== 0n || v.hiZ !== 0n) {
      ctx.write('idx', ctx.ops.allX(idxWidth));
      ctx.write('found', ctx.ops.allX(1));
      return;
    }
    if (v.value === 0n) {
      ctx.write('idx', ctx.ops.literal(idxWidth, 0n));
      ctx.write('found', ctx.ops.literal(1, 0n));
      return;
    }
    let pos = -1;
    if (dir === 'highest') {
      for (let i = width - 1; i >= 0; i--) {
        if ((v.value >> BigInt(i)) & 1n) {
          pos = i;
          break;
        }
      }
    } else {
      for (let i = 0; i < width; i++) {
        if ((v.value >> BigInt(i)) & 1n) {
          pos = i;
          break;
        }
      }
    }
    ctx.write('idx', ctx.ops.literal(idxWidth, BigInt(pos < 0 ? 0 : pos)));
    ctx.write('found', ctx.ops.literal(1, 1n));
  },
};
