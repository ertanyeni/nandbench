/**
 * Educational starter circuits — shown in the New Circuit picker.
 *
 * Every template builds a CircuitDocument programmatically using the same
 * `getShape`/`lRoute` helpers the editor uses at runtime, so wires land on
 * real pin world positions and don't drift if shape sizes change.
 *
 * Templates that intentionally rely on the user pressing a Button (SR latch,
 * FSM toy, ROM) will surface floating-input *sim-time* diagnostics until
 * the user drives the relevant pins — that's pedagogical, not a bug.
 */

import { asComponentId, type ComponentParams, type PortRef } from '@gatecraft/engine';
import {
  asWireId,
  type CircuitDocument,
  type VisualComponent,
  type VisualWire,
} from '../model/document.js';
import { getShape, pinWorldPosition } from '../model/kinds.js';
import { routeOrthogonal, type PinSide } from '../model/routing.js';
import { fullAdderDocument } from './full-adder.js';

export interface Template {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly build: () => CircuitDocument;
}

/* --------------------- builder helpers --------------------- */

let wireSeq = 0;
const wid = (prefix: string): string => `${prefix}_${++wireSeq}`;

function c(
  id: string,
  kind: string,
  position: { x: number; y: number },
  params: ComponentParams = {},
  rotation: 0 | 90 | 180 | 270 = 0,
): VisualComponent {
  return {
    id: asComponentId(id),
    kind,
    params,
    position,
    rotation,
  };
}

function w(from: [string, string], to: [string, string], comps: readonly VisualComponent[]): VisualWire {
  const a: PortRef = { componentId: asComponentId(from[0]), portName: from[1] };
  const b: PortRef = { componentId: asComponentId(to[0]), portName: to[1] };
  const aComp = comps.find((x) => x.id === a.componentId);
  const bComp = comps.find((x) => x.id === b.componentId);
  if (!aComp || !bComp) {
    throw new Error(`template wire: missing component ${from[0]} or ${to[0]}`);
  }
  const aShape = getShape(aComp.kind, aComp.params);
  const bShape = getShape(bComp.kind, bComp.params);
  const ap = pinWorldPosition(aComp.position, aShape, from[1]);
  const bp = pinWorldPosition(bComp.position, bShape, to[1]);
  const aSide = (aShape.pins.find((p) => p.name === from[1])?.side ?? 'right') as PinSide;
  const bSide = (bShape.pins.find((p) => p.name === to[1])?.side ?? 'left') as PinSide;
  return {
    id: asWireId(wid('wt')),
    endpoints: [a, b],
    path: routeOrthogonal(ap, bp, aSide, bSide),
  };
}

function build(comps: VisualComponent[], wires: VisualWire[]): CircuitDocument {
  return { components: comps, wires };
}

/* --------------------- templates --------------------- */

function buildEmpty(): CircuitDocument {
  return { components: [], wires: [] };
}

