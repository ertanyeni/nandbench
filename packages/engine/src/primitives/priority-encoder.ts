import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Priority encoder — takes 2^select 1-bit data inputs and emits the
 * `select`-bit index of the highest-indexed input that is 1. A `valid`
 * output is 1 whenever any input is 1 (i.e. the result is meaningful).
 *
 * If any input bit is X, the encoder cannot determine the highest set bit
 * deterministically — we emit X on `out` and X on `valid`.
 *
 * Params:
 *   - `select` (default 2): number of address bits → 2^select data inputs
 */
export const priorityEncoder: ComponentDefinition = {
  kind: 'priority-encoder',
  ports(params): readonly PortSpec[] {
    const select = Number(params['select'] ?? 2);
    const fanout = 1 << select;
    const ports: PortSpec[] = [];
    for (let i = 0; i < fanout; i++) {
      ports.push({ name: `in${i}`, direction: 'in', width: 1 });
    }
    ports.push({ name: 'out', direction: 'out', width: select });
    ports.push({ name: 'valid', direction: 'out', width: 1 });
    return ports;
  },
  evaluate(ctx) {
    const select = Number(ctx.params['select'] ?? 2);
    const fanout = 1 << select;

    // Find the highest defined-1 bit; bail out to X if we see an X.
    let highest = -1;
    let anyX = false;
    let anyOne = false;
    for (let i = fanout - 1; i >= 0; i--) {
      const v = ctx.read(`in${i}`);
      if (v.unknown !== 0n) {
        anyX = true;
        continue;
      }
      if ((v.value & 1n) === 1n) {
        anyOne = true;
        if (highest < 0) highest = i;
      }
    }

    // If we saw an X above the current highest defined 1, we can't be sure
    // it isn't actually the winner. Conservative: emit X.
    if (anyX && (highest < 0 || aboveHasX(ctx, highest, fanout))) {
      ctx.write('out', ctx.ops.allX(select));
      ctx.write('valid', ctx.ops.allX(1));
      return;
    }

    ctx.write('out', ctx.ops.literal(select, highest < 0 ? 0n : BigInt(highest)));
    ctx.write('valid', ctx.ops.literal(1, anyOne ? 1n : 0n));
  },
};

function aboveHasX(
  ctx: Parameters<NonNullable<ComponentDefinition['evaluate']>>[0],
  highest: number,
  fanout: number,
): boolean {
  for (let i = highest + 1; i < fanout; i++) {
    const v = ctx.read(`in${i}`);
    if (v.unknown !== 0n) return true;
  }
  return false;
}
