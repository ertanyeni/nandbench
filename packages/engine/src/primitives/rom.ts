import { isHigh } from '../signal.js';
import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Read-only memory — `2^addrBits` cells of `width` bits, populated from
 * the `data` param at construction time. The param is a whitespace-
 * separated list of hex values (one per cell, low → high address). Cells
 * not listed read as 0.
 *
 * Example: `data = "01 0a ff 00"` makes a 4-cell ROM with addr 0 = 0x01,
 * addr 1 = 0x0a, addr 2 = 0xff, addr 3 = 0x00.
 *
 * Combinational read with `oe` gate (1 → driven; 0 → tri-state).
 */
export const rom: ComponentDefinition = {
  kind: 'rom',
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    const addrBits = Number(params['addrBits'] ?? 4);
    return [
      { name: 'addr', direction: 'in', width: addrBits },
      { name: 'oe', direction: 'in', width: 1 },
      { name: 'out', direction: 'out', width },
    ];
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
    const addrBits = Number(ctx.params['addrBits'] ?? 4);
    const oe = ctx.read('oe');
    if (oe.unknown !== 0n || oe.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(width));
      return;
    }
    if (!isHigh(oe)) {
      ctx.write('out', ctx.ops.allZ(width));
      return;
    }
    const addr = ctx.read('addr');
    if (addr.unknown !== 0n || addr.hiZ !== 0n) {
      ctx.write('out', ctx.ops.allX(width));
      return;
    }
    const idx = Number(addr.value);
    const cells = parseRomData(String(ctx.params['data'] ?? ''));
    const max = 1 << Math.min(30, addrBits); // guard against extreme addrBits
    const cell = idx >= 0 && idx < max ? (cells[idx] ?? 0n) : 0n;
    ctx.write('out', ctx.ops.literal(width, cell));
  },
};

function parseRomData(raw: string): readonly bigint[] {
  if (!raw.trim()) return [];
  return raw
    .trim()
    .split(/\s+/)
    .map((tok) => {
      try {
        return BigInt(tok.startsWith('0x') || tok.startsWith('0X') ? tok : `0x${tok}`);
      } catch {
        return 0n;
      }
    });
}
