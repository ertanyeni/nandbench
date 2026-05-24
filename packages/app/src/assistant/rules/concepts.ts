/**
 * Concept tutor rules — when the user *just placed* a non-trivial
 * primitive, emit a "by the way, here's how X works" card. The card is
 * priority-low (so it never shouts over real diagnostics or onboarding)
 * but lives in the dedicated `concept` category so the UI can show a
 * "Learn" feed even when the circuit is fine.
 *
 * Each concept maps a kind → a short body + a glossary cross-ref + the
 * lesson where the concept is taught in depth.
 */

import { t } from '../../i18n/index.js';
import type { AssistantContext, AssistantResponse, AssistantRule } from '../types.js';

interface ConceptCard {
  readonly bodyKey: string;
  readonly titleKey: string;
  readonly tag: string;
  readonly glossaryTerm?: string;
  readonly lessonId?: string;
}

const CONCEPTS: Readonly<Record<string, ConceptCard>> = {
  /* gates */
  and: {
    titleKey: 'assistant.concept.and.title',
    bodyKey: 'assistant.concept.and.body',
    tag: 'AND',
    glossaryTerm: 'gate',
    lessonId: 'gates',
  },
  or: {
    titleKey: 'assistant.concept.or.title',
    bodyKey: 'assistant.concept.or.body',
    tag: 'OR',
    glossaryTerm: 'gate',
    lessonId: 'gates',
  },
  not: {
    titleKey: 'assistant.concept.not.title',
    bodyKey: 'assistant.concept.not.body',
    tag: 'NOT',
    glossaryTerm: 'gate',
    lessonId: 'gates',
  },
  xor: {
    titleKey: 'assistant.concept.xor.title',
    bodyKey: 'assistant.concept.xor.body',
    tag: 'XOR',
    glossaryTerm: 'gate',
    lessonId: 'half-adder',
  },
  nand: {
    titleKey: 'assistant.concept.nand.title',
    bodyKey: 'assistant.concept.nand.body',
    tag: 'NAND',
    glossaryTerm: 'gate',
    lessonId: 'gates',
  },
  /* wiring */
  splitter: {
    titleKey: 'assistant.concept.splitter.title',
    bodyKey: 'assistant.concept.splitter.body',
    tag: 'SPLIT',
    glossaryTerm: 'splitter',
  },
  tunnel: {
    titleKey: 'assistant.concept.tunnel.title',
    bodyKey: 'assistant.concept.tunnel.body',
    tag: 'TUN',
    glossaryTerm: 'tunnel',
  },
  'bit-extender': {
    titleKey: 'assistant.concept.bitExtender.title',
    bodyKey: 'assistant.concept.bitExtender.body',
    tag: 'EXT',
  },
  /* plexers */
  mux: {
    titleKey: 'assistant.concept.mux.title',
    bodyKey: 'assistant.concept.mux.body',
    tag: 'MUX',
    glossaryTerm: 'mux',
  },
  decoder: {
    titleKey: 'assistant.concept.decoder.title',
    bodyKey: 'assistant.concept.decoder.body',
    tag: 'DEC',
  },
  'priority-encoder': {
    titleKey: 'assistant.concept.priorityEncoder.title',
    bodyKey: 'assistant.concept.priorityEncoder.body',
    tag: 'PRI',
  },
  /* arithmetic */
  adder: {
    titleKey: 'assistant.concept.adder.title',
    bodyKey: 'assistant.concept.adder.body',
    tag: 'ADD',
    lessonId: 'half-adder',
  },
  multiplier: {
    titleKey: 'assistant.concept.multiplier.title',
    bodyKey: 'assistant.concept.multiplier.body',
    tag: 'MUL',
  },
  shifter: {
    titleKey: 'assistant.concept.shifter.title',
    bodyKey: 'assistant.concept.shifter.body',
    tag: 'SHIFT',
  },
  /* memory */
  register: {
    titleKey: 'assistant.concept.register.title',
    bodyKey: 'assistant.concept.register.body',
    tag: 'REG',
    glossaryTerm: 'register',
    lessonId: 'clock',
  },
  counter: {
    titleKey: 'assistant.concept.counter.title',
    bodyKey: 'assistant.concept.counter.body',
    tag: 'CNT',
    lessonId: 'counter',
  },
  ram: {
    titleKey: 'assistant.concept.ram.title',
    bodyKey: 'assistant.concept.ram.body',
    tag: 'RAM',
  },
  rom: {
    titleKey: 'assistant.concept.rom.title',
    bodyKey: 'assistant.concept.rom.body',
    tag: 'ROM',
  },
  'd-flipflop': {
    titleKey: 'assistant.concept.dFlipFlop.title',
    bodyKey: 'assistant.concept.dFlipFlop.body',
    tag: 'D-FF',
    glossaryTerm: 'register',
  },
  'jk-flipflop': {
    titleKey: 'assistant.concept.jkFlipFlop.title',
    bodyKey: 'assistant.concept.jkFlipFlop.body',
    tag: 'JK-FF',
  },
  clock: {
    titleKey: 'assistant.concept.clock.title',
    bodyKey: 'assistant.concept.clock.body',
    tag: 'CLK',
    glossaryTerm: 'edge',
    lessonId: 'clock',
  },
  /* tri-state */
  'controlled-buffer': {
    titleKey: 'assistant.concept.controlledBuffer.title',
    bodyKey: 'assistant.concept.controlledBuffer.body',
    tag: 'CBUF',
    glossaryTerm: 'z',
  },
};

function conceptCard(kind: string, priority: number): AssistantResponse | null {
  const c = CONCEPTS[kind];
  if (!c) return null;
  return {
    id: `concept.${kind}`,
    priority,
    category: 'concept',
    title: t(c.titleKey),
    body: t(c.bodyKey),
    tags: [c.tag],
    actions: [
      ...(c.lessonId
        ? [
            {
              kind: 'open-lesson' as const,
              lessonId: c.lessonId,
              label: t('assistant.action.openLesson'),
            },
          ]
        : []),
      ...(c.glossaryTerm
        ? [
            {
              kind: 'open-glossary' as const,
              termId: c.glossaryTerm,
              label: t('assistant.action.openGlossary'),
            },
          ]
        : []),
    ],
  };
}

const conceptForLastPlacedRule: AssistantRule = {
  id: 'concept.lastPlaced',
  priority: 40,
  category: 'concept',
  run(ctx: AssistantContext): AssistantResponse | null {
    if (!ctx.lastPlacedKind) return null;
    return conceptCard(ctx.lastPlacedKind, 40);
  },
};

/**
 * Selection-driven concept card — fires whenever exactly one component
 * is selected, so the user can re-see the tip after switching focus and
 * coming back. Higher priority than the last-placed rule so the card the
 * user is *currently looking at* always wins.
 */
const conceptForSelectionRule: AssistantRule = {
  id: 'concept.selection',
  priority: 45,
  category: 'concept',
  run(ctx: AssistantContext): AssistantResponse | null {
    if (ctx.selectedIds.size !== 1) return null;
    const [id] = ctx.selectedIds;
    const comp = ctx.document.components.find((c) => c.id === id);
    if (!comp) return null;
    return conceptCard(comp.kind, 45);
  },
};

export const CONCEPT_RULES: readonly AssistantRule[] = [
  conceptForSelectionRule,
  conceptForLastPlacedRule,
];
