import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Barrel shifter — shifts `in` by `shamt` positions in the configured
 * direction and mode.
 *
 * Params:
 *   - `width` (default 8): data bus width
 *   - `direction` ('left' | 'right', default 'left')
 *   - `arithmetic` (default false): for right-shift, replicate the sign
 *     bit instead of filling with zeros
 *
 * `shamt` is `ceil(log2(width))` bits wide; if `shamt` overflows the data
 * width, the result is zero (or all-1s for arithmetic right on negative
 * inputs), again matching Logisim.
 */
export const shifter: ComponentDefinition = {
  kind: 'shifter',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    const shamtBits = Math.max(1, Math.ceil(Math.log2(width + 1)));
    return [
      { name: 'in', direction: 'in', width },
      { name: 'shamt', direction: 'in', width: shamtBits },
      { name: 'out', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const dir = String(ctx.params['direction'] ?? 'left');
    const arith = Boolean(ctx.params['arithmetic'] ?? false);
    const v = ctx.read('in');
    const shamt = ctx.read('shamt');

    if (v.unknown !== 0n || v.hiZ !== 0n || shamt.unknown !== 0n || shamt.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(width));
      return;
    }

    const mask = (1n << BigInt(width)) - 1n;
    const s = Number(shamt.value);
    if (s >= width) {
      if (dir === 'right' && arith) {
        const signBit = 1n << BigInt(width - 1);
        const signSet = (v.value & signBit) !== 0n;
        ctx.write('out', ctx.ops.literal(width, signSet ? mask : 0n));
      } else {
        ctx.write('out', ctx.ops.literal(width, 0n));
      }
      return;
    }

    let result: bigint;
    if (dir === 'left') {
      result = (v.value << BigInt(s)) & mask;
    } else if (arith) {
      // Arithmetic right shift: replicate sign bit.
      const signBit = 1n << BigInt(width - 1);
      const signSet = (v.value & signBit) !== 0n;
      result = v.value >> BigInt(s);
      if (signSet) {
        const fillBits = ((1n << BigInt(s)) - 1n) << BigInt(width - s);
        result |= fillBits;
      }
      result &= mask;
    } else {
      result = (v.value >> BigInt(s)) & mask;
    }
    ctx.write('out', ctx.ops.literal(width, result));
  },
};
