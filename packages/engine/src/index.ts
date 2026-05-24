// Public engine surface. Renderer/UI imports MUST go through this file only.
// The engine has zero React/DOM dependencies (CLAUDE.md golden rule #5).

export * from './types.js';
export {
  signalOps,
  bitAnd,
  bitOr,
  bitXor,
  bitNot,
  isHigh,
  bitIsOne,
  bitIsZero,
  lit,
} from './signal.js';
export { createRegistry } from './registry.js';
export {
  registerPrimitives,
  // Gates
  andGate,
  orGate,
  notGate,
  xorGate,
  nandGate,
  norGate,
  xnorGate,
  bufferGate,
  // Plexers
  muxGate,
  demux,
  decoder,
  // Arithmetic
  adder,
  subtractor,
  comparator,
  // Memory / sequential
  registerComponent,
  type RegisterState,
  counter,
  type CounterState,
  shiftRegister,
  type ShiftRegisterState,
  // Wiring / sources
  inputPin,
  type InputState,
  outputPin,
  constantSource,
  clockSource,
  type ClockState,
  splitter,
  tunnel,
  // I/O
  button,
  type ButtonState,
  led,
  sevenSegment,
} from './primitives/index.js';
export { compileNetlist, type NetlistInput, type CompileResult } from './netlist.js';
export { createSimulator } from './simulator.js';
export { UnionFind } from './union-find.js';
