/**
 * Lesson library — structured curriculum for a one-semester undergraduate
 * Digital Logic Design course (the typical CMPE/EEE "Logic Circuits" or
 * "Computer Organization I" syllabus you'd find at most engineering
 * faculties).
 *
 * The path runs from raw number systems → boolean algebra → combinational
 * circuits → sequential building blocks → registers → memory → FSM →
 * a tiny datapath at the end. Each lesson is short on purpose — concept,
 * 4–6 step walkthrough, and (where it makes sense) a template the user
 * can open + experiment with. Some lessons carry a graded challenge.
 *
 * Content (titles / summaries / steps) lives in i18n; this module owns
 * the ordering, the unit grouping, and the template binding.
 */

export type LessonUnit =
  | 'foundations'   // bits, number systems, boolean algebra
  | 'gates'         // gates + minimization
  | 'combinational' // adders, mux, decoder, comparator, ALU primitives
  | 'sequential'    // latches, flip-flops, timing
  | 'registers'     // registers, counters, shift-registers
  | 'memory'        // RAM, ROM, addressable storage
  | 'fsm'           // finite state machines (Moore / Mealy)
  | 'datapath'      // ALU + register file + simple CPU
  | 'beyond';       // hazards, pipelining hints, tooling

export interface Lesson {
  readonly id: string;
  readonly unit: LessonUnit;
  readonly titleKey: string;
  readonly summaryKey: string;
  readonly stepKeys: readonly string[];
  /** Template id to "Open" — must exist in TEMPLATES (see fixtures/templates.ts). */
  readonly templateId?: string;
}

/** Generate `lesson.<prefix>.stepN` keys without typing each one. */
function steps(prefix: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `lesson.${prefix}.step${i + 1}`);
}

