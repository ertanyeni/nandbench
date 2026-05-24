import { isHigh } from '../signal.js';
import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Serial-in / parallel-out shift register.
 *
 * Ports:
 *   d   (1)    — serial data in
 *   en  (1)    — shift enable
 *   q   (width) — parallel output (LSB = most-recently-shifted-in bit)
 *
 * Direction default is right (LSB-first); when params.direction === 'left'
 * the new bit enters at the MSB and existing bits shift toward the LSB.
 */
export interface ShiftRegisterState {
  data: bigint;
}

export const shiftRegister: ComponentDefinition<ShiftRegisterState> = {
  kind: 'shift-register',
  isSequential: true,
  ports(params): readonly PortSpec[] {
    const width = Number(params['width'] ?? 4);
    return [
      { name: 'd', direction: 'in', width: 1 },
      { name: 'en', direction: 'in', width: 1 },
      { name: 'q', direction: 'out', width },
    ];
  },
  initialState(): ShiftRegisterState {
    return { data: 0n };
  },
  evaluate(ctx) {
    const width = Number(ctx.params['width'] ?? 4);
    ctx.write('q', ctx.ops.literal(width, ctx.state.data));
  },
  clockEdge(ctx) {
    const width = Number(ctx.params['width'] ?? 4);
    const mask = (1n << BigInt(width)) - 1n;
    const en = ctx.read('en');
    if (en.unknown !== 0n || en.hiZ !== 0n || !isHigh(en)) return;
    const d = ctx.read('d');
    if (d.unknown !== 0n || d.hiZ !== 0n) {
      // X bit shifted in poisons the register.
      ctx.state = { data: ctx.state.data };
      return;
    }
    const direction = String(ctx.params['direction'] ?? 'right');
    const incoming = d.value & 1n;
    if (direction === 'left') {
      ctx.state = { data: ((ctx.state.data << 1n) | incoming) & mask };
    } else {
      ctx.state = { data: ((ctx.state.data >> 1n) | (incoming << BigInt(width - 1))) & mask };
    }
  },
};
