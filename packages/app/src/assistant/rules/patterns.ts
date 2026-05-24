/**
 * Pattern recognizer rules — look at the kinds of components on the
 * canvas and offer "I think you're building X — here's the canonical
 * shape" cards. Patterns intentionally fire with high priority so they
 * jump out the moment the user lays down the recognisable scaffold.
 *
 * Each pattern includes a worked sketch in the body text + the relevant
 * lesson + an "Open the template" CTA so a student can compare their
 * half-finished circuit against the reference.
 */

import { t } from '../../i18n/index.js';
import { componentsByKind } from '../types.js';
import type { AssistantRule } from '../types.js';

/* ----------------------- half-adder pattern --------------------- */

const halfAdderPatternRule: AssistantRule = {
  id: 'pattern.halfAdder',
  priority: 65,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const xor = byKind.get('xor')?.length ?? 0;
    const and = byKind.get('and')?.length ?? 0;
    // Need at least one XOR + one AND, no full-adder structure yet.
    if (xor < 1 || and < 1) return null;
    if (xor + and > 4) return null; // probably a bigger circuit
    const inputs = byKind.get('input')?.length ?? 0;
    if (inputs > 4) return null;
    return {
      id: 'pattern.halfAdder',
      priority: 65,
      category: 'pattern',
      title: t('assistant.pattern.halfAdder.title'),
      body: t('assistant.pattern.halfAdder.body'),
      tags: ['XOR', 'AND'],
      actions: [
        { kind: 'open-template', templateId: 'half-adder', label: t('assistant.action.openTemplate') },
        { kind: 'open-lesson', lessonId: 'half-adder', label: t('assistant.action.openLesson') },
      ],
    };
  },
};

/* ----------------------- full-adder pattern --------------------- */

const fullAdderPatternRule: AssistantRule = {
  id: 'pattern.fullAdder',
  priority: 68,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const xor = byKind.get('xor')?.length ?? 0;
    const and = byKind.get('and')?.length ?? 0;
    const or_ = byKind.get('or')?.length ?? 0;
    if (xor >= 2 && and >= 2 && or_ >= 1) {
      return {
        id: 'pattern.fullAdder',
        priority: 68,
        category: 'pattern',
        title: t('assistant.pattern.fullAdder.title'),
        body: t('assistant.pattern.fullAdder.body'),
        tags: ['XOR×2', 'AND×2', 'OR'],
        actions: [
          {
            kind: 'open-template',
            templateId: 'full-adder',
            label: t('assistant.action.openTemplate'),
          },
          { kind: 'open-lesson', lessonId: 'full-adder', label: t('assistant.action.openLesson') },
        ],
      };
    }
    return null;
  },
};

/* ----------------------- SR latch pattern ----------------------- */

const srLatchPatternRule: AssistantRule = {
  id: 'pattern.srLatch',
  priority: 65,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const nor_ = byKind.get('nor')?.length ?? 0;
    const nand = byKind.get('nand')?.length ?? 0;
    if (nor_ >= 2 || nand >= 2) {
      return {
        id: 'pattern.srLatch',
        priority: 65,
        category: 'pattern',
        title: t('assistant.pattern.srLatch.title'),
        body: t('assistant.pattern.srLatch.body'),
        tags: nor_ >= 2 ? ['NOR×2'] : ['NAND×2'],
        actions: [
          { kind: 'open-template', templateId: 'sr-latch', label: t('assistant.action.openTemplate') },
          { kind: 'open-glossary', termId: 'register', label: t('assistant.action.openGlossary') },
        ],
      };
    }
    return null;
  },
};

/* ----------------------- clock + register ----------------------- */

const clockRegisterPatternRule: AssistantRule = {
  id: 'pattern.clockRegister',
  priority: 60,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const hasClock = (byKind.get('clock')?.length ?? 0) > 0;
    const hasRegister =
      (byKind.get('register')?.length ?? 0) > 0 ||
      (byKind.get('d-flipflop')?.length ?? 0) > 0 ||
      (byKind.get('counter')?.length ?? 0) > 0;
    if (hasClock && hasRegister) {
      return {
        id: 'pattern.clockRegister',
        priority: 60,
        category: 'pattern',
        title: t('assistant.pattern.clockRegister.title'),
        body: t('assistant.pattern.clockRegister.body'),
        tags: ['CLK', 'REG'],
        actions: [
          { kind: 'open-lesson', lessonId: 'clock', label: t('assistant.action.openLesson') },
          { kind: 'open-glossary', termId: 'edge', label: t('assistant.action.openGlossary') },
        ],
      };
    }
    return null;
  },
};

/* ----------------------- counter + display ---------------------- */

