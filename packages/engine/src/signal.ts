/**
 * SignalOps — pure value algebra for the four-valued (0/1/X/Z) bit-vector type.
 *
 * All bit logic in the engine flows through this module. It is the most
 * heavily tested file in the codebase by design.
 *
 * Encoding invariant (per bit i):
 *   if (unknown >> i) & 1n  => X
 *   else if (hiZ >> i) & 1n => Z
 *   else                    => 0 or 1 from value
 * `unknown` and `hiZ` are mutually exclusive at every bit position.
 * `value` is only meaningful where neither `unknown` nor `hiZ` is set; we
 * still clear it elsewhere so equals() is a straight 3-bigint compare.
 */

import type { Logic, ResolveResult, SignalOps, SignalValue } from './types.js';

const ZERO = 0n;
const ONE = 1n;

/** Lowest `width` bits set to 1 — used as a mask for normalizing values. */
function widthMask(width: number): bigint {
  if (width <= 0) return ZERO;
  return (ONE << BigInt(width)) - ONE;
}

function makeSignal(
  width: number,
  rawValue: bigint,
  rawUnknown: bigint,
  rawHiZ: bigint,
): SignalValue {
  const mask = widthMask(width);
  // unknown wins over hiZ (X dominates Z at the same bit position).
  const unknown = rawUnknown & mask;
  const hiZ = (rawHiZ & mask) & ~unknown;
  // value only meaningful in defined bits; clear it elsewhere so equals() is exact.
  const defined = mask & ~unknown & ~hiZ;
  const value = rawValue & defined;
  return { width, value, unknown, hiZ };
}

class SignalOpsImpl implements SignalOps {
  fromLogic(bits: Logic[]): SignalValue {
    let value = ZERO;
    let unknown = ZERO;
    let hiZ = ZERO;
    for (let i = 0; i < bits.length; i++) {
      const b = bits[i];
      const m = ONE << BigInt(i);
      if (b === 1) value |= m;
      else if (b === 'x') unknown |= m;
      else if (b === 'z') hiZ |= m;
      // 0 contributes nothing
    }
    return makeSignal(bits.length, value, unknown, hiZ);
  }

  literal(width: number, value: bigint): SignalValue {
    return makeSignal(width, value, ZERO, ZERO);
  }

  allZ(width: number): SignalValue {
    return makeSignal(width, ZERO, ZERO, widthMask(width));
  }

  allX(width: number): SignalValue {
    return makeSignal(width, ZERO, widthMask(width), ZERO);
  }

  equals(a: SignalValue, b: SignalValue): boolean {
    return (
      a.width === b.width &&
      a.value === b.value &&
      a.unknown === b.unknown &&
      a.hiZ === b.hiZ
    );
  }

  /**
   * Slice bits [lo, hi) (lo inclusive, hi exclusive), with lo as the new LSB.
   * Width of result = hi - lo.
   */
  slice(v: SignalValue, lo: number, hi: number): SignalValue {
    if (lo < 0 || hi > v.width || hi < lo) {
      throw new RangeError(`slice [${lo}, ${hi}) out of range for width ${v.width}`);
    }
    const w = hi - lo;
    const shift = BigInt(lo);
    return makeSignal(w, v.value >> shift, v.unknown >> shift, v.hiZ >> shift);
  }

  /**
   * Concatenate; parts[0] is the LSB chunk, parts[N-1] is the MSB chunk.
   * Total width = sum of part widths.
   */
  concat(parts: SignalValue[]): SignalValue {
    let value = ZERO;
    let unknown = ZERO;
    let hiZ = ZERO;
    let offset = 0;
    for (const p of parts) {
      const shift = BigInt(offset);
      value |= p.value << shift;
      unknown |= p.unknown << shift;
      hiZ |= p.hiZ << shift;
      offset += p.width;
    }
    return makeSignal(offset, value, unknown, hiZ);
  }

