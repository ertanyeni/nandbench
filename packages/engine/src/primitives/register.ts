import { isHigh } from '../signal.js';
import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Edge-triggered register with optional enable.
 *
 * Ports: d (in, width)  -  en (in, 1)  -  q (out, width)
 * Clocking is provided by the simulator's tickClock(); the clock signal is
 * NOT a port — the simulator calls clockEdge() on every sequential component
 * on each tick. `en` low simply means "don't latch on this edge".
 *
 * Combinational output: q always reflects the currently latched state.
 * State mutation: on clock edge, if en is high, copy d into state.
 *
 * Params: { width?: number = 1 }.
 */
export interface RegisterState {
  stored: SignalValue;
}

export const registerComponent: ComponentDefinition<RegisterState> = {
  kind: 'register',
  isSequential: true,
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [
      { name: 'd', direction: 'in', width },
      { name: 'en', direction: 'in', width: 1 },
      { name: 'q', direction: 'out', width },
    ];
  },
  initialState(params): RegisterState {
    const width = Number(params['width'] ?? 1);
    // Power-on state is 0 (matches every real FPGA we care about).
    return { stored: { width, value: 0n, unknown: 0n, hiZ: 0n } };
  },
  evaluate(ctx) {
    ctx.write('q', ctx.state.stored);
  },
  clockEdge(ctx) {
    const en = ctx.read('en');
    // If en is X or Z, treat as "don't know whether to latch" => state becomes X.
    if (en.unknown !== 0n || en.hiZ !== 0n) {
      const w = ctx.state.stored.width;
      ctx.state = { stored: ctx.ops.allX(w) };
      return;
    }
    if (isHigh(en)) {
      ctx.state = { stored: ctx.read('d') };
    }
  },
};