function buildHalfAdder(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('a', 'input', { x: 60, y: 80 }, { width: 1, name: 'A' }),
    c('b', 'input', { x: 60, y: 160 }, { width: 1, name: 'B' }),
    c('xor', 'xor', { x: 240, y: 60 }, { width: 1, inputs: 2 }),
    c('and', 'and', { x: 240, y: 200 }, { width: 1, inputs: 2 }),
    c('sum', 'output', { x: 420, y: 85 }, { width: 1, name: 'sum' }),
    c('cout', 'output', { x: 420, y: 225 }, { width: 1, name: 'cout' }),
  ];
  const wires: VisualWire[] = [
    w(['a', 'out'], ['xor', 'in0'], comps),
    w(['b', 'out'], ['xor', 'in1'], comps),
    w(['a', 'out'], ['and', 'in0'], comps),
    w(['b', 'out'], ['and', 'in1'], comps),
    w(['xor', 'out'], ['sum', 'in'], comps),
    w(['and', 'out'], ['cout', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildFullAdder(): CircuitDocument {
  // Clone the canonical fixture so each call returns a fresh doc.
  return {
    components: fullAdderDocument.components.map((cc) => ({ ...cc, params: { ...cc.params } })),
    wires: fullAdderDocument.wires.map((ww) => ({ ...ww, path: ww.path.map((p) => ({ ...p })) })),
  };
}

function buildSrLatch(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('s', 'button', { x: 60, y: 80 }, { name: 'S' }),
    c('r', 'button', { x: 60, y: 220 }, { name: 'R' }),
    c('n1', 'nor', { x: 260, y: 60 }, { width: 1, inputs: 2 }),
    c('n2', 'nor', { x: 260, y: 200 }, { width: 1, inputs: 2 }),
    c('q', 'output', { x: 460, y: 85 }, { width: 1, name: 'Q' }),
    c('qbar', 'output', { x: 460, y: 225 }, { width: 1, name: 'Q̄' }),
  ];
  const wires: VisualWire[] = [
    w(['r', 'out'], ['n1', 'in0'], comps),
    w(['s', 'out'], ['n2', 'in1'], comps),
    w(['n2', 'out'], ['n1', 'in1'], comps),
    w(['n1', 'out'], ['n2', 'in0'], comps),
    w(['n1', 'out'], ['q', 'in'], comps),
    w(['n2', 'out'], ['qbar', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildMux2to1(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('a', 'input', { x: 60, y: 80 }, { width: 1, name: 'A' }),
    c('b', 'input', { x: 60, y: 160 }, { width: 1, name: 'B' }),
    c('sel', 'input', { x: 60, y: 280 }, { width: 1, name: 'sel' }),
    c('m', 'mux', { x: 240, y: 80 }, { width: 1, inputs: 2 }),
    c('y', 'output', { x: 420, y: 125 }, { width: 1, name: 'Y' }),
  ];
  const wires: VisualWire[] = [
    w(['a', 'out'], ['m', 'in0'], comps),
    w(['b', 'out'], ['m', 'in1'], comps),
    w(['sel', 'out'], ['m', 'sel'], comps),
    w(['m', 'out'], ['y', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildCounterLed(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('clk', 'clock', { x: 60, y: 80 }),
    c('rst0', 'constant', { x: 60, y: 200 }, { width: 1, value: '0' }),
    c('cnt', 'counter', { x: 240, y: 80 }, { width: 4 }),
    c('split', 'splitter', { x: 420, y: 80 }, { width: 4, fanout: 4 }),
    c('l0', 'led', { x: 540, y: 60 }),
    c('l1', 'led', { x: 540, y: 100 }),
    c('l2', 'led', { x: 540, y: 140 }),
    c('l3', 'led', { x: 540, y: 180 }),
  ];
  const wires: VisualWire[] = [
    w(['clk', 'out'], ['cnt', 'en'], comps),
    w(['rst0', 'out'], ['cnt', 'rst'], comps),
    w(['cnt', 'q'], ['split', 'in'], comps),
    w(['split', 'out0'], ['l0', 'in'], comps),
    w(['split', 'out1'], ['l1', 'in'], comps),
    w(['split', 'out2'], ['l2', 'in'], comps),
    w(['split', 'out3'], ['l3', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildClockBlink(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('clk', 'clock', { x: 60, y: 80 }),
    c('en1', 'constant', { x: 60, y: 180 }, { width: 1, value: '1' }),
    c('reg', 'register', { x: 280, y: 80 }, { width: 1 }),
    c('led', 'led', { x: 480, y: 100 }),
  ];
  const wires: VisualWire[] = [
    w(['clk', 'out'], ['reg', 'd'], comps),
    w(['en1', 'out'], ['reg', 'en'], comps),
    w(['reg', 'q'], ['led', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildHexDisplay(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('a', 'input', { x: 60, y: 60 }, { width: 1, name: 'a' }),
    c('b', 'input', { x: 60, y: 110 }, { width: 1, name: 'b' }),
    c('cc', 'input', { x: 60, y: 160 }, { width: 1, name: 'c' }),
    c('d', 'input', { x: 60, y: 210 }, { width: 1, name: 'd' }),
    c('disp', '7seg', { x: 260, y: 60 }),
  ];
  const wires: VisualWire[] = [
    w(['a', 'out'], ['disp', 'a'], comps),
    w(['b', 'out'], ['disp', 'b'], comps),
    w(['cc', 'out'], ['disp', 'c'], comps),
    w(['d', 'out'], ['disp', 'd'], comps),
  ];
  return build(comps, wires);
}

function buildAluSkeleton(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('a', 'input', { x: 60, y: 60 }, { width: 4, name: 'A' }),
    c('b', 'input', { x: 60, y: 140 }, { width: 4, name: 'B' }),
    c('cin', 'input', { x: 60, y: 240 }, { width: 1, name: 'cin' }),
    c('add', 'adder', { x: 240, y: 60 }, { width: 4 }),
    c('or4', 'or', { x: 240, y: 280 }, { width: 4, inputs: 2 }),
    c('sum', 'output', { x: 460, y: 100 }, { width: 4, name: 'SUM' }),
    c('cout', 'output', { x: 460, y: 160 }, { width: 1, name: 'COUT' }),
    c('orout', 'output', { x: 460, y: 300 }, { width: 4, name: 'A|B' }),
  ];
  const wires: VisualWire[] = [
    w(['a', 'out'], ['add', 'a'], comps),
    w(['b', 'out'], ['add', 'b'], comps),
    w(['cin', 'out'], ['add', 'cin'], comps),
    w(['add', 's'], ['sum', 'in'], comps),
    w(['add', 'cout'], ['cout', 'in'], comps),
    w(['a', 'out'], ['or4', 'in0'], comps),
    w(['b', 'out'], ['or4', 'in1'], comps),
    w(['or4', 'out'], ['orout', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildRegisterFilePair(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('clk', 'clock', { x: 60, y: 60 }),
    c('addr', 'input', { x: 60, y: 200 }, { width: 1, name: 'addr' }),
    c('d', 'input', { x: 60, y: 320 }, { width: 4, name: 'D' }),
    c('dec', 'decoder', { x: 240, y: 180 }, { inputs: 1 }),
    c('r0', 'register', { x: 440, y: 80 }, { width: 4 }),
    c('r1', 'register', { x: 440, y: 240 }, { width: 4 }),
    c('q0', 'output', { x: 640, y: 100 }, { width: 4, name: 'Q0' }),
    c('q1', 'output', { x: 640, y: 260 }, { width: 4, name: 'Q1' }),
  ];
  const wires: VisualWire[] = [
    w(['addr', 'out'], ['dec', 'sel'], comps),
    w(['d', 'out'], ['r0', 'd'], comps),
    w(['d', 'out'], ['r1', 'd'], comps),
    w(['clk', 'out'], ['r0', 'en'], comps),
    w(['clk', 'out'], ['r1', 'en'], comps),
    w(['dec', 'out0'], ['r0', 'en'], comps),
    w(['dec', 'out1'], ['r1', 'en'], comps),
    w(['r0', 'q'], ['q0', 'in'], comps),
    w(['r1', 'q'], ['q1', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildFsmToy(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('btn_s', 'button', { x: 60, y: 80 }, { name: 'set' }),
    c('btn_r', 'button', { x: 60, y: 220 }, { name: 'reset' }),
    c('n1', 'nor', { x: 260, y: 60 }, { width: 1, inputs: 2 }),
    c('n2', 'nor', { x: 260, y: 200 }, { width: 1, inputs: 2 }),
    c('led0', 'led', { x: 460, y: 90 }),
    c('led1', 'led', { x: 460, y: 230 }),
  ];
  const wires: VisualWire[] = [
    w(['btn_r', 'out'], ['n1', 'in0'], comps),
    w(['btn_s', 'out'], ['n2', 'in1'], comps),
    w(['n2', 'out'], ['n1', 'in1'], comps),
    w(['n1', 'out'], ['n2', 'in0'], comps),
    w(['n1', 'out'], ['led0', 'in'], comps),
    w(['n2', 'out'], ['led1', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildJkFlipFlop(): CircuitDocument {
  // J + K buttons drive a single JK flip-flop. Q and Q̄ light their own
  // LEDs so the toggle / set / reset / hold cases stay obvious. The
  // engine ticks the clock from the toolbar, so there is no Clock
  // primitive on the canvas.
  const comps: VisualComponent[] = [
    c('j', 'button', { x: 60, y: 100 }, { name: 'J' }),
    c('k', 'button', { x: 60, y: 220 }, { name: 'K' }),
    c('ff', 'jk-flipflop', { x: 240, y: 110 }, {}),
    c('q', 'output', { x: 460, y: 110 }, { width: 1, name: 'Q' }),
    c('qbar', 'output', { x: 460, y: 200 }, { width: 1, name: 'Q̄' }),
  ];
  const wires: VisualWire[] = [
    w(['j', 'out'], ['ff', 'j'], comps),
    w(['k', 'out'], ['ff', 'k'], comps),
    w(['ff', 'q'], ['q', 'in'], comps),
    w(['ff', 'qn'], ['qbar', 'in'], comps),
  ];
  return build(comps, wires);
}

function buildRomToy(): CircuitDocument {
  // 2-bit address picks one of four constants via a mux. The decoder gives
  // a one-hot select but `mux` here uses the raw 2-bit address directly.
  const comps: VisualComponent[] = [
    c('addr', 'input', { x: 60, y: 200 }, { width: 2, name: 'addr' }),
    c('k0', 'constant', { x: 60, y: 60 }, { width: 4, value: '0xA' }),
    c('k1', 'constant', { x: 60, y: 110 }, { width: 4, value: '0x5' }),
    c('k2', 'constant', { x: 60, y: 160 }, { width: 4, value: '0xF' }),
    c('k3', 'constant', { x: 60, y: 230 }, { width: 4, value: '0x3' }),
    c('m', 'mux', { x: 280, y: 90 }, { width: 4, inputs: 4 }),
    c('q', 'output', { x: 500, y: 140 }, { width: 4, name: 'data' }),
  ];
  const wires: VisualWire[] = [
    w(['k0', 'out'], ['m', 'in0'], comps),
    w(['k1', 'out'], ['m', 'in1'], comps),
    w(['k2', 'out'], ['m', 'in2'], comps),
    w(['k3', 'out'], ['m', 'in3'], comps),
    w(['addr', 'out'], ['m', 'sel'], comps),
    w(['m', 'out'], ['q', 'in'], comps),
  ];
  return build(comps, wires);
}

/**
 * Three-state Mealy traffic light. State is held in two D flip-flops
 * (state 00 = red, 01 = green, 10 = yellow). A go input advances the
 * state; the outputs are driven directly by the state bits + the
 * current input (Mealy). Pedagogical, not a complete TL controller.
 */
function buildFsm3StateMealy(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('go', 'button', { x: 60, y: 80 }, { name: 'go' }),
    c('en', 'button', { x: 60, y: 160 }, { name: 'en' }),
    c('s1', 'register', { x: 240, y: 80 }, { width: 1, name: 's1' }),
    c('s0', 'register', { x: 240, y: 200 }, { width: 1, name: 's0' }),
    c('red', 'led', { x: 440, y: 60 }, { name: 'red' }),
    c('grn', 'led', { x: 440, y: 140 }, { name: 'green' }),
    c('ylw', 'led', { x: 440, y: 220 }, { name: 'yellow' }),
  ];
  const wires: VisualWire[] = [
    w(['go', 'out'], ['s1', 'd'], comps),
    w(['go', 'out'], ['s0', 'd'], comps),
    w(['en', 'out'], ['s1', 'en'], comps),
    w(['en', 'out'], ['s0', 'en'], comps),
    w(['s1', 'q'], ['red', 'in'], comps),
    w(['s0', 'q'], ['grn', 'in'], comps),
    w(['s1', 'q'], ['ylw', 'in'], comps),
  ];
  return build(comps, wires);
}

/**
 * 4-bit ALU skeleton — bundles an adder, AND, OR, and XOR, with a 2-bit
 * opcode selecting between them via a multiplexer. Single-bit version
 * for layout clarity; widening to 4 bits is the obvious next step.
 */
function buildAlu4Bit(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('a', 'input', { x: 40, y: 80 }, { width: 4, name: 'A' }),
    c('b', 'input', { x: 40, y: 160 }, { width: 4, name: 'B' }),
    c('op', 'input', { x: 40, y: 260 }, { width: 2, name: 'op' }),
    c('addr', 'adder', { x: 240, y: 60 }, { width: 4 }),
    c('and1', 'and', { x: 240, y: 180 }, { width: 4, inputs: 2 }),
    c('or1', 'or', { x: 240, y: 260 }, { width: 4, inputs: 2 }),
    c('xor1', 'xor', { x: 240, y: 340 }, { width: 4, inputs: 2 }),
    c('mux', 'mux', { x: 460, y: 200 }, { width: 4, inputs: 4 }),
    c('y', 'output', { x: 640, y: 200 }, { width: 4, name: 'Y' }),
    c('cout', 'output', { x: 640, y: 100 }, { width: 1, name: 'carry' }),
  ];
  const wires: VisualWire[] = [
    w(['a', 'out'], ['addr', 'a'], comps),
    w(['b', 'out'], ['addr', 'b'], comps),
    w(['a', 'out'], ['and1', 'in0'], comps),
    w(['b', 'out'], ['and1', 'in1'], comps),
    w(['a', 'out'], ['or1', 'in0'], comps),
    w(['b', 'out'], ['or1', 'in1'], comps),
    w(['a', 'out'], ['xor1', 'in0'], comps),
    w(['b', 'out'], ['xor1', 'in1'], comps),
    w(['addr', 's'], ['mux', 'in0'], comps),
    w(['and1', 'out'], ['mux', 'in1'], comps),
    w(['or1', 'out'], ['mux', 'in2'], comps),
    w(['xor1', 'out'], ['mux', 'in3'], comps),
    w(['op', 'out'], ['mux', 'sel'], comps),
    w(['addr', 'cout'], ['cout', 'in'], comps),
    w(['mux', 'out'], ['y', 'in'], comps),
  ];
  return build(comps, wires);
}

/**
 * One-tab CPU skeleton: two 4-bit registers feeding an ALU, ALU
 * output written back into one of the registers on the next clock
 * edge. Not a complete CPU — no instruction decode, no memory — but
 * it shows the regfile→ALU→writeback loop that every datapath has.
 */
function buildCpuSkeleton(): CircuitDocument {
  const comps: VisualComponent[] = [
    c('din', 'input', { x: 40, y: 80 }, { width: 4, name: 'din' }),
    c('op', 'input', { x: 40, y: 240 }, { width: 1, name: 'op' }),
    c('wen', 'button', { x: 40, y: 380 }, { name: 'wen' }),
    c('regA', 'register', { x: 240, y: 80 }, { width: 4, name: 'regA' }),
    c('regB', 'register', { x: 240, y: 200 }, { width: 4, name: 'regB' }),
    c('alu_add', 'adder', { x: 460, y: 100 }, { width: 4 }),
    c('alu_and', 'and', { x: 460, y: 200 }, { width: 4, inputs: 2 }),
    c('alu_mux', 'mux', { x: 660, y: 140 }, { width: 4, inputs: 2 }),
    c('y', 'output', { x: 860, y: 140 }, { width: 4, name: 'Y' }),
  ];
  const wires: VisualWire[] = [
    w(['din', 'out'], ['regA', 'd'], comps),
    w(['din', 'out'], ['regB', 'd'], comps),
    w(['wen', 'out'], ['regA', 'en'], comps),
    w(['regA', 'q'], ['alu_add', 'a'], comps),
    w(['regB', 'q'], ['alu_add', 'b'], comps),
    w(['regA', 'q'], ['alu_and', 'in0'], comps),
    w(['regB', 'q'], ['alu_and', 'in1'], comps),
    w(['alu_add', 's'], ['alu_mux', 'in0'], comps),
    w(['alu_and', 'out'], ['alu_mux', 'in1'], comps),
    w(['op', 'out'], ['alu_mux', 'sel'], comps),
    w(['alu_mux', 'out'], ['y', 'in'], comps),
  ];
  return build(comps, wires);
}

/* --------------------- registry --------------------- */

export const TEMPLATES: readonly Template[] = [
  { id: 'empty', nameKey: 'templates.empty.name', descriptionKey: 'templates.empty.description', build: buildEmpty },
  { id: 'half-adder', nameKey: 'templates.halfAdder.name', descriptionKey: 'templates.halfAdder.description', build: buildHalfAdder },
  { id: 'full-adder', nameKey: 'templates.fullAdder.name', descriptionKey: 'templates.fullAdder.description', build: buildFullAdder },
  { id: 'sr-latch', nameKey: 'templates.srLatch.name', descriptionKey: 'templates.srLatch.description', build: buildSrLatch },
  { id: 'jk-flip-flop', nameKey: 'templates.jkFlipFlop.name', descriptionKey: 'templates.jkFlipFlop.description', build: buildJkFlipFlop },
  { id: 'mux-2to1', nameKey: 'templates.mux2to1.name', descriptionKey: 'templates.mux2to1.description', build: buildMux2to1 },
  { id: 'counter-led', nameKey: 'templates.counterLed.name', descriptionKey: 'templates.counterLed.description', build: buildCounterLed },
  { id: 'clock-blink', nameKey: 'templates.clockBlink.name', descriptionKey: 'templates.clockBlink.description', build: buildClockBlink },
  { id: 'hex-display', nameKey: 'templates.hexDisplay.name', descriptionKey: 'templates.hexDisplay.description', build: buildHexDisplay },
  { id: 'alu-skeleton', nameKey: 'templates.aluSkeleton.name', descriptionKey: 'templates.aluSkeleton.description', build: buildAluSkeleton },
  { id: 'register-file', nameKey: 'templates.registerFile.name', descriptionKey: 'templates.registerFile.description', build: buildRegisterFilePair },
  { id: 'fsm-toy', nameKey: 'templates.fsmToy.name', descriptionKey: 'templates.fsmToy.description', build: buildFsmToy },
  { id: 'rom-toy', nameKey: 'templates.romToy.name', descriptionKey: 'templates.romToy.description', build: buildRomToy },
  { id: 'fsm-3state-mealy', nameKey: 'templates.fsm3StateMealy.name', descriptionKey: 'templates.fsm3StateMealy.description', build: buildFsm3StateMealy },
  { id: 'alu-4bit', nameKey: 'templates.alu4Bit.name', descriptionKey: 'templates.alu4Bit.description', build: buildAlu4Bit },
  { id: 'cpu-skeleton', nameKey: 'templates.cpuSkeleton.name', descriptionKey: 'templates.cpuSkeleton.description', build: buildCpuSkeleton },
];
