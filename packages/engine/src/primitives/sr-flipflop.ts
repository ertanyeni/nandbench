import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * SR Flip-Flop — set/reset latch with edge-triggered clock semantics.
 *   S=0, R=0 → hold
 *   S=0, R=1 → reset (q=0)
 *   S=1, R=0 → set   (q=1)
 *   S=1, R=1 → invalid combination — q stays put and we record an
 *               X-sentinel on the outputs the next evaluate cycle.
 *
 * The invalid case is what students burn hours on, so we surface it as a
 * "poisoned" state and turn q into X until the next valid edge.
 */
export interface SrFlipFlopState {
  q: 0 | 1;
  /** True if the last edge saw S=R=1 — outputs come out as X. */
  poisoned: boolean;
}

export const srFlipFlop: ComponentDefinition<SrFlipFlopState> = {
  kind: 'sr-flipflop',
  isSequential: true,
  ports(): readonly PortSpec[] {
    return [
      { name: 's', direction: 'in', width: 1 },
      { name: 'r', direction: 'in', width: 1 },
      { name: 'q', direction: 'out', width: 1 },
      { name: 'qn', direction: 'out', width: 1 },
    ];
  },
  initialState(): SrFlipFlopState {
    return { q: 0, poisoned: false };
  },
  evaluate(ctx) {
    if (ctx.state.poisoned) {
      ctx.write('q', ctx.ops.allX(1));
      ctx.write('qn', ctx.ops.allX(1));
      return;
    }
    ctx.write('q', ctx.ops.literal(1, BigInt(ctx.state.q)));
    ctx.write('qn', ctx.ops.literal(1, ctx.state.q ? 0n : 1n));
  },
  clockEdge(ctx) {
    const s = ctx.read('s');
    const r = ctx.read('r');
    if (
      s.unknown !== 0n ||
      s.hiZ !== 0n ||
      r.unknown !== 0n ||
      r.hiZ !== 0n
    ) {
      return;
    }
    const sBit = (s.value & 1n) === 1n;
    const rBit = (r.value & 1n) === 1n;
    if (sBit && rBit) {
      ctx.state = { q: ctx.state.q, poisoned: true };
    } else if (sBit) {
      ctx.state = { q: 1, poisoned: false };
    } else if (rBit) {
      ctx.state = { q: 0, poisoned: false };
    } else if (ctx.state.poisoned) {
      // hold + clear poison once a clean edge arrives
      ctx.state = { q: ctx.state.q, poisoned: false };
    }
  },
};
