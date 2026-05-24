import { isHigh } from '../signal.js';
import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Synchronous up-counter with enable + synchronous reset and carry-out.
 *
 * Ports: en (1), rst (1) → q (width), co (1, high when q is at its max)
 * State: count (bigint)
 *
 * Clock edge:
 *   rst high → q := 0
 *   en high  → q := q + 1 mod 2^width
 *   else     → hold
 *
 * Combinational eval reflects state.count on q and sets co when q is at max.
 */
export interface CounterState {
  count: bigint;
}

export const counter: ComponentDefinition<CounterState> = {
  kind: 'counter',
  isSequential: true,
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 4);
    return [
      { name: 'en', direction: 'in', width: 1 },
      { name: 'rst', direction: 'in', width: 1 },
      { name: 'q', direction: 'out', width },
      { name: 'co', direction: 'out', width: 1 },
    ];
  },
  initialState(): CounterState {
    return { count: 0n };
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 4);
    const max = (1n << BigInt(width)) - 1n;
    ctx.write('q', ctx.ops.literal(width, ctx.state.count));
    ctx.write('co', ctx.ops.literal(1, ctx.state.count === max ? 1n : 0n));
  },
  clockEdge(ctx) {
    const width = Number(ctx.params['width'] ?? 4);
    const mask = (1n << BigInt(width)) - 1n;
    const rst = ctx.read('rst');
    const en = ctx.read('en');
    if (rst.unknown !== 0n || rst.hiZ !== 0n || en.unknown !== 0n || en.hiZ !== 0n) {
      // Undefined control inputs poison the count.
      ctx.state = { count: 0n };
      return;
    }
    if (isHigh(rst)) {
      ctx.state = { count: 0n };
    } else if (isHigh(en)) {
      ctx.state = { count: (ctx.state.count + 1n) & mask };
    }
  },
};
