/**
 * Truth-table coverage for the new Logisim-parity primitives:
 *  Wiring   — power, ground, bit-extender, probe
 *  Gates    — odd-parity, even-parity, controlled-buffer, controlled-inverter
 *  Plexers  — priority-encoder, bit-selector
 *  Arith    — multiplier, divider, negator, absolute, min-max, shifter,
 *             bit-adder, bit-finder
 */

import { describe, expect, it } from 'vitest';
import { buildHarness } from './helpers.js';

describe('Wiring primitives', () => {
  it('power emits all-ones', () => {
    const h = buildHarness({}, { p: 4 }, (c, r) => {
      c.add('power', 'p', { width: 4 });
      c.wire(c.port('p', 'out'), r.probe.p!);
    });
    expect(h.observe('p')).toBe(0xfn);
  });

  it('ground emits all-zeros', () => {
    const h = buildHarness({}, { g: 4 }, (c, r) => {
      c.add('ground', 'g', { width: 4 });
      c.wire(c.port('g', 'out'), r.probe.g!);
    });
    expect(h.observe('g')).toBe(0n);
  });

  it('bit-extender zero-extends', () => {
    const h = buildHarness({ a: 4 }, { out: 8 }, (c, r) => {
      c.add('bit-extender', 'x', { inWidth: 4, outWidth: 8, mode: 'zero' });
      c.wire(r.in.a!, c.port('x', 'in'));
      c.wire(c.port('x', 'out'), r.probe.out!);
    });
    h.setBits('a', 0b1010);
    expect(h.observe('out')).toBe(0b00001010n);
  });

  it('bit-extender sign-extends a negative four-bit value', () => {
    const h = buildHarness({ a: 4 }, { out: 8 }, (c, r) => {
      c.add('bit-extender', 'x', { inWidth: 4, outWidth: 8, mode: 'sign' });
      c.wire(r.in.a!, c.port('x', 'in'));
      c.wire(c.port('x', 'out'), r.probe.out!);
    });
    h.setBits('a', 0b1010); // -6
    expect(h.observe('out')).toBe(0b11111010n); // 0xFA
  });

  it('probe acts as a read-only display (compiles)', () => {
    const h = buildHarness({ a: 1 }, {}, (c, r) => {
      c.add('probe', 'p', { width: 1 });
      c.wire(r.in.a!, c.port('p', 'in'));
    });
    h.setBits('a', 1);
    expect(h.diagnostics().filter((d) => d.kind === 'multi-driver').length).toBe(0);
  });
});

describe('Gate primitives — parity & tri-state', () => {
  it('odd-parity over four inputs', () => {
    const h = buildHarness({ a: 1, b: 1, c: 1, d: 1 }, { p: 1 }, (c, r) => {
      c.add('odd-parity', 'g', { width: 1, inputs: 4 });
      c.wire(r.in.a!, c.port('g', 'in0'));
      c.wire(r.in.b!, c.port('g', 'in1'));
      c.wire(r.in.c!, c.port('g', 'in2'));
      c.wire(r.in.d!, c.port('g', 'in3'));
      c.wire(c.port('g', 'out'), r.probe.p!);
    });
    h.setBits('a', 1);
    h.setBits('b', 0);
    h.setBits('c', 1);
    h.setBits('d', 0); // two 1s → even → 0
    expect(h.observe('p')).toBe(0n);
    h.setBits('d', 1); // three 1s → odd → 1
    expect(h.observe('p')).toBe(1n);
  });

  it('even-parity is the inverse of odd', () => {
    const h = buildHarness({ a: 1, b: 1 }, { p: 1 }, (c, r) => {
      c.add('even-parity', 'g', { width: 1, inputs: 2 });
      c.wire(r.in.a!, c.port('g', 'in0'));
      c.wire(r.in.b!, c.port('g', 'in1'));
      c.wire(c.port('g', 'out'), r.probe.p!);
    });
    h.setBits('a', 0);
    h.setBits('b', 0);
    expect(h.observe('p')).toBe(1n);
    h.setBits('a', 1);
    expect(h.observe('p')).toBe(0n);
  });

  it('controlled-buffer gates the input via en', () => {
    const h = buildHarness({ d: 1, e: 1 }, { o: 1 }, (c, r) => {
      c.add('controlled-buffer', 'cb', { width: 1 });
      c.wire(r.in.d!, c.port('cb', 'in'));
      c.wire(r.in.e!, c.port('cb', 'en'));
      c.wire(c.port('cb', 'out'), r.probe.o!);
    });
    h.setBits('d', 1);
    h.setBits('e', 1);
    expect(h.observe('o')).toBe(1n);
    h.setBits('e', 0); // disabled → Z
    expect(h.observe('o')).toBe('Z');
  });

  it('controlled-inverter inverts when enabled', () => {
    const h = buildHarness({ d: 1, e: 1 }, { o: 1 }, (c, r) => {
      c.add('controlled-inverter', 'ci', { width: 1 });
      c.wire(r.in.d!, c.port('ci', 'in'));
      c.wire(r.in.e!, c.port('ci', 'en'));
      c.wire(c.port('ci', 'out'), r.probe.o!);
    });
    h.setBits('d', 1);
    h.setBits('e', 1);
    expect(h.observe('o')).toBe(0n);
    h.setBits('d', 0);
    expect(h.observe('o')).toBe(1n);
    h.setBits('e', 0);
    expect(h.observe('o')).toBe('Z');
  });
});

