import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Output pin / probe — purely a sink with no logic.
 *
 * Its only role is to give a circuit an externally-meaningful port for the
 * renderer to display, and to provide a stable PortRef for tests to read
 * the value of a net via snapshot().
 *
 * Params: { width?: number = 1 }.
 */
export const outputPin: ComponentDefinition = {
  kind: 'output',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'in', direction: 'in', width }];
  },
  evaluate(_ctx) {
    // Probes have no outputs.
  },
};
