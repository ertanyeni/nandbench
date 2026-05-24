import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * D Flip-Flop — captures `d` on every rising clock edge and presents it
 * (and its complement) on `q` / `qn`. Functionally identical to a 1-bit
 * [[registerComponent]], surfaced separately so circuit diagrams can use
 * the conventional FF symbol set.
 */
export interface DFlipFlopState {
  q: 0 | 1;
}

export const dFlipFlop: ComponentDefinition<DFlipFlopState> = {
  kind: 'd-flipflop',
  isSequential: true,
  ports(): readonly PortSpec[] {
    return [
      { name: 'd', direction: 'in', width: 1 },
      { name: 'q', direction: 'out', width: 1 },
      { name: 'qn', direction: 'out', width: 1 },
    ];
  },
  initialState(): DFlipFlopState {
    return { q: 0 };
  },
  evaluate(ctx) {
    ctx.write('q', ctx.ops.literal(1, BigInt(ctx.state.q)));
    ctx.write('qn', ctx.ops.literal(1, ctx.state.q ? 0n : 1n));
  },
  clockEdge(ctx) {
    const d = ctx.read('d');
    if (d.unknown !== 0n || d.hiZ !== 0n) return;
    ctx.state = { q: (d.value & 1n) === 1n ? 1 : 0 };
  },
};
