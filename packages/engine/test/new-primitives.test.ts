import { describe, expect, it } from 'vitest';
import {
  asComponentId,
  compileNetlist,
  createRegistry,
  createSimulator,
  lit,
  portKey,
  registerPrimitives,
  signalOps,
  type ComponentInstance,
  type NetlistInput,
  type PortRef,
} from '../src/index.js';
import { buildHarness, classify, newCircuit, portValue } from './helpers.js';

describe('NAND / NOR / XNOR — inverted gate variants', () => {
  it('NAND truth table', () => {
    const h = buildHarness(
      { a: 1, b: 1 },
      { out: 1 },
      (c, r) => {
        c.add('nand', 'g', { width: 1 });
        c.wire(r.in.a!, c.port('g', 'in0'));
        c.wire(r.in.b!, c.port('g', 'in1'));
        c.wire(c.port('g', 'out'), r.probe.out!);
      },
    );
    for (const [a, b, out] of [
      [0, 0, 1],
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ] as const) {
      h.setBits('a', a);
      h.setBits('b', b);
      expect(h.observe('out')).toBe(BigInt(out));
    }
  });

  it('NOR truth table', () => {
    const h = buildHarness(
      { a: 1, b: 1 },
      { out: 1 },
      (c, r) => {
        c.add('nor', 'g', { width: 1 });
        c.wire(r.in.a!, c.port('g', 'in0'));
        c.wire(r.in.b!, c.port('g', 'in1'));
        c.wire(c.port('g', 'out'), r.probe.out!);
      },
    );
    for (const [a, b, out] of [
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
      [1, 1, 0],
    ] as const) {
      h.setBits('a', a);
      h.setBits('b', b);
      expect(h.observe('out')).toBe(BigInt(out));
    }
  });

  it('XNOR truth table', () => {
    const h = buildHarness(
      { a: 1, b: 1 },
      { out: 1 },
      (c, r) => {
        c.add('xnor', 'g', { width: 1 });
        c.wire(r.in.a!, c.port('g', 'in0'));
        c.wire(r.in.b!, c.port('g', 'in1'));
        c.wire(c.port('g', 'out'), r.probe.out!);
      },
    );
    for (const [a, b, out] of [
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
      [1, 1, 1],
    ] as const) {
      h.setBits('a', a);
      h.setBits('b', b);
      expect(h.observe('out')).toBe(BigInt(out));
    }
  });
});

describe('Buffer', () => {
  it('passes through 4-bit data', () => {
    const h = buildHarness(
      { a: 4 },
      { out: 4 },
      (c, r) => {
        c.add('buffer', 'b', { width: 4 });
        c.wire(r.in.a!, c.port('b', 'in'));
        c.wire(c.port('b', 'out'), r.probe.out!);
      },
    );
    for (const v of [0, 5, 10, 15]) {
      h.setBits('a', v);
      expect(h.observe('out')).toBe(BigInt(v));
    }
  });
});

describe('Constant source', () => {
  it('drives the configured literal', () => {
    const b = newCircuit();
    b.add('constant', 'k', { width: 4, value: '0xA' });
    b.add('output', 'p', { width: 4 });
    b.wire(b.port('k', 'out'), b.port('p', 'in'));
    const circuit = b.build();
    circuit.sim.settle();
    expect(classify(portValue(circuit, b.port('p', 'in')))).toBe(0xan);
  });

  it('drives the configured literal — decimal form', () => {
    const b = newCircuit();
    b.add('constant', 'k', { width: 8, value: '42' });
    b.add('output', 'p', { width: 8 });
    b.wire(b.port('k', 'out'), b.port('p', 'in'));
    const circuit = b.build();
    circuit.sim.settle();
    expect(classify(portValue(circuit, b.port('p', 'in')))).toBe(42n);
  });
});

describe('Clock source', () => {
  it('toggles every tickClock()', () => {
    const h = buildHarness(
      {},
      { q: 1 },
      (c, r) => {
        c.add('clock', 'clk');
        c.wire(c.port('clk', 'out'), r.probe.q!);
      },
    );
    expect(h.observe('q')).toBe(0n);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
  });
});

