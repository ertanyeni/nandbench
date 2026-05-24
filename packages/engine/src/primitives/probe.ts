import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Probe — a passive display that reads a single input and produces no
 * output. Functionally identical to [[outputPin]] but registered under
 * its own kind so the editor can render it differently (Logisim-style
 * value bubble vs. labelled output pad).
 */
export const probe: ComponentDefinition = {
  kind: 'probe',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'in', direction: 'in', width }];
  },
  evaluate(_ctx) {
    /* read-only display; no driven outputs */
  },
};
