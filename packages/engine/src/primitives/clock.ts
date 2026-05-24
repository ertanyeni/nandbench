import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * 1-bit clock source — toggles on every Simulator.tickClock().
 *
 * Because the engine's tickClock fires every sequential component's
 * clockEdge(), a primitive that flips its state on each edge gives us a
 * free-running clock without needing wall-clock timers in the engine. The
 * worker (Faz 3) will call tickClock at whatever rate the user picks.
 */
export interface ClockState {
  high: boolean;
}

export const clockSource: ComponentDefinition<ClockState> = {
  kind: 'clock',
  isSequential: true,
  ports(): readonly PortSpec[] {
    return [{ name: 'out', direction: 'out', width: 1 }];
  },
  initialState(): ClockState {
    return { high: false };
  },
  evaluate(ctx) {
    const v: SignalValue = ctx.ops.literal(1, ctx.state.high ? 1n : 0n);
    ctx.write('out', v);
  },
  clockEdge(ctx) {
    ctx.state = { high: !ctx.state.high };
  },
};
