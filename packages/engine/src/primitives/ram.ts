import { isHigh } from '../signal.js';
import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Synchronous RAM — `2^addrBits` cells of `width` bits each.
 *
 * Ports:
 *   addr (addrBits)  — cell selector
 *   data (width)     — write data
 *   we   (1)         — write enable (sampled on clock edge)
 *   oe   (1)         — output enable (combinational; 0 → out = Z)
 *   out  (width)     — read data (or Z when oe = 0)
 *
 * State: a sparse `Map<bigint, bigint>` — only cells the user has touched
 * occupy memory. Untouched cells read as 0. We avoid `Uint8Array`-style
 * pre-allocation so a 16-bit address space (64K cells) doesn't pay rent
 * until the simulator actually writes to it.
 *
 * Write semantics mirror real synchronous SRAM: data + addr are sampled
 * on the rising clock edge when `we` is high. Reads are asynchronous
 * (combinational): change `addr`, see the new value next settle.
 */
export interface RamState {
  cells: Map<bigint, bigint>;
}

export const ram: ComponentDefinition<RamState> = {
  kind: 'ram',
  isSequential: true,
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 8);
    const addrBits = Number(params['addrBits'] ?? 4);
    return [
      { name: 'addr', direction: 'in', width: addrBits },
      { name: 'data', direction: 'in', width },
      { name: 'we', direction: 'in', width: 1 },
      { name: 'oe', direction: 'in', width: 1 },
      { name: 'out', direction: 'out', width },
    ];
  },
  initialState(): RamState {
    return { cells: new Map() };
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 8);
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
    const cell = ctx.state.cells.get(addr.value) ?? 0n;
    ctx.write('out', ctx.ops.literal(width, cell));
  },
  clockEdge(ctx) {
    const we = ctx.read('we');
    if (we.unknown !== 0n || we.hiZ !== 0n) return;
    if (!isHigh(we)) return;
    const addr = ctx.read('addr');
    const data = ctx.read('data');
    if (
      addr.unknown !== 0n ||
      addr.hiZ !== 0n ||
      data.unknown !== 0n ||
      data.hiZ !== 0n
    ) {
      // Undefined address or data poisons the cell — record an X-like
      // sentinel (here: leave the cell untouched and let the diagnostic
      // layer flag the upstream input).
      return;
    }
    const cells = new Map(ctx.state.cells);
    cells.set(addr.value, data.value);
    ctx.state = { cells };
  },
};
