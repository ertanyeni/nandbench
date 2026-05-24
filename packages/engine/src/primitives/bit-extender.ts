import type { ComponentDefinition, PortSpec, SignalValue } from '../types.js';

/**
 * Bit Extender — widens an `inWidth`-bit input to an `outWidth`-bit output
 * by filling the extra high-order bits.
 *
 * Modes:
 *   - `zero` (default): pad with 0s
 *   - `one`           : pad with 1s
 *   - `sign`          : replicate the input's MSB (two's-complement extend)
 *
 * If `outWidth <= inWidth`, the input is truncated to the lower `outWidth`
 * bits — matching Logisim's behaviour.
 */
export const bitExtender: ComponentDefinition = {
  kind: 'bit-extender',
  ports(params): readonly PortSpec[] {
    const inWidth = Number(params['inWidth'] ?? 1);
    const outWidth = Number(params['outWidth'] ?? 8);
    return [
      { name: 'in', direction: 'in', width: inWidth },
      { name: 'out', direction: 'out', width: outWidth },
    ];
  },
  evaluate(ctx) {
    const inWidth = Number(ctx.params['inWidth'] ?? 1);
    const outWidth = Number(ctx.params['outWidth'] ?? 8);
    const mode = String(ctx.params['mode'] ?? 'zero');
    const inV = ctx.read('in');

    if (outWidth <= inWidth) {
      ctx.write('out', ctx.ops.slice(inV, 0, outWidth));
      return;
    }

    const extra = outWidth - inWidth;
    let pad: SignalValue;
    if (mode === 'sign') {
      // Replicate MSB. If MSB is X or Z, the pad bits inherit that state.
      const msbIdx = inWidth - 1;
      const msbMask = 1n << BigInt(msbIdx);
      const fullMask = (1n << BigInt(extra)) - 1n;
      const msbIsX = (inV.unknown & msbMask) !== 0n;
      const msbIsZ = (inV.hiZ & msbMask) !== 0n;
      const msbIsOne = (inV.value & msbMask) !== 0n;
      if (msbIsX) pad = ctx.ops.allX(extra);
      else if (msbIsZ) pad = ctx.ops.allZ(extra);
      else pad = ctx.ops.literal(extra, msbIsOne ? fullMask : 0n);
    } else if (mode === 'one') {
      const fullMask = (1n << BigInt(extra)) - 1n;
      pad = ctx.ops.literal(extra, fullMask);
    } else {
      pad = ctx.ops.literal(extra, 0n);
    }
    ctx.write('out', ctx.ops.concat([inV, pad]));
  },
};
