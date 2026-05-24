import { describe, expect, it } from 'vitest';
import { lit } from '../src/index.js';
import { buildHarness, classify, newCircuit, portValue } from './helpers.js';

describe('Sequential — 4-bit counter', () => {
  // d = q + 1 ; en = 1 ; q is the count.
  // We don't have an ADD primitive, so we drive `d` externally with the next
  // value and observe `q` after each clock. This still proves the sequential
  // contract: q reflects state on combinational eval; state latches on tick.
  it('Register holds value; latches on tickClock when en=1', () => {
    const h = buildHarness(
      { d: 4, en: 1 },
      { q: 4 },
      (c, r) => {
        c.add('register', 'reg', { width: 4 });
        c.wire(r.in.d!, c.port('reg', 'd'));
        c.wire(r.in.en!, c.port('reg', 'en'));
        c.wire(c.port('reg', 'q'), r.probe.q!);
      },
    );
    h.setBits('en', 1);
    h.setBits('d', 0b0101);
    // Before any clock, q is the initial state (0).
    expect(h.observe('q')).toBe(0n);
    h.tickClock();
    expect(h.observe('q')).toBe(0b0101n);
    h.setBits('d', 0b1100);
    expect(h.observe('q')).toBe(0b0101n); // changing d doesn't change q
    h.tickClock();
    expect(h.observe('q')).toBe(0b1100n);
  });

  it('en=0 prevents latching', () => {
    const h = buildHarness(
      { d: 4, en: 1 },
      { q: 4 },
      (c, r) => {
        c.add('register', 'reg', { width: 4 });
        c.wire(r.in.d!, c.port('reg', 'd'));
        c.wire(r.in.en!, c.port('reg', 'en'));
        c.wire(c.port('reg', 'q'), r.probe.q!);
      },
    );
    h.setBits('en', 1);
    h.setBits('d', 0b1010);
    h.tickClock();
    expect(h.observe('q')).toBe(0b1010n);

    h.setBits('en', 0);
    h.setBits('d', 0b0000);
    h.tickClock();
    expect(h.observe('q')).toBe(0b1010n); // held
  });

  it('counter (q XOR 1 fed back into d, 1-bit) toggles every clock', () => {
    // The smallest self-incrementing circuit we can build with primitives.
    // d = NOT q  ; en = 1  ; expect q to flip on each tick.
    const h = buildHarness(
      { en: 1 },
      { q: 1 },
      (c, r) => {
        c.add('register', 'reg', { width: 1 });
        c.add('not', 'inv', { width: 1 });
        c.wire(c.port('reg', 'q'), c.port('inv', 'in'));
        c.wire(c.port('inv', 'out'), c.port('reg', 'd'));
        c.wire(r.in.en!, c.port('reg', 'en'));
        c.wire(c.port('reg', 'q'), r.probe.q!);
      },
    );
    h.setBits('en', 1);
    expect(h.observe('q')).toBe(0n);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
    h.tickClock();
    expect(h.observe('q')).toBe(1n);
    h.tickClock();
    expect(h.observe('q')).toBe(0n);
  });
});

describe('Multi-driver resolution', () => {
  it('two driving Input pins with conflicting values mark the bit as X (multi-driver diagnostic)', () => {
    const b = newCircuit();
    b.add('input', 'in0', { width: 1 });
    b.add('input', 'in1', { width: 1 });
    b.add('output', 'probe', { width: 1 });
    // Two drivers on the same net.
    b.wire(b.port('in0', 'out'), b.port('probe', 'in'));
    b.wire(b.port('in1', 'out'), b.port('probe', 'in'));
    const circuit = b.build();
    circuit.sim.setInput({ componentId: b.port('in0', 'out').componentId, portName: 'out' }, lit(1, 0n));
    circuit.sim.setInput({ componentId: b.port('in1', 'out').componentId, portName: 'out' }, lit(1, 1n));
    circuit.sim.settle();

    expect(classify(portValue(circuit, b.port('probe', 'in')))).toBe('X');
    const diags = circuit.sim.diagnostics();
    expect(diags.some((d) => d.kind === 'multi-driver')).toBe(true);
  });

  it('two drivers in agreement do NOT raise multi-driver', () => {
    const b = newCircuit();
    b.add('input', 'in0', { width: 1 });
    b.add('input', 'in1', { width: 1 });
    b.add('output', 'probe', { width: 1 });
    b.wire(b.port('in0', 'out'), b.port('probe', 'in'));
    b.wire(b.port('in1', 'out'), b.port('probe', 'in'));
    const circuit = b.build();
    circuit.sim.setInput({ componentId: b.port('in0', 'out').componentId, portName: 'out' }, lit(1, 1n));
    circuit.sim.setInput({ componentId: b.port('in1', 'out').componentId, portName: 'out' }, lit(1, 1n));
    circuit.sim.settle();

    expect(classify(portValue(circuit, b.port('probe', 'in')))).toBe(1n);
    const diags = circuit.sim.diagnostics();
    expect(diags.some((d) => d.kind === 'multi-driver')).toBe(false);
  });
});

describe('Oscillation guard', () => {
  it('combinational NOT feedback converges to X (not stuck in an infinite loop)', () => {
    // out = NOT out  has no defined fixed point. With four-valued logic,
    // the engine correctly resolves the indeterminacy to X and stops.
    const b = newCircuit();
    b.add('not', 'inv', { width: 1 });
    b.wire(b.port('inv', 'out'), b.port('inv', 'in'));
    const circuit = b.build();
    const result = circuit.sim.settle();
    expect(result.stable).toBe(true);
    expect(classify(portValue(circuit, b.port('inv', 'out')))).toBe('X');
  });

  it('a long combinational chain exceeds the cap when settle() budget is too tight', () => {
    // 20 NOT gates wired in series + an input pin. With a cap of 5 delta
    // cycles, settle() can't reach steady state, so it must report
    // stable=false and emit an oscillation diagnostic naming dirty nets.
    const N = 20;
    const b = newCircuit();
    b.add('input', 'src', { width: 1 });
    for (let i = 0; i < N; i++) b.add('not', `inv${i}`, { width: 1 });
    b.wire(b.port('src', 'out'), b.port('inv0', 'in'));
    for (let i = 1; i < N; i++) {
      b.wire(b.port(`inv${i - 1}`, 'out'), b.port(`inv${i}`, 'in'));
    }
    const circuit = b.build();
    const result = circuit.sim.settle(5);
    expect(result.stable).toBe(false);
    expect(result.oscillatingNets.length).toBeGreaterThan(0);
    expect(circuit.sim.diagnostics().some((d) => d.kind === 'oscillation')).toBe(true);
  });
});

describe('Width-mismatch diagnostic (compile time)', () => {
  it('an 8-bit pin wired to a 1-bit pin raises width-mismatch on compile', () => {
    const b = newCircuit();
    b.add('input', 'big', { width: 8 });
    b.add('not', 'inv', { width: 1 });
    b.wire(b.port('big', 'out'), b.port('inv', 'in'));
    const circuit = b.build();
    expect(circuit.compileDiagnostics.some((d) => d.kind === 'width-mismatch')).toBe(true);
  });
});

describe('Floating input diagnostic', () => {
  it('an undriven input port shows up as floating-input', () => {
    const b = newCircuit();
    b.add('not', 'inv', { width: 1 });
    b.add('output', 'probe', { width: 1 });
    // inv.in is unconnected to any driver.
    b.wire(b.port('inv', 'out'), b.port('probe', 'in'));
    const circuit = b.build();
    expect(circuit.sim.diagnostics().some((d) => d.kind === 'floating-input')).toBe(true);
  });
});
