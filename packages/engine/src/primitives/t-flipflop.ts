import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * T Flip-Flop — toggles `q` on every rising clock edge when `t` is high;
 * holds otherwise. Useful for clock dividers and frequency halvers.
 */
export interface TFlipFlopState {
  q: 0 | 1;
}

export const tFlipFlop: ComponentDefinition<TFlipFlopState> = {
  kind: 't-flipflop',
  isSequential: true,
  ports(): readonly PortSpec[] {
    return [
      { name: 't', direction: 'in', width: 1 },
      { name: 'q', direction: 'out', width: 1 },
      { name: 'qn', direction: 'out', width: 1 },
    ];
  },
  initialState(): TFlipFlopState {
    return { q: 0 };
  },
  evaluate(ctx) {
    ctx.write('q', ctx.ops.literal(1, BigInt(ctx.state.q)));
    ctx.write('qn', ctx.ops.literal(1, ctx.state.q ? 0n : 1n));
  },
  clockEdge(ctx) {
    const t = ctx.read('t');
    if (t.unknown !== 0n || t.hiZ !== 0n) return;
    if ((t.value & 1n) === 1n) {
      ctx.state = { q: ctx.state.q ? 0 : 1 };
    }
  },
};
