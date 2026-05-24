import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * JK Flip-Flop — the universal flip-flop. Each rising clock edge:
 *   J=0, K=0 → hold
 *   J=0, K=1 → reset (q=0)
 *   J=1, K=0 → set   (q=1)
 *   J=1, K=1 → toggle
 *
 * Undefined J/K cells the entire state to its previous value (defensive
 * hold — we do not poison q with X just because the clock edge fired on
 * an X input).
 */
export interface JkFlipFlopState {
  q: 0 | 1;
}

export const jkFlipFlop: ComponentDefinition<JkFlipFlopState> = {
  kind: 'jk-flipflop',
  isSequential: true,
  ports(): readonly PortSpec[] {
    return [
      { name: 'j', direction: 'in', width: 1 },
      { name: 'k', direction: 'in', width: 1 },
      { name: 'q', direction: 'out', width: 1 },
      { name: 'qn', direction: 'out', width: 1 },
    ];
  },
  initialState(): JkFlipFlopState {
    return { q: 0 };
  },
  evaluate(ctx) {
    ctx.write('q', ctx.ops.literal(1, BigInt(ctx.state.q)));
    ctx.write('qn', ctx.ops.literal(1, ctx.state.q ? 0n : 1n));
  },
  clockEdge(ctx) {
    const j = ctx.read('j');
    const k = ctx.read('k');
    if (
      j.unknown !== 0n ||
      j.hiZ !== 0n ||
      k.unknown !== 0n ||
      k.hiZ !== 0n
    ) {
      return;
    }
    const jBit = (j.value & 1n) === 1n;
    const kBit = (k.value & 1n) === 1n;
    if (jBit && kBit) {
      ctx.state = { q: ctx.state.q ? 0 : 1 };
    } else if (jBit) {
      ctx.state = { q: 1 };
    } else if (kBit) {
      ctx.state = { q: 0 };
    }
  },
};