describe('Plexer primitives', () => {
  it('priority-encoder picks the highest set input', () => {
    const h = buildHarness(
      { i0: 1, i1: 1, i2: 1, i3: 1 },
      { o: 2, v: 1 },
      (c, r) => {
        c.add('priority-encoder', 'pe', { select: 2 });
        c.wire(r.in.i0!, c.port('pe', 'in0'));
        c.wire(r.in.i1!, c.port('pe', 'in1'));
        c.wire(r.in.i2!, c.port('pe', 'in2'));
        c.wire(r.in.i3!, c.port('pe', 'in3'));
        c.wire(c.port('pe', 'out'), r.probe.o!);
        c.wire(c.port('pe', 'valid'), r.probe.v!);
      },
    );
    h.setBits('i0', 0);
    h.setBits('i1', 1);
    h.setBits('i2', 0);
    h.setBits('i3', 1); // highest = 3
    expect(h.observe('o')).toBe(3n);
    expect(h.observe('v')).toBe(1n);
    h.setBits('i3', 0);
    h.setBits('i1', 0);
    expect(h.observe('o')).toBe(0n);
    expect(h.observe('v')).toBe(0n);
  });

  it('bit-selector reads bit[sel] of an 8-bit bus', () => {
    const h = buildHarness({ d: 8, s: 3 }, { o: 1 }, (c, r) => {
      c.add('bit-selector', 'bs', { width: 8, group: 1 });
      c.wire(r.in.d!, c.port('bs', 'in'));
      c.wire(r.in.s!, c.port('bs', 'sel'));
      c.wire(c.port('bs', 'out'), r.probe.o!);
    });
    h.setBits('d', 0b10010110);
    h.setBits('s', 1);
    expect(h.observe('o')).toBe(1n); // bit 1 = 1
    h.setBits('s', 3);
    expect(h.observe('o')).toBe(0n); // bit 3 = 0
  });
});

