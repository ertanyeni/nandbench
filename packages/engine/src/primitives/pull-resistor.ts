import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Pull resistor — biases a tri-state net toward a default value. The
 * engine doesn't model weak/strong drive strengths, so this primitive
 * behaves like a [[constantSource]]: it always drives `direction` onto
 * its output. If another driver fights it on the same net, the resolver
 * will flag a multi-driver diagnostic — which mirrors how real designs
 * use pull resistors only on lines that are otherwise tri-stated.
 *
 * Params:
 *   - `width` (default 1): bus width
 *   - `direction` ('pullUp' | 'pullDown', default 'pullUp')
 */
export const pullResistor: ComponentDefinition = {
  kind: 'pull-resistor',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'out', direction: 'out', width }];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const dir = String(ctx.params['direction'] ?? 'pullUp');
    const fill = dir === 'pullDown' ? 0n : (1n << BigInt(width)) - 1n;
    ctx.write('out', ctx.ops.literal(width, fill));
  },
};
