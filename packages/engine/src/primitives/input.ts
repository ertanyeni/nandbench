import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Input pin — an externally-driven source.
 *
 * It owns no logic; its single `out` port is driven by whatever value the
 * simulator most recently received via setInput() on this pin.
 *
 * Default value is all-Z (undriven) so the floating-input diagnostic can
 * fire if the circuit forgets to bind it.
 *
 * Params: { width?: number = 1 }.
 */
export interface InputState {
  driven: SignalValue;
}

export const inputPin: ComponentDefinition<InputState> = {
  kind: 'input',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'out', direction: 'out', width }];
  },
  initialState(params): InputState {
    const width = Number(params['width'] ?? 1);
    return { driven: { width, value: 0n, unknown: 0n, hiZ: (1n << BigInt(width)) - 1n } };
  },
  evaluate(ctx) {
    ctx.write('out', ctx.state.driven);
  },
};
