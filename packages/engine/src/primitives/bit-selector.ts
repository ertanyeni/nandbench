import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Bit Selector — takes an N-bit `in`, a `select` address, and outputs a
 * single bit (or a `group`-bit slice) from `in`. Generalisation of a 1-bit
 * mux: with `group=1` you read bit[sel] of the bus.
 *
 * Params:
 *   - `width` (default 8): width of the input bus
 *   - `group` (default 1): width of the output slice; must divide `width`
 *
 * The select width is `log2(width / group)`. An X in the select address
 * produces an all-X output (we cannot tell which slice was chosen).
 */
export const bitSelector: ComponentDefinition = {
  kind: 'bit-selector',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    const group = Number(params['group'] ?? 1);
    const slices = Math.max(1, Math.floor(width / group));
    const selectBits = Math.max(1, Math.ceil(Math.log2(slices)));
    return [
      { name: 'in', direction: 'in', width },
      { name: 'sel', direction: 'in', width: selectBits },
      { name: 'out', direction: 'out', width: group },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const group = Number(ctx.params['group'] ?? 1);
    const slices = Math.max(1, Math.floor(width / group));
    const inV = ctx.read('in');
    const sel = ctx.read('sel');

    if (sel.unknown !== 0n || sel.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(group));
      return;
    }

    const idx = Number(sel.value);
    if (idx < 0 || idx >= slices) {
      ctx.write('out', ctx.ops.literal(group, 0n));
      return;
    }
    const lo = idx * group;
    const hi = lo + group;
    ctx.write('out', ctx.ops.slice(inV, lo, Math.min(hi, width)));
  },
};
