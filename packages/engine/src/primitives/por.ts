import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Power-On Reset (POR) — a one-shot sequential source that emits a single
 * high pulse on `out` at start-up, then settles to 0. Useful for kicking
 * a register/counter once when the simulation begins.
 *
 * State machine:
 *   active=true   → out=1
 *   clockEdge     → active=false
 *   active=false  → out=0 (forever, until the user resets the sim)
 */
export interface PorState {
  active: boolean;
}

export const por: ComponentDefinition<PorState> = {
  kind: 'por',
  isSequential: true,
  ports(): readonly PortSpec[] {
    return [{ name: 'out', direction: 'out', width: 1 }];
  },
  initialState(): PorState {
    return { active: true };
  },
  evaluate(ctx) {
    ctx.write('out', ctx.ops.literal(1, ctx.state.active ? 1n : 0n));
  },
  clockEdge(ctx) {
    if (ctx.state.active) {
      ctx.state = { active: false };
    }
  },
};
