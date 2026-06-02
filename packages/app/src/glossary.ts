/**
 * Glossary registry — every term a beginner (or forgetful expert) might
 * want to look up while building circuits. Terms are grouped into
 * pedagogical categories so the panel renders as a structured manual,
 * not a flat blob. The strings themselves live in i18n.
 *
 * Adding a term:
 *   1. Pick a category from `GlossaryCategory`.
 *   2. Add `term('id', 'category')` to GLOSSARY below.
 *   3. Add `glossary.term.<id>.name` and `…desc` entries to en.ts + tr.ts.
 */

export type GlossaryCategory =
  | 'foundations'
  | 'gates'
  | 'combinational'
  | 'sequential'
  | 'timing'
  | 'memory'
  | 'fsm'
  | 'tooling';

export interface GlossaryTerm {
  readonly id: string;
  readonly nameKey: string;
  readonly descKey: string;
  readonly category: GlossaryCategory;
}

/** Order of categories as rendered in the panel. */
export const GLOSSARY_CATEGORIES: readonly GlossaryCategory[] = [
  'foundations',
  'gates',
  'combinational',
  'sequential',
  'timing',
  'memory',
  'fsm',
  'tooling',
];

/** i18n key for each category header. */
export const CATEGORY_LABEL_KEYS: Readonly<Record<GlossaryCategory, string>> = {
  foundations: 'glossary.cat.foundations',
  gates: 'glossary.cat.gates',
  combinational: 'glossary.cat.combinational',
  sequential: 'glossary.cat.sequential',
  timing: 'glossary.cat.timing',
  memory: 'glossary.cat.memory',
  fsm: 'glossary.cat.fsm',
  tooling: 'glossary.cat.tooling',
};

function term(id: string, category: GlossaryCategory): GlossaryTerm {
  return {
    id,
    nameKey: `glossary.term.${id}.name`,
    descKey: `glossary.term.${id}.desc`,
    category,
  };
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  /* ----- foundations ----- */
  term('bit', 'foundations'),
  term('bus', 'foundations'),
  term('width', 'foundations'),
  term('endian', 'foundations'),
  term('signed', 'foundations'),
  term('twosComplement', 'foundations'),
  term('bcd', 'foundations'),
  term('gray', 'foundations'),
  term('hex', 'foundations'),
  term('binary', 'foundations'),
  term('overflow', 'foundations'),
  term('x', 'foundations'),
  term('z', 'foundations'),

  /* ----- gates ----- */
  term('gate', 'gates'),
  term('inverter', 'gates'),
  term('buffer', 'gates'),
  term('and', 'gates'),
  term('or', 'gates'),
  term('xor', 'gates'),
  term('nand', 'gates'),
  term('nor', 'gates'),
  term('xnor', 'gates'),
  term('universalGate', 'gates'),
  term('booleanAlgebra', 'gates'),
  term('demorgan', 'gates'),
  term('sop', 'gates'),
  term('pos', 'gates'),
  term('karnaugh', 'gates'),
  term('dontCare', 'gates'),
  term('minterm', 'gates'),
  term('maxterm', 'gates'),
  term('literal', 'gates'),
  term('truthTable', 'gates'),

  /* ----- combinational ----- */
  term('combinational', 'combinational'),
  term('halfAdder', 'combinational'),
  term('fullAdder', 'combinational'),
  term('rippleCarry', 'combinational'),
  term('carryLookahead', 'combinational'),
  term('subtractor', 'combinational'),
  term('comparator', 'combinational'),
  term('mux', 'combinational'),
  term('demux', 'combinational'),
  term('decoder', 'combinational'),
  term('encoder', 'combinational'),
  term('priorityEncoder', 'combinational'),
  term('splitter', 'combinational'),
  term('tunnel', 'combinational'),
  term('triState', 'combinational'),
  term('alu', 'combinational'),

  /* ----- sequential ----- */
  term('sequential', 'sequential'),
  term('latch', 'sequential'),
  term('flipFlop', 'sequential'),
  term('dFlipFlop', 'sequential'),
  term('jkFlipFlop', 'sequential'),
  term('tFlipFlop', 'sequential'),
  term('srLatch', 'sequential'),
  term('edge', 'sequential'),
  term('clock', 'sequential'),
  term('enable', 'sequential'),
  term('reset', 'sequential'),
  term('preset', 'sequential'),

  /* ----- timing ----- */
  term('setupTime', 'timing'),
  term('holdTime', 'timing'),
  term('propagationDelay', 'timing'),
  term('clockSkew', 'timing'),
  term('metastability', 'timing'),
  term('glitch', 'timing'),
  term('hazard', 'timing'),
  term('oscillation', 'timing'),

  /* ----- memory ----- */
  term('register', 'memory'),
  term('shiftRegister', 'memory'),
  term('counter', 'memory'),
  term('ram', 'memory'),
  term('rom', 'memory'),
  term('addressDecode', 'memory'),
  term('readWriteEnable', 'memory'),

  /* ----- fsm ----- */
  term('fsm', 'fsm'),
  term('moore', 'fsm'),
  term('mealy', 'fsm'),
  term('stateTransition', 'fsm'),
  term('stateDiagram', 'fsm'),

  /* ----- tooling ----- */
  term('driver', 'tooling'),
  term('sink', 'tooling'),
  term('net', 'tooling'),
  term('netlist', 'tooling'),
  term('snapshot', 'tooling'),
  term('diagnostic', 'tooling'),
  term('multiDriver', 'tooling'),
  term('fanout', 'tooling'),
  term('composite', 'tooling'),
];
