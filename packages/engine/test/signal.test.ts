import { describe, expect, it } from 'vitest';
import { bitAnd, bitNot, bitOr, bitXor, lit, signalOps } from '../src/signal.js';
import type { Logic, SignalValue } from '../src/types.js';

const ops = signalOps;

function logic(bits: Logic[]): SignalValue {
  return ops.fromLogic(bits);
}

describe('SignalOps — construction & equality', () => {
  it('round-trips fromLogic / equals', () => {
    const a = logic([1, 0, 'x', 'z', 1]);
    const b = logic([1, 0, 'x', 'z', 1]);
    expect(ops.equals(a, b)).toBe(true);
    expect(a.width).toBe(5);
  });

  it('clears value bits outside defined positions (canonical encoding)', () => {
    const v = logic(['x', 'z', 1, 0]);
    // value should only have the LSB position 2 set
    expect(v.value).toBe(0b0100n);
    expect(v.unknown).toBe(0b0001n);
    expect(v.hiZ).toBe(0b0010n);
  });

  it('literal masks to width', () => {
    const v = ops.literal(4, 0xffn);
    expect(v.value).toBe(0xfn);
    expect(v.width).toBe(4);
    expect(v.unknown).toBe(0n);
    expect(v.hiZ).toBe(0n);
  });

  it('allZ / allX have full masks', () => {
    expect(ops.allZ(3).hiZ).toBe(0b111n);
    expect(ops.allZ(3).unknown).toBe(0n);
    expect(ops.allX(3).unknown).toBe(0b111n);
    expect(ops.allX(3).hiZ).toBe(0n);
  });

  it('equals distinguishes 0 from Z from X', () => {
    expect(ops.equals(logic([0]), logic(['z']))).toBe(false);
    expect(ops.equals(logic([0]), logic(['x']))).toBe(false);
    expect(ops.equals(logic(['z']), logic(['x']))).toBe(false);
  });
});

describe('SignalOps — slice & concat', () => {
  it('slice extracts the requested range, lo as new LSB', () => {
    const v = ops.literal(8, 0b1011_0110n);
    const mid = ops.slice(v, 2, 6); // bits 2..5 => 0b1101 = 0xD
    expect(mid.width).toBe(4);
    expect(mid.value).toBe(0b1101n);
  });

  it('slice preserves X/Z markers', () => {
    const v = logic([1, 'x', 'z', 0, 1]);
    const s = ops.slice(v, 1, 4);
    expect(s.width).toBe(3);
    expect(ops.equals(s, logic(['x', 'z', 0]))).toBe(true);
  });

  it('concat: parts[0] is the LSB chunk', () => {
    const lo = ops.literal(4, 0xan); // 1010 (LSB)
    const hi = ops.literal(4, 0x3n); // 0011 (MSB)
    const c = ops.concat([lo, hi]);
    expect(c.width).toBe(8);
    expect(c.value).toBe(0x3an);
  });

  it('slice rejects out-of-range', () => {
    const v = ops.literal(4, 0xfn);
    expect(() => ops.slice(v, -1, 2)).toThrow();
    expect(() => ops.slice(v, 0, 5)).toThrow();
    expect(() => ops.slice(v, 3, 2)).toThrow();
  });
});

describe('SignalOps — resolve (multi-driver)', () => {
  it('single driver passes through', () => {
    const a = lit(4, 0b1010n);
    const r = ops.resolve([a]);
    expect(ops.equals(r.value, a)).toBe(true);
    expect(r.conflictBits).toBe(0n);
  });

  it('all Z drivers => all Z', () => {
    const r = ops.resolve([ops.allZ(4), ops.allZ(4)]);
    expect(ops.equals(r.value, ops.allZ(4))).toBe(true);
    expect(r.conflictBits).toBe(0n);
  });

  it('Z + value => value (tristate bus)', () => {
    const z = ops.allZ(4);
    const v = lit(4, 0b1010n);
    const r = ops.resolve([z, v]);
    expect(ops.equals(r.value, v)).toBe(true);
    expect(r.conflictBits).toBe(0n);
  });

  it('0 vs 1 conflict => X with conflict bit set', () => {
    const a = lit(1, 0n);
    const b = lit(1, 1n);
    const r = ops.resolve([a, b]);
    expect(r.conflictBits).toBe(1n);
    expect(ops.equals(r.value, logic(['x']))).toBe(true);
  });

  it('partial bit conflict isolates conflict to affected bits only', () => {
    // bit 0: 0 vs 1 -> X.  bit 1: 1 vs 1 -> 1.  bit 2: 0 vs Z -> 0.  bit 3: Z vs Z -> Z.
    const a = logic([0, 1, 0, 'z']);
    const b = logic([1, 1, 'z', 'z']);
    const r = ops.resolve([a, b]);
    expect(r.conflictBits).toBe(0b0001n);
    expect(ops.equals(r.value, logic(['x', 1, 0, 'z']))).toBe(true);
  });

  it('any X driver poisons that bit', () => {
    const a = logic([1, 0]);
    const b = logic(['x', 0]);
    const r = ops.resolve([a, b]);
    expect(ops.equals(r.value, logic(['x', 0]))).toBe(true);
    // X poisoning is not the same as a 0-vs-1 *conflict*
    expect(r.conflictBits).toBe(0n);
  });
});

describe('Gate helpers — X/Z aware bitwise ops', () => {
  it('AND: 0 dominates X (0 & X = 0)', () => {
    expect(ops.equals(bitAnd(logic([0]), logic(['x'])), logic([0]))).toBe(true);
    expect(ops.equals(bitAnd(logic(['x']), logic([0])), logic([0]))).toBe(true);
  });

  it('AND: 1 & X = X', () => {
    expect(ops.equals(bitAnd(logic([1]), logic(['x'])), logic(['x']))).toBe(true);
  });

  it('OR: 1 dominates X (1 | X = 1)', () => {
    expect(ops.equals(bitOr(logic([1]), logic(['x'])), logic([1]))).toBe(true);
    expect(ops.equals(bitOr(logic(['x']), logic([1])), logic([1]))).toBe(true);
  });

  it('OR: 0 | X = X', () => {
    expect(ops.equals(bitOr(logic([0]), logic(['x'])), logic(['x']))).toBe(true);
  });

  it('XOR: any undefined bit propagates X', () => {
    expect(ops.equals(bitXor(logic([1]), logic(['x'])), logic(['x']))).toBe(true);
    expect(ops.equals(bitXor(logic([0]), logic(['z'])), logic(['x']))).toBe(true);
  });

  it('NOT: ~X = X, ~Z = X', () => {
    expect(ops.equals(bitNot(logic(['x'])), logic(['x']))).toBe(true);
    expect(ops.equals(bitNot(logic(['z'])), logic(['x']))).toBe(true);
    expect(ops.equals(bitNot(logic([1, 0])), logic([0, 1]))).toBe(true);
  });

  it('multi-bit AND truth: 0xF0 & 0x0F = 0x00', () => {
    const a = lit(8, 0xf0n);
    const b = lit(8, 0x0fn);
    expect(ops.equals(bitAnd(a, b), lit(8, 0n))).toBe(true);
  });

  it('multi-bit OR truth: 0xF0 | 0x0F = 0xFF', () => {
    const a = lit(8, 0xf0n);
    const b = lit(8, 0x0fn);
    expect(ops.equals(bitOr(a, b), lit(8, 0xffn))).toBe(true);
  });

  it('width mismatch throws', () => {
    expect(() => bitAnd(lit(4, 0n), lit(8, 0n))).toThrow();
  });
});