describe('Adder', () => {
  it('4-bit a + b + cin produces s, cout', () => {
    const h = buildHarness(
      { a: 4, b: 4, cin: 1 },
      { s: 4, cout: 1 },
      (c, r) => {
        c.add('adder', 'adr', { width: 4 });
        c.wire(r.in.a!, c.port('adr', 'a'));
        c.wire(r.in.b!, c.port('adr', 'b'));
        c.wire(r.in.cin!, c.port('adr', 'cin'));
        c.wire(c.port('adr', 's'), r.probe.s!);
        c.wire(c.port('adr', 'cout'), r.probe.cout!);
      },
    );
    for (const [a, b, cin] of [
      [0, 0, 0],
      [1, 2, 0],
      [7, 8, 0],
      [15, 0, 1],
      [15, 1, 0], // wraps
      [15, 15, 1], // 31, sum bits 1111, cout 1
    ] as const) {
      h.setBits('a', a);
      h.setBits('b', b);
      h.setBits('cin', cin);
      const total = a + b + cin;
      expect(h.observe('s')).toBe(BigInt(total & 0xf));
      expect(h.observe('cout')).toBe(BigInt((total >> 4) & 1));
    }
  });
});

describe('Subtractor', () => {
  it('4-bit a - b - bin; bout flags underflow', () => {
    const h = buildHarness(
      { a: 4, b: 4, bin: 1 },
      { d: 4, bout: 1 },
      (c, r) => {
        c.add('subtractor', 'sub', { width: 4 });
        c.wire(r.in.a!, c.port('sub', 'a'));
        c.wire(r.in.b!, c.port('sub', 'b'));
        c.wire(r.in.bin!, c.port('sub', 'bin'));
        c.wire(c.port('sub', 'd'), r.probe.d!);
        c.wire(c.port('sub', 'bout'), r.probe.bout!);
      },
    );
    h.setBits('a', 5);
    h.setBits('b', 3);
    h.setBits('bin', 0);
    expect(h.observe('d')).toBe(2n);
    expect(h.observe('bout')).toBe(0n);

    h.setBits('a', 0);
    h.setBits('b', 1);
    h.setBits('bin', 0);
    expect(h.observe('d')).toBe(0xfn); // -1 in 4-bit two's complement
    expect(h.observe('bout')).toBe(1n);
  });
});

describe('Comparator', () => {
  it('eq/lt/gt unsigned', () => {
    const h = buildHarness(
      { a: 4, b: 4 },
      { lt: 1, eq: 1, gt: 1 },
      (c, r) => {
        c.add('comparator', 'cmp', { width: 4 });
        c.wire(r.in.a!, c.port('cmp', 'a'));
        c.wire(r.in.b!, c.port('cmp', 'b'));
        c.wire(c.port('cmp', 'lt'), r.probe.lt!);
        c.wire(c.port('cmp', 'eq'), r.probe.eq!);
        c.wire(c.port('cmp', 'gt'), r.probe.gt!);
      },
    );
    h.setBits('a', 3);
    h.setBits('b', 5);
    expect(h.observe('lt')).toBe(1n);
    expect(h.observe('eq')).toBe(0n);
    expect(h.observe('gt')).toBe(0n);

    h.setBits('a', 7);
    h.setBits('b', 7);
    expect(h.observe('lt')).toBe(0n);
    expect(h.observe('eq')).toBe(1n);
    expect(h.observe('gt')).toBe(0n);

    h.setBits('a', 9);
    h.setBits('b', 2);
    expect(h.observe('lt')).toBe(0n);
    expect(h.observe('eq')).toBe(0n);
    expect(h.observe('gt')).toBe(1n);
  });

  it('signed comparison sees -1 < 1', () => {
    const h = buildHarness(
      { a: 4, b: 4 },
      { lt: 1, eq: 1, gt: 1 },
      (c, r) => {
        c.add('comparator', 'cmp', { width: 4, signed: true });
        c.wire(r.in.a!, c.port('cmp', 'a'));
        c.wire(r.in.b!, c.port('cmp', 'b'));
        c.wire(c.port('cmp', 'lt'), r.probe.lt!);
        c.wire(c.port('cmp', 'eq'), r.probe.eq!);
        c.wire(c.port('cmp', 'gt'), r.probe.gt!);
      },
    );
    h.setBits('a', 0xf); // -1 as 4-bit signed
    h.setBits('b', 1);
    expect(h.observe('lt')).toBe(1n);
  });
});

describe('Demux', () => {
  it('1→4 routes input only to selected output; others are Z', () => {
    const b = newCircuit();
    b.add('input', 'in', { width: 1 });
    b.add('input', 'sel', { width: 2 });
    b.add('demux', 'dm', { width: 1, outputs: 4 });
    for (let i = 0; i < 4; i++) b.add('output', `p${i}`, { width: 1 });
    b.wire(b.port('in', 'out'), b.port('dm', 'in'));
    b.wire(b.port('sel', 'out'), b.port('dm', 'sel'));
    for (let i = 0; i < 4; i++) b.wire(b.port('dm', `out${i}`), b.port(`p${i}`, 'in'));
    const circuit = b.build();
    const inPin: PortRef = { componentId: asComponentId('in'), portName: 'out' };
    const selPin: PortRef = { componentId: asComponentId('sel'), portName: 'out' };
    circuit.sim.setInput(inPin, lit(1, 1n));
    circuit.sim.setInput(selPin, lit(2, 2n)); // route to out2
    circuit.sim.settle();
    for (let i = 0; i < 4; i++) {
      const v = portValue(circuit, b.port(`p${i}`, 'in'));
      const cls = classify(v);
      if (i === 2) expect(cls).toBe(1n);
      else expect(cls).toBe('Z');
    }
  });
});