export const LESSONS: readonly Lesson[] = [
  /* ---------- Unit 1: Foundations ---------- */
  {
    id: 'bits',
    unit: 'foundations',
    titleKey: 'lesson.bits.title',
    summaryKey: 'lesson.bits.summary',
    stepKeys: steps('bits', 3),
    templateId: 'half-adder',
  },
  {
    id: 'number-systems',
    unit: 'foundations',
    titleKey: 'lesson.numberSystems.title',
    summaryKey: 'lesson.numberSystems.summary',
    stepKeys: steps('numberSystems', 5),
  },
  {
    id: 'binary-arith',
    unit: 'foundations',
    titleKey: 'lesson.binaryArith.title',
    summaryKey: 'lesson.binaryArith.summary',
    stepKeys: steps('binaryArith', 5),
  },
  {
    id: 'twos-complement',
    unit: 'foundations',
    titleKey: 'lesson.twosComplement.title',
    summaryKey: 'lesson.twosComplement.summary',
    stepKeys: steps('twosComplement', 5),
  },
  {
    id: 'boolean-algebra',
    unit: 'foundations',
    titleKey: 'lesson.booleanAlgebra.title',
    summaryKey: 'lesson.booleanAlgebra.summary',
    stepKeys: steps('booleanAlgebra', 5),
  },
  {
    id: 'demorgan',
    unit: 'foundations',
    titleKey: 'lesson.demorgan.title',
    summaryKey: 'lesson.demorgan.summary',
    stepKeys: steps('demorgan', 4),
  },

  /* ---------- Unit 2: Gates ---------- */
  {
    id: 'gates',
    unit: 'gates',
    titleKey: 'lesson.gates.title',
    summaryKey: 'lesson.gates.summary',
    stepKeys: steps('gates', 4),
    templateId: 'empty',
  },
  {
    id: 'universal-gates',
    unit: 'gates',
    titleKey: 'lesson.universalGates.title',
    summaryKey: 'lesson.universalGates.summary',
    stepKeys: steps('universalGates', 5),
  },
  {
    id: 'truth-table',
    unit: 'gates',
    titleKey: 'lesson.truthTable.title',
    summaryKey: 'lesson.truthTable.summary',
    stepKeys: steps('truthTable', 4),
  },
  {
    id: 'sop-pos',
    unit: 'gates',
    titleKey: 'lesson.sopPos.title',
    summaryKey: 'lesson.sopPos.summary',
    stepKeys: steps('sopPos', 5),
  },
  {
    id: 'karnaugh',
    unit: 'gates',
    titleKey: 'lesson.karnaugh.title',
    summaryKey: 'lesson.karnaugh.summary',
    stepKeys: steps('karnaugh', 6),
  },

  /* ---------- Unit 3: Combinational building blocks ---------- */
  {
    id: 'half-adder',
    unit: 'combinational',
    titleKey: 'lesson.halfAdder.title',
    summaryKey: 'lesson.halfAdder.summary',
    stepKeys: steps('halfAdder', 4),
    templateId: 'half-adder',
  },
  {
    id: 'full-adder',
    unit: 'combinational',
    titleKey: 'lesson.fullAdder.title',
    summaryKey: 'lesson.fullAdder.summary',
    stepKeys: steps('fullAdder', 4),
    templateId: 'full-adder',
  },
  {
    id: 'ripple-adder',
    unit: 'combinational',
    titleKey: 'lesson.rippleAdder.title',
    summaryKey: 'lesson.rippleAdder.summary',
    stepKeys: steps('rippleAdder', 5),
  },
  {
    id: 'subtractor',
    unit: 'combinational',
    titleKey: 'lesson.subtractor.title',
    summaryKey: 'lesson.subtractor.summary',
    stepKeys: steps('subtractor', 4),
  },
  {
    id: 'comparator',
    unit: 'combinational',
    titleKey: 'lesson.comparator.title',
    summaryKey: 'lesson.comparator.summary',
    stepKeys: steps('comparator', 4),
  },
  {
    id: 'decoder',
    unit: 'combinational',
    titleKey: 'lesson.decoder.title',
    summaryKey: 'lesson.decoder.summary',
    stepKeys: steps('decoder', 5),
  },
  {
    id: 'encoder',
    unit: 'combinational',
    titleKey: 'lesson.encoder.title',
    summaryKey: 'lesson.encoder.summary',
    stepKeys: steps('encoder', 4),
  },
  {
    id: 'mux',
    unit: 'combinational',
    titleKey: 'lesson.mux.title',
    summaryKey: 'lesson.mux.summary',
    stepKeys: steps('mux', 5),
    templateId: 'mux-2to1',
  },
  {
    id: 'demux',
    unit: 'combinational',
    titleKey: 'lesson.demux.title',
    summaryKey: 'lesson.demux.summary',
    stepKeys: steps('demux', 4),
  },
  {
    id: 'tri-state',
    unit: 'combinational',
    titleKey: 'lesson.triState.title',
    summaryKey: 'lesson.triState.summary',
    stepKeys: steps('triState', 4),
  },

  /* ---------- Unit 4: Sequential elements ---------- */
  {
    id: 'sr-latch',
    unit: 'sequential',
    titleKey: 'lesson.srLatch.title',
    summaryKey: 'lesson.srLatch.summary',
    stepKeys: steps('srLatch', 5),
    templateId: 'sr-latch',
  },
  {
    id: 'd-latch',
    unit: 'sequential',
    titleKey: 'lesson.dLatch.title',
    summaryKey: 'lesson.dLatch.summary',
    stepKeys: steps('dLatch', 4),
  },
  {
    id: 'd-flip-flop',
    unit: 'sequential',
    titleKey: 'lesson.dFlipFlop.title',
    summaryKey: 'lesson.dFlipFlop.summary',
    stepKeys: steps('dFlipFlop', 5),
  },
  {
    id: 'jk-flip-flop',
    unit: 'sequential',
    titleKey: 'lesson.jkFlipFlop.title',
    summaryKey: 'lesson.jkFlipFlop.summary',
    stepKeys: steps('jkFlipFlop', 4),
    templateId: 'jk-flip-flop',
  },
  {
    id: 't-flip-flop',
    unit: 'sequential',
    titleKey: 'lesson.tFlipFlop.title',
    summaryKey: 'lesson.tFlipFlop.summary',
    stepKeys: steps('tFlipFlop', 4),
  },
  {
    id: 'clock',
    unit: 'sequential',
    titleKey: 'lesson.clock.title',
    summaryKey: 'lesson.clock.summary',
    stepKeys: steps('clock', 4),
    templateId: 'clock-blink',
  },
  {
    id: 'timing',
    unit: 'sequential',
    titleKey: 'lesson.timing.title',
    summaryKey: 'lesson.timing.summary',
    stepKeys: steps('timing', 5),
  },

  /* ---------- Unit 5: Registers, counters, shift registers ---------- */
  {
    id: 'register',
    unit: 'registers',
    titleKey: 'lesson.register.title',
    summaryKey: 'lesson.register.summary',
    stepKeys: steps('register', 4),
  },
  {
    id: 'shift-register',
    unit: 'registers',
    titleKey: 'lesson.shiftRegister.title',
    summaryKey: 'lesson.shiftRegister.summary',
    stepKeys: steps('shiftRegister', 5),
  },
  {
    id: 'counter',
    unit: 'registers',
    titleKey: 'lesson.counter.title',
    summaryKey: 'lesson.counter.summary',
    stepKeys: steps('counter', 4),
    templateId: 'counter-led',
  },
  {
    id: 'mod-n-counter',
    unit: 'registers',
    titleKey: 'lesson.modNCounter.title',
    summaryKey: 'lesson.modNCounter.summary',
    stepKeys: steps('modNCounter', 4),
  },
  {
    id: 'ring-counter',
    unit: 'registers',
    titleKey: 'lesson.ringCounter.title',
    summaryKey: 'lesson.ringCounter.summary',
    stepKeys: steps('ringCounter', 4),
  },

  /* ---------- Unit 6: Memory ---------- */
  {
    id: 'rom',
    unit: 'memory',
    titleKey: 'lesson.rom.title',
    summaryKey: 'lesson.rom.summary',
    stepKeys: steps('rom', 5),
    templateId: 'rom-toy',
  },
  {
    id: 'ram',
    unit: 'memory',
    titleKey: 'lesson.ram.title',
    summaryKey: 'lesson.ram.summary',
    stepKeys: steps('ram', 5),
  },
  {
    id: 'address-decoding',
    unit: 'memory',
    titleKey: 'lesson.addressDecoding.title',
    summaryKey: 'lesson.addressDecoding.summary',
    stepKeys: steps('addressDecoding', 4),
  },

  /* ---------- Unit 7: Finite state machines ---------- */
  {
    id: 'fsm-intro',
    unit: 'fsm',
    titleKey: 'lesson.fsmIntro.title',
    summaryKey: 'lesson.fsmIntro.summary',
    stepKeys: steps('fsmIntro', 5),
    templateId: 'fsm-toy',
  },
  {
    id: 'moore-vs-mealy',
    unit: 'fsm',
    titleKey: 'lesson.mooreMealy.title',
    summaryKey: 'lesson.mooreMealy.summary',
    stepKeys: steps('mooreMealy', 5),
  },
  {
    id: 'fsm-design',
    unit: 'fsm',
    titleKey: 'lesson.fsmDesign.title',
    summaryKey: 'lesson.fsmDesign.summary',
    stepKeys: steps('fsmDesign', 6),
  },
  {
    id: 'state-encoding',
    unit: 'fsm',
    titleKey: 'lesson.stateEncoding.title',
    summaryKey: 'lesson.stateEncoding.summary',
    stepKeys: steps('stateEncoding', 4),
  },

  /* ---------- Unit 8: Datapath + simple CPU ---------- */
  {
    id: 'alu',
    unit: 'datapath',
    titleKey: 'lesson.alu.title',
    summaryKey: 'lesson.alu.summary',
    stepKeys: steps('alu', 5),
    templateId: 'alu-skeleton',
  },
  {
    id: 'register-file',
    unit: 'datapath',
    titleKey: 'lesson.registerFile.title',
    summaryKey: 'lesson.registerFile.summary',
    stepKeys: steps('registerFile', 5),
    templateId: 'register-file',
  },
  {
    id: 'datapath-intro',
    unit: 'datapath',
    titleKey: 'lesson.datapathIntro.title',
    summaryKey: 'lesson.datapathIntro.summary',
    stepKeys: steps('datapathIntro', 5),
  },
  {
    id: 'control-unit',
    unit: 'datapath',
    titleKey: 'lesson.controlUnit.title',
    summaryKey: 'lesson.controlUnit.summary',
    stepKeys: steps('controlUnit', 5),
  },

  /* ---------- Unit 9: Beyond / engineering notes ---------- */
  {
    id: 'hazards',
    unit: 'beyond',
    titleKey: 'lesson.hazards.title',
    summaryKey: 'lesson.hazards.summary',
    stepKeys: steps('hazards', 4),
  },
  {
    id: 'pipeline',
    unit: 'beyond',
    titleKey: 'lesson.pipeline.title',
    summaryKey: 'lesson.pipeline.summary',
    stepKeys: steps('pipeline', 4),
  },
  {
    id: 'tooling',
    unit: 'beyond',
    titleKey: 'lesson.tooling.title',
    summaryKey: 'lesson.tooling.summary',
    stepKeys: steps('tooling', 4),
  },
];

/** Ordered list of unit ids — used by the LessonsPanel to group items. */
export const UNIT_ORDER: readonly LessonUnit[] = [
  'foundations',
  'gates',
  'combinational',
  'sequential',
  'registers',
  'memory',
  'fsm',
  'datapath',
  'beyond',
];
