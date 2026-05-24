import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Named virtual wire — every tunnel with the same `label` (and width) acts
 * as if its single `port` were physically wired to every other tunnel of
 * the same label.
 *
 * The engine itself has no notion of labels; the net compiler in the app
 * layer pre-merges tunnel ports by label before handing the netlist over.
 * The engine-side definition just exists so a tunnel is a real component
 * with a port the user can wire to. evaluate() is a no-op.
 *
 * Params: { width: number = 1, label: string }
 */
export const tunnel: ComponentDefinition = {
  kind: 'tunnel',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'port', direction: 'inout', width }];
  },
  evaluate(_ctx) {
    // Pure label — drives nothing on its own.
  },
};
