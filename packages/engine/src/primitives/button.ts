import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Push-button — like an Input pin, but its visual encodes a momentary press.
 *
 * Behaviorally identical to input: drives a stored 1-bit value via state.
 * Default driven value is low (0), not Z, because a real button always has
 * a known pull-down. The UI (button is held / released) updates state via
 * Simulator.setInput on this component's `out` port.
 */
export interface ButtonState {
  driven: SignalValue;
}

export const button: ComponentDefinition<ButtonState> = {
  kind: 'button',
  ports(): readonly PortSpec[] {
    return [{ name: 'out', direction: 'out', width: 1 }];
  },
  initialState(): ButtonState {
    return { driven: { width: 1, value: 0n, unknown: 0n, hiZ: 0n } };
  },
  evaluate(ctx) {
    ctx.write('out', ctx.state.driven);
  },
};