describe('Decoder', () => {
  it('2-bit sel → 4-output one-hot', () => {
    const b = newCircuit();
    b.add('input', 'sel', { width: 2 });
    b.add('decoder', 'dec', { inputs: 2 });
    for (let i = 0; i < 4; i++) b.add('output', `p${i}`, { width: 1 });
    b.wire(b.port('sel', 'out'), b.port('dec', 'sel'));
    for (let i = 0; i < 4; i++) b.wire(b.port('dec', `out${i}`), b.port(`p${i}`, 'in'));
    const circuit = b.build();
    const selPin: PortRef = { componentId: asComponentId('sel'), portName: 'out' };
    for (let s = 0; s < 4; s++) {
      circuit.sim.setInput(selPin, lit(2, BigInt(s)));
      circuit.sim.settle();
      for (let i = 0; i < 4; i++) {
        expect(classify(portValue(circuit, b.port(`p${i}`, 'in')))).toBe(BigInt(i === s ? 1 : 0));
      }
    }
  });
});

describe('Counter', () => {
  it('counts up on each tick when enabled, wraps at 2^width', () => {
    const h = buildHarness(
      { en: 1, rst: 1 },
      { q: 4, co: 1 },
      (c, r) => {
        c.add('counter', 'cnt', { width: 4 });
        c.wire(r.in.en!, c.port('cnt', 'en'));
        c.wire(r.in.rst!, c.port('cnt', 'rst'));
        c.wire(c.port('cnt', 'q'), r.probe.q!);
        c.wire(c.port('cnt', 'co'), r.probe.co!);
      },
    );
    h.setBits('en', 1);
    h.setBits('rst', 0);
    expect(h.observe('q')).toBe(0n);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    for (let i = 0; i < 13; i++) h.tickClock();
    expect(h.observe('q')).toBe(14n);
    h.tickClock();
    expect(h.observe('q')).toBe(15n);
    expect(h.observe('co')).toBe(1n);
    h.tickClock(); // wrap
    expect(h.observe('q')).toBe(0n);
    expect(h.observe('co')).toBe(0n);
  });

  it('rst clears the count', () => {
    const h = buildHarness(
      { en: 1, rst: 1 },
      { q: 4 },
      (c, r) => {
        c.add('counter', 'cnt', { width: 4 });
        c.wire(r.in.en!, c.port('cnt', 'en'));
        c.wire(r.in.rst!, c.port('cnt', 'rst'));
        c.wire(c.port('cnt', 'q'), r.probe.q!);
      },
    );
    h.setBits('en', 1);
    h.setBits('rst', 0);
    h.tickClock();
    h.tickClock();
    h.tickClock();
    expect(h.observe('q')).toBe(3n);
    h.setBits('rst', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
  });
});

describe('Shift register', () => {
  it('shifts in serial data each enabled tick (right by default — new bit at MSB)', () => {
    const h = buildHarness(
      { d: 1, en: 1 },
      { q: 4 },
      (c, r) => {
        c.add('shift-register', 'sr', { width: 4 });
        c.wire(r.in.d!, c.port('sr', 'd'));
        c.wire(r.in.en!, c.port('sr', 'en'));
        c.wire(c.port('sr', 'q'), r.probe.q!);
      },
    );
    h.setBits('en', 1);
    // shift in 1, 0, 1, 1 (LSB first as far as tick order; new bit lands at MSB,
    // old bits move toward LSB).
    h.setBits('d', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(0b1000n);
    h.setBits('d', 0);
    h.tickClock();
    expect(h.observe('q')).toBe(0b0100n);
    h.setBits('d', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(0b1010n);
    h.setBits('d', 1);
    h.tickClock();
    expect(h.observe('q')).toBe(0b1101n);
  });
});

describe('Splitter', () => {
  it('splits an 8-bit input into 4×2-bit outputs', () => {
    const b = newCircuit();
    b.add('input', 'src', { width: 8 });
    b.add('splitter', 'sp', { width: 8, fanout: 4 });
    for (let i = 0; i < 4; i++) b.add('output', `p${i}`, { width: 2 });
    b.wire(b.port('src', 'out'), b.port('sp', 'in'));
    for (let i = 0; i < 4; i++) b.wire(b.port('sp', `out${i}`), b.port(`p${i}`, 'in'));
    const circuit = b.build();
    const srcPin: PortRef = { componentId: asComponentId('src'), portName: 'out' };
    // 0b11_01_10_00 = bits 0..1=00, 2..3=10, 4..5=01, 6..7=11
    circuit.sim.setInput(srcPin, lit(8, 0b11_01_10_00n));
    circuit.sim.settle();
    expect(classify(portValue(circuit, b.port('p0', 'in')))).toBe(0b00n);
    expect(classify(portValue(circuit, b.port('p1', 'in')))).toBe(0b10n);
    expect(classify(portValue(circuit, b.port('p2', 'in')))).toBe(0b01n);
    expect(classify(portValue(circuit, b.port('p3', 'in')))).toBe(0b11n);
  });
});

describe('Tunnel — net-compile-time merge by label', () => {
  it('two tunnels with the same label behave as wired', () => {
    // We exercise this end-to-end through compileDocument once tunnels are
    // recognized by the app's netlist-sync. The engine-side tunnel by itself
    // is just a passive port — verify it doesn't blow up the simulator.
    const registry = createRegistry();
    registerPrimitives(registry);
    const input: NetlistInput = {
      components: [
        { id: asComponentId('t1'), kind: 'tunnel', params: { width: 1, label: 'X' }, state: undefined } as ComponentInstance,
        { id: asComponentId('t2'), kind: 'tunnel', params: { width: 1, label: 'X' }, state: undefined } as ComponentInstance,
      ],
      connections: [
        // Manually wire the two tunnel ports — what the app's netlist-sync
        // will do automatically for same-label tunnels.
        {
          a: { componentId: asComponentId('t1'), portName: 'port' },
          b: { componentId: asComponentId('t2'), portName: 'port' },
        },
      ],
    };
    const { netlist, diagnostics } = compileNetlist(input, registry);
    expect(diagnostics).toEqual([]);
    // Both tunnel ports should belong to the same net.
    const k1 = portKey(asComponentId('t1'), 'port');
    const k2 = portKey(asComponentId('t2'), 'port');
    expect(netlist.portToNet.get(k1)).toBe(netlist.portToNet.get(k2));
    // And the simulator loads without errors.
    const sim = createSimulator(registry);
    sim.load(netlist);
    sim.settle();
    expect(sim.diagnostics().some((d) => d.kind === 'oscillation')).toBe(false);
  });
});

describe('LED / Button / 7-segment — sink/source behavior', () => {
  it('LED is a pure sink (no engine output), reads net value via snapshot', () => {
    const b = newCircuit();
    b.add('input', 'src', { width: 1 });
    b.add('led', 'lamp');
    b.wire(b.port('src', 'out'), b.port('lamp', 'in'));
    const circuit = b.build();
    const srcPin: PortRef = { componentId: asComponentId('src'), portName: 'out' };
    circuit.sim.setInput(srcPin, lit(1, 1n));
    circuit.sim.settle();
    expect(classify(portValue(circuit, b.port('lamp', 'in')))).toBe(1n);
  });

  it('Button drives 0 by default and accepts setInput updates like Input pin', () => {
    const b = newCircuit();
    b.add('button', 'btn');
    b.add('output', 'p');
    b.wire(b.port('btn', 'out'), b.port('p', 'in'));
    const circuit = b.build();
    circuit.sim.settle();
    expect(classify(portValue(circuit, b.port('p', 'in')))).toBe(0n);
    circuit.sim.setInput(
      { componentId: asComponentId('btn'), portName: 'out' },
      lit(1, 1n),
    );
    circuit.sim.settle();
    expect(classify(portValue(circuit, b.port('p', 'in')))).toBe(1n);
  });

  // The 7-segment primitive has no outputs; we just verify the netlist
  // compiles and the simulator loads it.
  it('7-segment compiles with 8 input ports and produces no diagnostics', () => {
    const b = newCircuit();
    b.add('7seg', 'disp');
    for (const seg of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp']) {
      b.add('input', `pin_${seg}`, { width: 1 });
      b.wire(b.port(`pin_${seg}`, 'out'), b.port('disp', seg));
    }
    const circuit = b.build();
    expect(circuit.compileDiagnostics).toEqual([]);
    // No floating inputs since every segment is driven by an Input pin.
    expect(circuit.sim.diagnostics().some((d) => d.kind === 'floating-input')).toBe(false);
  });
});

// Make signalOps usage explicit so it's not "unused" in this file.
void signalOps;
