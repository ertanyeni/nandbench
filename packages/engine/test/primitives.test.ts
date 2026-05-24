import { describe, expect, it } from 'vitest';
import { buildHarness } from './helpers.js';

describe('AND gate — truth table (1-bit, 2-input)', () => {
  const cases: Array<[number, number, number]> = [
    [0, 0, 0],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ];
  for (const [a, b, out] of cases) {
    it(`${a} AND ${b} = ${out}`, () => {
      const h = buildHarness(
        { a: 1, b: 1 },
        { out: 1 },
        (c, r) => {
          c.add('and', 'g', { width: 1, inputs: 2 });
          c.wire(r.in.a!, c.port('g', 'in0'));
          c.wire(r.in.b!, c.port('g', 'in1'));
          c.wire(c.port('g', 'out'), r.probe.out!);
        },
      );
      h.setBits('a', a);
      h.setBits('b', b);
      expect(h.observe('out')).toBe(BigInt(out));
    });
  }
});

describe('OR / XOR / NOT — truth tables', () => {
  it('OR truth table', () => {
    const h = buildHarness(
      { a: 1, b: 1 },
      { out: 1 },
      (c, r) => {
        c.add('or', 'g', { width: 1 });
        c.wire(r.in.a!, c.port('g', 'in0'));
        c.wire(r.in.b!, c.port('g', 'in1'));
        c.wire(c.port('g', 'out'), r.probe.out!);
      },
    );
    for (const [a, b, out] of [
      [0, 0, 0],
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ] as const) {
      h.setBits('a', a);
      h.setBits('b', b);
      expect(h.observe('out')).toBe(BigInt(out));
    }
  });

  it('XOR truth table', () => {
    const h = buildHarness(
      { a: 1, b: 1 },
      { out: 1 },
      (c, r) => {
        c.add('xor', 'g', { width: 1 });
        c.wire(r.in.a!, c.port('g', 'in0'));
        c.wire(r.in.b!, c.port('g', 'in1'));
        c.wire(c.port('g', 'out'), r.probe.out!);
      },
    );
    for (const [a, b, out] of [
      [0, 0, 0],
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ] as const) {
      h.setBits('a', a);
      h.setBits('b', b);
      expect(h.observe('out')).toBe(BigInt(out));
    }
  });

  it('NOT truth table', () => {
    const h = buildHarness(
      { a: 1 },
      { out: 1 },
      (c, r) => {
        c.add('not', 'g', { width: 1 });
        c.wire(r.in.a!, c.port('g', 'in'));
        c.wire(c.port('g', 'out'), r.probe.out!);
      },
    );
    h.setBits('a', 0);
    expect(h.observe('out')).toBe(1n);
    h.setBits('a', 1);
    expect(h.observe('out')).toBe(0n);
  });
});

describe('AND — multi-bit bus', () => {
  it('8-bit: 0xF0 & 0x0F = 0x00, 0xF0 & 0xFF = 0xF0', () => {
    const h = buildHarness(
      { a: 8, b: 8 },
      { out: 8 },
      (c, r) => {
        c.add('and', 'g', { width: 8 });
        c.wire(r.in.a!, c.port('g', 'in0'));
        c.wire(r.in.b!, c.port('g', 'in1'));
        c.wire(c.port('g', 'out'), r.probe.out!);
      },
    );
    h.setBits('a', 0xf0);
    h.setBits('b', 0x0f);
    expect(h.observe('out')).toBe(0n);
    h.setBits('a', 0xf0);
    h.setBits('b', 0xff);
    expect(h.observe('out')).toBe(0xf0n);
  });
});