const counterDisplayPatternRule: AssistantRule = {
  id: 'pattern.counterDisplay',
  priority: 62,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const hasCounter = (byKind.get('counter')?.length ?? 0) > 0;
    const hasSplitter = (byKind.get('splitter')?.length ?? 0) > 0;
    const hasLed = (byKind.get('led')?.length ?? 0) >= 2;
    if (hasCounter && hasSplitter && hasLed) {
      return {
        id: 'pattern.counterDisplay',
        priority: 62,
        category: 'pattern',
        title: t('assistant.pattern.counterDisplay.title'),
        body: t('assistant.pattern.counterDisplay.body'),
        tags: ['CNT', 'SPLIT', 'LED×N'],
        actions: [
          { kind: 'open-template', templateId: 'counter-led', label: t('assistant.action.openTemplate') },
          { kind: 'open-lesson', lessonId: 'counter', label: t('assistant.action.openLesson') },
        ],
      };
    }
    return null;
  },
};

/* ----------------------- ripple-carry adder --------------------- */

const rippleCarryRule: AssistantRule = {
  id: 'pattern.rippleCarry',
  priority: 72,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const adders = byKind.get('adder')?.length ?? 0;
    if (adders >= 3) {
      return {
        id: 'pattern.rippleCarry',
        priority: 72,
        category: 'pattern',
        title: t('assistant.pattern.rippleCarry.title', { n: adders }),
        body: t('assistant.pattern.rippleCarry.body'),
        tags: [`ADD×${adders}`],
        actions: [
          { kind: 'open-glossary', termId: 'gate', label: t('assistant.action.openGlossary') },
        ],
      };
    }
    return null;
  },
};

/* ----------------------- Moore / Mealy FSM ---------------------- */

const fsmPatternRule: AssistantRule = {
  id: 'pattern.fsm',
  priority: 66,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const ffCount =
      (byKind.get('d-flipflop')?.length ?? 0) +
      (byKind.get('jk-flipflop')?.length ?? 0) +
      (byKind.get('register')?.length ?? 0);
    const muxCount = byKind.get('mux')?.length ?? 0;
    if (ffCount >= 2 && muxCount >= 1) {
      return {
        id: 'pattern.fsm',
        priority: 66,
        category: 'pattern',
        title: t('assistant.pattern.fsm.title'),
        body: t('assistant.pattern.fsm.body'),
        tags: ['FF×N', 'MUX'],
        actions: [
          { kind: 'open-lesson', lessonId: 'clock', label: t('assistant.action.openLesson') },
        ],
      };
    }
    return null;
  },
};

/* ----------------------- ALU skeleton --------------------------- */

const aluPatternRule: AssistantRule = {
  id: 'pattern.alu',
  priority: 70,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const hasAdder = (byKind.get('adder')?.length ?? 0) > 0;
    const hasSub = (byKind.get('subtractor')?.length ?? 0) > 0;
    const hasMux = (byKind.get('mux')?.length ?? 0) > 0;
    const hasComparator = (byKind.get('comparator')?.length ?? 0) > 0;
    if ((hasAdder || hasSub) && hasMux && hasComparator) {
      return {
        id: 'pattern.alu',
        priority: 70,
        category: 'pattern',
        title: t('assistant.pattern.alu.title'),
        body: t('assistant.pattern.alu.body'),
        tags: ['ADD/SUB', 'MUX', 'CMP'],
      };
    }
    return null;
  },
};

/* ----------------------- decoder → 7-seg ------------------------ */

const decoderDisplayRule: AssistantRule = {
  id: 'pattern.decoderDisplay',
  priority: 60,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const hasDecoder = (byKind.get('decoder')?.length ?? 0) > 0;
    const hasSevenSeg = (byKind.get('7seg')?.length ?? 0) > 0;
    if (hasDecoder && hasSevenSeg) {
      return {
        id: 'pattern.decoderDisplay',
        priority: 60,
        category: 'pattern',
        title: t('assistant.pattern.decoderDisplay.title'),
        body: t('assistant.pattern.decoderDisplay.body'),
        tags: ['DEC', '7-SEG'],
      };
    }
    return null;
  },
};

/* ----------------------- edge detector -------------------------- */

const edgeDetectorRule: AssistantRule = {
  id: 'pattern.edgeDetector',
  priority: 63,
  category: 'pattern',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const hasFF =
      (byKind.get('d-flipflop')?.length ?? 0) > 0 || (byKind.get('register')?.length ?? 0) > 0;
    const hasXor = (byKind.get('xor')?.length ?? 0) > 0;
    const totalComps = ctx.document.components.length;
    if (hasFF && hasXor && totalComps <= 8) {
      return {
        id: 'pattern.edgeDetector',
        priority: 63,
        category: 'pattern',
        title: t('assistant.pattern.edgeDetector.title'),
        body: t('assistant.pattern.edgeDetector.body'),
        tags: ['FF', 'XOR'],
      };
    }
    return null;
  },
};

export const PATTERN_RULES: readonly AssistantRule[] = [
  rippleCarryRule,
  fullAdderPatternRule, // higher priority — strictly more specific than half-adder
  aluPatternRule,
  halfAdderPatternRule,
  fsmPatternRule,
  srLatchPatternRule,
  edgeDetectorRule,
  counterDisplayPatternRule,
  clockRegisterPatternRule,
  decoderDisplayRule,
];