  /**
   * Resolve N drivers sharing a single net.
   *
   * Rules per bit:
   *   - any driver drives X        => X
   *   - drivers driving 0 AND 1    => conflict, X (raises multi-driver diagnostic)
   *   - exactly one direction      => that value (0 or 1)
   *   - all drivers are Z          => Z
   *
   * The driver count of (Z) does not matter — Z means "not driving", so any
   * number of Z drivers is fine and the result is Z (when nobody else drives).
   */
  resolve(drivers: SignalValue[]): ResolveResult {
    if (drivers.length === 0) {
      // No drivers at all — caller should pick a default width; we return width 0.
      return { value: makeSignal(0, ZERO, ZERO, ZERO), conflictBits: ZERO };
    }
    const width = drivers[0]!.width;
    for (const d of drivers) {
      if (d.width !== width) {
        throw new Error(
          `resolve(): driver width mismatch (${d.width} vs ${width}). The net compiler must normalize widths before calling resolve().`,
        );
      }
    }
    if (drivers.length === 1) {
      return { value: drivers[0]!, conflictBits: ZERO };
    }
    const mask = widthMask(width);
    let any0 = ZERO;
    let any1 = ZERO;
    let anyX = ZERO;
    for (const d of drivers) {
      const notZ = mask & ~d.hiZ;        // bits this driver is actively driving
      const xBits = d.unknown & notZ;    // X bits driven by this driver
      const definedBits = notZ & ~xBits; // 0/1 bits driven
      const oneBits = definedBits & d.value;
      const zeroBits = definedBits & ~d.value;
      anyX |= xBits;
      any1 |= oneBits;
      any0 |= zeroBits;
    }
    const conflictBits = any0 & any1;
    const finalX = anyX | conflictBits;
    const finalOnes = any1 & ~finalX;
    const drivenSomewhere = any0 | any1 | anyX;
    const finalZ = mask & ~drivenSomewhere;
    return {
      value: makeSignal(width, finalOnes, finalX, finalZ),
      conflictBits,
    };
  }
}

export const signalOps: SignalOps = new SignalOpsImpl();

/* ------------------------------------------------------------------ */
/* Bit-level convenience helpers used by primitives                    */
/* ------------------------------------------------------------------ */

/** True iff bit i of v is a defined 1. */
export function bitIsOne(v: SignalValue, i: number): boolean {
  const m = ONE << BigInt(i);
  return (v.unknown & m) === ZERO && (v.hiZ & m) === ZERO && (v.value & m) !== ZERO;
}

/** True iff bit i of v is a defined 0. */
export function bitIsZero(v: SignalValue, i: number): boolean {
  const m = ONE << BigInt(i);
  return (v.unknown & m) === ZERO && (v.hiZ & m) === ZERO && (v.value & m) === ZERO;
}

/** True iff bit 0 of a 1-bit signal is a defined 1 (used for enable/clock-style pins). */
export function isHigh(v: SignalValue): boolean {
  return v.width >= 1 && bitIsOne(v, 0);
}

/**
 * Treat any X or Z bit as "unknown" for the purposes of a bitwise gate.
 * Returns the bitmask of bits where either operand is non-{0,1}.
 */
function undefinedMask(a: SignalValue, b: SignalValue): bigint {
  return a.unknown | a.hiZ | b.unknown | b.hiZ;
}

export function bitAnd(a: SignalValue, b: SignalValue): SignalValue {
  if (a.width !== b.width) {
    throw new Error(`bitAnd width mismatch: ${a.width} vs ${b.width}`);
  }
  const mask = widthMask(a.width);
  const undef = undefinedMask(a, b);
  // X-aware AND: if either operand is definitively 0, output is 0 (even if other is X/Z).
  const aIsZero = (mask & ~a.unknown & ~a.hiZ & ~a.value);
  const bIsZero = (mask & ~b.unknown & ~b.hiZ & ~b.value);
  const anyZero = aIsZero | bIsZero;
  const xBits = undef & ~anyZero;
  const value = a.value & b.value & ~xBits;
  return makeSignal(a.width, value, xBits, ZERO);
}

export function bitOr(a: SignalValue, b: SignalValue): SignalValue {
  if (a.width !== b.width) {
    throw new Error(`bitOr width mismatch: ${a.width} vs ${b.width}`);
  }
  const mask = widthMask(a.width);
  const undef = undefinedMask(a, b);
  // X-aware OR: if either operand is definitively 1, output is 1.
  const aIsOne = mask & ~a.unknown & ~a.hiZ & a.value;
  const bIsOne = mask & ~b.unknown & ~b.hiZ & b.value;
  const anyOne = aIsOne | bIsOne;
  const xBits = undef & ~anyOne;
  const value = (a.value | b.value | anyOne) & ~xBits;
  return makeSignal(a.width, value, xBits, ZERO);
}

export function bitXor(a: SignalValue, b: SignalValue): SignalValue {
  if (a.width !== b.width) {
    throw new Error(`bitXor width mismatch: ${a.width} vs ${b.width}`);
  }
  const undef = undefinedMask(a, b);
  // XOR has no dominant value — any undefined bit makes the output X.
  const value = (a.value ^ b.value) & ~undef;
  return makeSignal(a.width, value, undef, ZERO);
}

export function bitNot(a: SignalValue): SignalValue {
  const mask = widthMask(a.width);
  const undef = a.unknown | a.hiZ;
  const value = (~a.value) & mask & ~undef;
  return makeSignal(a.width, value, undef, ZERO);
}

/** Build a sized literal from a plain JS number/bigint (used in tests). */
export function lit(width: number, n: number | bigint): SignalValue {
  return signalOps.literal(width, typeof n === 'bigint' ? n : BigInt(n));
}