describe('MUX', () => {
  it('2-to-1: selects in0 when sel=0, in1 when sel=1', () => {
    const h = buildHarness(
      { a: 4, b: 4, sel: 1 },
      { out: 4 },
      (c, r) => {
        c.add('mux', 'm', { width: 4, inputs: 2 });
        c.wire(r.in.a!, c.port('m', 'in0'));
        c.wire(r.in.b!, c.port('m', 'in1'));
        c.wire(r.in.sel!, c.port('m', 'sel'));
        c.wire(c.port('m', 'out'), r.probe.out!);
      },
    );
    h.setBits('a', 0xa);
    h.setBits('b', 0x5);
    h.setBits('sel', 0);
    expect(h.observe('out')).toBe(0xan);
    h.setBits('sel', 1);
    expect(h.observe('out')).toBe(0x5n);
  });

  it('4-to-1: selects each of in0..in3', () => {
    const h = buildHarness(
      { a: 2, b: 2, c: 2, d: 2, sel: 2 },
      { out: 2 },
      (c, r) => {
        c.add('mux', 'm', { width: 2, inputs: 4 });
        c.wire(r.in.a!, c.port('m', 'in0'));
        c.wire(r.in.b!, c.port('m', 'in1'));
        c.wire(r.in.c!, c.port('m', 'in2'));
        c.wire(r.in.d!, c.port('m', 'in3'));
        c.wire(r.in.sel!, c.port('m', 'sel'));
        c.wire(c.port('m', 'out'), r.probe.out!);
      },
    );
    h.setBits('a', 0b00);
    h.setBits('b', 0b01);
    h.setBits('c', 0b10);
    h.setBits('d', 0b11);
    for (const [s, want] of [
      [0, 0b00],
      [1, 0b01],
      [2, 0b10],
      [3, 0b11],
    ] as const) {
      h.setBits('sel', s);
      expect(h.observe('out')).toBe(BigInt(want));
    }
  });

  it('X on sel propagates X to output', () => {
    const h = buildHarness(
      { a: 1, b: 1, sel: 1 },
      { out: 1 },
      (c, r) => {
        c.add('mux', 'm', { width: 1 });
        c.wire(r.in.a!, c.port('m', 'in0'));
        c.wire(r.in.b!, c.port('m', 'in1'));
        c.wire(r.in.sel!, c.port('m', 'sel'));
        c.wire(c.port('m', 'out'), r.probe.out!);
      },
    );
    h.setBits('a', 0);
    h.setBits('b', 1);
    h.setLogic('sel', ['x']);
    expect(h.observe('out')).toBe('X');
  });
});

describe('Composed circuit — 1-bit full adder', () => {
  // sum = (a XOR b) XOR cin
  // cout = (a AND b) OR (cin AND (a XOR b))
  it('matches the full-adder truth table', () => {
    const h = buildHarness(
      { a: 1, b: 1, cin: 1 },
      { sum: 1, cout: 1 },
      (c, r) => {
        c.add('xor', 'x1', { width: 1 });
        c.add('xor', 'x2', { width: 1 });
        c.add('and', 'a1', { width: 1 });
        c.add('and', 'a2', { width: 1 });
        c.add('or', 'o1', { width: 1 });

        // x1 = a XOR b
        c.wire(r.in.a!, c.port('x1', 'in0'));
        c.wire(r.in.b!, c.port('x1', 'in1'));
        // x2 = x1 XOR cin = sum
        c.wire(c.port('x1', 'out'), c.port('x2', 'in0'));
        c.wire(r.in.cin!, c.port('x2', 'in1'));
        c.wire(c.port('x2', 'out'), r.probe.sum!);
        // a1 = a AND b
        c.wire(r.in.a!, c.port('a1', 'in0'));
        c.wire(r.in.b!, c.port('a1', 'in1'));
        // a2 = cin AND x1
        c.wire(r.in.cin!, c.port('a2', 'in0'));
        c.wire(c.port('x1', 'out'), c.port('a2', 'in1'));
        // cout = a1 OR a2
        c.wire(c.port('a1', 'out'), c.port('o1', 'in0'));
        c.wire(c.port('a2', 'out'), c.port('o1', 'in1'));
        c.wire(c.port('o1', 'out'), r.probe.cout!);
      },
    );
    for (let a = 0; a < 2; a++) {
      for (let b = 0; b < 2; b++) {
        for (let cin = 0; cin < 2; cin++) {
          h.setBits('a', a);
          h.setBits('b', b);
          h.setBits('cin', cin);
          const total = a + b + cin;
          expect(h.observe('sum')).toBe(BigInt(total & 1));
          expect(h.observe('cout')).toBe(BigInt(total >> 1));
        }
      }
    }
  });
});
