import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * LED — purely a sink. Behaviorally identical to the output pin; exists as
 * its own kind so the renderer can draw a glowing lamp instead of an OUT pad.
 *
 * Params: { color?: string }  — informational only; engine ignores it.
 */
export const led: ComponentDefinition = {
  kind: 'led',
  ports(): readonly PortSpec[] {
    return [{ name: 'in', direction: 'in', width: 1 }];
  },
  evaluate(_ctx) {
    // No-op; the renderer reads the net value for color/glow.
  },
};