describe('Arithmetic primitives', () => {
  it('multiplier produces both halves', () => {
    const h = buildHarness({ a: 8, b: 8 }, { lo: 8, hi: 8 }, (c, r) => {
      c.add('multiplier', 'm', { width: 8 });
      c.wire(r.in.a!, c.port('m', 'a'));
      c.wire(r.in.b!, c.port('m', 'b'));
      c.wire(c.port('m', 'lo'), r.probe.lo!);
      c.wire(c.port('m', 'hi'), r.probe.hi!);
    });
    h.setBits('a', 200);
    h.setBits('b', 5);
    // 200*5 = 1000 = 0x3E8 → lo=0xE8, hi=0x03
    expect(h.observe('lo')).toBe(0xe8n);
    expect(h.observe('hi')).toBe(0x03n);
  });

  it('divider yields quotient and remainder', () => {
    const h = buildHarness({ a: 8, b: 8 }, { q: 8, r: 8 }, (c, r) => {
      c.add('divider', 'd', { width: 8 });
      c.wire(r.in.a!, c.port('d', 'a'));
      c.wire(r.in.b!, c.port('d', 'b'));
      c.wire(c.port('d', 'q'), r.probe.q!);
      c.wire(c.port('d', 'r'), r.probe.r!);
    });
    h.setBits('a', 100);
    h.setBits('b', 7);
    expect(h.observe('q')).toBe(14n);
    expect(h.observe('r')).toBe(2n);
    // Divide-by-zero → X
    h.setBits('b', 0);
    expect(h.observe('q')).toBe('X');
    expect(h.observe('r')).toBe('X');
  });

  it('negator computes two\'s complement', () => {
    const h = buildHarness({ a: 8 }, { o: 8 }, (c, r) => {
      c.add('negator', 'n', { width: 8 });
      c.wire(r.in.a!, c.port('n', 'in'));
      c.wire(c.port('n', 'out'), r.probe.o!);
    });
    h.setBits('a', 5);
    expect(h.observe('o')).toBe(0xfbn); // -5 in 8-bit two's complement = 0xFB
  });

  it('absolute folds negatives back to positives', () => {
    const h = buildHarness({ a: 8 }, { o: 8 }, (c, r) => {
      c.add('absolute', 'ab', { width: 8 });
      c.wire(r.in.a!, c.port('ab', 'in'));
      c.wire(c.port('ab', 'out'), r.probe.o!);
    });
    h.setBits('a', 5);
    expect(h.observe('o')).toBe(5n);
    h.setBits('a', 0xfb); // -5
    expect(h.observe('o')).toBe(5n);
  });

  it('min-max produces both extremes (signed)', () => {
    const h = buildHarness({ a: 8, b: 8 }, { mn: 8, mx: 8 }, (c, r) => {
      c.add('min-max', 'mm', { width: 8, signed: true });
      c.wire(r.in.a!, c.port('mm', 'a'));
      c.wire(r.in.b!, c.port('mm', 'b'));
      c.wire(c.port('mm', 'min'), r.probe.mn!);
      c.wire(c.port('mm', 'max'), r.probe.mx!);
    });
    h.setBits('a', 0xfb); // -5 signed
    h.setBits('b', 0x05); // +5
    expect(h.observe('mn')).toBe(0xfbn);
    expect(h.observe('mx')).toBe(0x05n);
  });

  it('shifter — logical left/right', () => {
    const h = buildHarness({ d: 8, s: 4 }, { o: 8 }, (c, r) => {
      c.add('shifter', 'sh', { width: 8, direction: 'left', arithmetic: false });
      c.wire(r.in.d!, c.port('sh', 'in'));
      c.wire(r.in.s!, c.port('sh', 'shamt'));
      c.wire(c.port('sh', 'out'), r.probe.o!);
    });
    h.setBits('d', 0b00010110);
    h.setBits('s', 2);
    expect(h.observe('o')).toBe(0b01011000n);
  });

  it('shifter — arithmetic right preserves sign', () => {
    const h = buildHarness({ d: 8, s: 4 }, { o: 8 }, (c, r) => {
      c.add('shifter', 'sh', { width: 8, direction: 'right', arithmetic: true });
      c.wire(r.in.d!, c.port('sh', 'in'));
      c.wire(r.in.s!, c.port('sh', 'shamt'));
      c.wire(c.port('sh', 'out'), r.probe.o!);
    });
    h.setBits('d', 0b11110000); // -16 in 8-bit
    h.setBits('s', 2);
    expect(h.observe('o')).toBe(0b11111100n); // -4
  });

  it('bit-adder counts ones', () => {
    const h = buildHarness({ d: 8 }, { c: 4 }, (c, r) => {
      c.add('bit-adder', 'ba', { width: 8 });
      c.wire(r.in.d!, c.port('ba', 'in'));
      c.wire(c.port('ba', 'out'), r.probe.c!);
    });
    h.setBits('d', 0b10110101); // five 1s
    expect(h.observe('c')).toBe(5n);
  });

  it('pull-resistor drives pullUp by default', () => {
    const h = buildHarness({}, { p: 4 }, (c, r) => {
      c.add('pull-resistor', 'pu', { width: 4, direction: 'pullUp' });
      c.wire(c.port('pu', 'out'), r.probe.p!);
    });
    expect(h.observe('p')).toBe(0xfn);
  });

  it('pull-resistor pullDown drives zero', () => {
    const h = buildHarness({}, { p: 4 }, (c, r) => {
      c.add('pull-resistor', 'pd', { width: 4, direction: 'pullDown' });
      c.wire(c.port('pd', 'out'), r.probe.p!);
    });
    expect(h.observe('p')).toBe(0n);
  });

  it('POR pulses high at start, then drops on the next clock edge', () => {
    const h = buildHarness({}, { o: 1 }, (c, r) => {
      c.add('por', 'p', {});
      c.wire(c.port('p', 'out'), r.probe.o!);
    });
    expect(h.observe('o')).toBe(1n);
    h.tickClock();
    expect(h.observe('o')).toBe(0n);
    h.tickClock();
    expect(h.observe('o')).toBe(0n); // stays low
  });

  it('exponentiator computes (a^b) mod 2^width', () => {
    const h = buildHarness({ a: 8, b: 8 }, { o: 8 }, (c, r) => {
      c.add('exponentiator', 'e', { width: 8 });
      c.wire(r.in.a!, c.port('e', 'a'));
      c.wire(r.in.b!, c.port('e', 'b'));
      c.wire(c.port('e', 'out'), r.probe.o!);
    });
    h.setBits('a', 3);
    h.setBits('b', 5);
    expect(h.observe('o')).toBe(0xf3n); // 3^5 = 243 = 0xF3
  });

  it('RAM round-trips a write then read', () => {
    const h = buildHarness(
      { addr: 4, data: 8, we: 1, oe: 1 },
      { out: 8 },
      (c, r) => {
        c.add('ram', 'm', { width: 8, addrBits: 4 });
        c.wire(r.in.addr!, c.port('m', 'addr'));
        c.wire(r.in.data!, c.port('m', 'data'));
        c.wire(r.in.we!, c.port('m', 'we'));
        c.wire(r.in.oe!, c.port('m', 'oe'));
        c.wire(c.port('m', 'out'), r.probe.out!);
      },
    );
    h.setBits('oe', 1);
    h.setBits('addr', 5);
    h.setBits('data', 0xab);
    h.setBits('we', 1);
    h.tickClock();
    h.setBits('we', 0);
    expect(h.observe('out')).toBe(0xabn);
    h.setBits('addr', 6); // unwritten cell reads as 0
    expect(h.observe('out')).toBe(0n);
  });

  it('RAM read with oe=0 is high-Z', () => {
    const h = buildHarness({ oe: 1 }, { out: 8 }, (c, r) => {
      c.add('ram', 'm', { width: 8, addrBits: 4 });
      c.wire(r.in.oe!, c.port('m', 'oe'));
      c.wire(c.port('m', 'out'), r.probe.out!);
    });
    h.setBits('oe', 0);
    expect(h.observe('out')).toBe('Z');
  });

  it('D flip-flop captures d on clock edge', () => {
    const h = buildHarness({ d: 1 }, { q: 1, qn: 1 }, (c, r) => {
      c.add('d-flipflop', 'ff', {});
      c.wire(r.in.d!, c.port('ff', 'd'));
      c.wire(c.port('ff', 'q'), r.probe.q!);
      c.wire(c.port('ff', 'qn'), r.probe.qn!);
    });
    h.setBits('d', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    expect(h.observe('qn')).toBe(0n);
    h.setBits('d', 0);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
    expect(h.observe('qn')).toBe(1n);
  });

  it('T flip-flop toggles when t is high', () => {
    const h = buildHarness({ t: 1 }, { q: 1 }, (c, r) => {
      c.add('t-flipflop', 'ff', {});
      c.wire(r.in.t!, c.port('ff', 't'));
      c.wire(c.port('ff', 'q'), r.probe.q!);
    });
    h.setBits('t', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
    h.setBits('t', 0); // hold
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
  });

  it('JK flip-flop covers hold/set/reset/toggle', () => {
    const h = buildHarness({ j: 1, k: 1 }, { q: 1 }, (c, r) => {
      c.add('jk-flipflop', 'ff', {});
      c.wire(r.in.j!, c.port('ff', 'j'));
      c.wire(r.in.k!, c.port('ff', 'k'));
      c.wire(c.port('ff', 'q'), r.probe.q!);
    });
    // set
    h.setBits('j', 1);
    h.setBits('k', 0);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    // hold
    h.setBits('j', 0);
    h.setBits('k', 0);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    // reset
    h.setBits('k', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
    // toggle
    h.setBits('j', 1);
    h.setBits('k', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
  });

  it('SR flip-flop set/reset and poisons on S=R=1', () => {
    const h = buildHarness({ s: 1, r: 1 }, { q: 1 }, (c, r) => {
      c.add('sr-flipflop', 'ff', {});
      c.wire(r.in.s!, c.port('ff', 's'));
      c.wire(r.in.r!, c.port('ff', 'r'));
      c.wire(c.port('ff', 'q'), r.probe.q!);
    });
    h.setBits('s', 1);
    h.setBits('r', 0);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    h.setBits('s', 0);
    h.setBits('r', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
    // invalid both-high → poisoned X
    h.setBits('s', 1);
    h.setBits('r', 1);
    h.tickClock();
    expect(h.observe('q')).toBe('X');
    // a clean edge unpoisons
    h.setBits('s', 0);
    h.setBits('r', 0);
    h.tickClock();
    expect(h.observe('q')).toBe(0n); // q was preserved through the poisoned edge
  });

  it('ROM returns programmed data from the param string', () => {
    const h = buildHarness({ addr: 4, oe: 1 }, { out: 8 }, (c, r) => {
      c.add('rom', 'm', { width: 8, addrBits: 4, data: '01 0a ff 00' });
      c.wire(r.in.addr!, c.port('m', 'addr'));
      c.wire(r.in.oe!, c.port('m', 'oe'));
      c.wire(c.port('m', 'out'), r.probe.out!);
    });
    h.setBits('oe', 1);
    h.setBits('addr', 0);
    expect(h.observe('out')).toBe(0x01n);
    h.setBits('addr', 2);
    expect(h.observe('out')).toBe(0xffn);
    h.setBits('addr', 7); // beyond programmed range → 0
    expect(h.observe('out')).toBe(0n);
  });

  it('square-root produces integer floor sqrt', () => {
    const h = buildHarness({ a: 8 }, { o: 8 }, (c, r) => {
      c.add('square-root', 's', { width: 8 });
      c.wire(r.in.a!, c.port('s', 'in'));
      c.wire(c.port('s', 'out'), r.probe.o!);
    });
    h.setBits('a', 144);
    expect(h.observe('o')).toBe(12n);
    h.setBits('a', 150); // sqrt = 12.24… → floor 12
    expect(h.observe('o')).toBe(12n);
  });

  it('bit-finder locates lowest and highest set bits', () => {
    const lo = buildHarness({ d: 8 }, { idx: 3, found: 1 }, (c, r) => {
      c.add('bit-finder', 'bf', { width: 8, direction: 'lowest' });
      c.wire(r.in.d!, c.port('bf', 'in'));
      c.wire(c.port('bf', 'idx'), r.probe.idx!);
      c.wire(c.port('bf', 'found'), r.probe.found!);
    });
    lo.setBits('d', 0b00100100);
    expect(lo.observe('idx')).toBe(2n);
    expect(lo.observe('found')).toBe(1n);

    const hi = buildHarness({ d: 8 }, { idx: 3, found: 1 }, (c, r) => {
      c.add('bit-finder', 'bf', { width: 8, direction: 'highest' });
      c.wire(r.in.d!, c.port('bf', 'in'));
      c.wire(c.port('bf', 'idx'), r.probe.idx!);
      c.wire(c.port('bf', 'found'), r.probe.found!);
    });
    hi.setBits('d', 0b00100100);
    expect(hi.observe('idx')).toBe(5n);
    expect(hi.observe('found')).toBe(1n);
  });
});
