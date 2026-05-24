import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Constant source — drives a fixed literal on `out` forever.
 *
 * Params:
 *   width — bit width of the output bus (default 1).
 *   value — decimal or 0x-prefixed hex string; out-of-range bits are masked.
 *           A string (not bigint) because ParamValue only allows JSON-safe
 *           scalars. Parsed once on each evaluate (cheap).
 */
export const constantSource: ComponentDefinition = {
  kind: 'constant',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 1);
    return [{ name: 'out', direction: 'out', width }];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 1);
    const raw = String(ctx.params['value'] ?? '0');
    const value = raw.startsWith('0x') || raw.startsWith('0X')
      ? BigInt(raw)
      : BigInt(raw);
    ctx.write('out', ctx.ops.literal(width, value));
  },
};
