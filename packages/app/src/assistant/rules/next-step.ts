/**
 * Next-step rules — "what should I add now?" guidance based on the
 * shape of the half-finished circuit. These rules degrade gracefully:
 *
 *   - Empty canvas        → onboarding card (lessons / templates / tour)
 *   - 1 component         → suggest its complement (input → gate, gate → output)
 *   - Many components, no wires → "wire them up"
 *   - All wired, not running → "press play"
 *
 * The list is intentionally short — assistant pollution is worse than
 * silence. Patterns / diagnostics / quality fire on top.
 */

import { t } from '../../i18n/index.js';
import { componentsByKind, isEmptyDocument } from '../types.js';
import type { AssistantRule } from '../types.js';

/* ----------------------- empty canvas onboarding -------------------- */

const emptyCanvasRule: AssistantRule = {
  id: 'next.empty',
  priority: 100, // very high — the canvas is blank, this should be the first card
  category: 'onboarding',
  run(ctx) {
    if (!isEmptyDocument(ctx.document)) return null;
    return {
      id: 'next.empty',
      priority: 100,
      category: 'onboarding',
      title: t('assistant.next.empty.title'),
      body: t('assistant.next.empty.body'),
      actions: [
        { kind: 'open-tour', label: t('assistant.action.startTour') },
        { kind: 'open-lessons', label: t('assistant.action.openLessons') },
        { kind: 'open-template', templateId: 'half-adder', label: t('assistant.action.openHalfAdder') },
      ],
    };
  },
};

/* ----------------------- input-only — add a gate -------------------- */

const inputOnlyRule: AssistantRule = {
  id: 'next.inputOnly',
  priority: 70,
  category: 'nextStep',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const inputCount = byKind.get('input')?.length ?? 0;
    const totalNonIo = ctx.document.components.filter(
      (c) => c.kind !== 'input' && c.kind !== 'output' && c.kind !== 'led',
    ).length;
    if (inputCount === 0 || totalNonIo > 0) return null;
    return {
      id: 'next.inputOnly',
      priority: 70,
      category: 'nextStep',
      title: t('assistant.next.inputOnly.title'),
      body: t('assistant.next.inputOnly.body'),
      actions: [
        { kind: 'place-kind', componentKind: 'and', label: t('assistant.action.placeAnd') },
        { kind: 'place-kind', componentKind: 'or', label: t('assistant.action.placeOr') },
        { kind: 'place-kind', componentKind: 'not', label: t('assistant.action.placeNot') },
      ],
    };
  },
};

/* ----------------------- gate without I/O --------------------------- */

const gateWithoutIoRule: AssistantRule = {
  id: 'next.gateNoIo',
  priority: 72,
  category: 'nextStep',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const hasInput = (byKind.get('input')?.length ?? 0) > 0;
    const hasOutput =
      (byKind.get('output')?.length ?? 0) > 0 ||
      (byKind.get('led')?.length ?? 0) > 0 ||
      (byKind.get('probe')?.length ?? 0) > 0;
    const gateCount =
      (byKind.get('and')?.length ?? 0) +
      (byKind.get('or')?.length ?? 0) +
      (byKind.get('not')?.length ?? 0) +
      (byKind.get('xor')?.length ?? 0) +
      (byKind.get('nand')?.length ?? 0) +
      (byKind.get('nor')?.length ?? 0) +
      (byKind.get('xnor')?.length ?? 0);
    if (gateCount === 0) return null;
    if (hasInput && hasOutput) return null;
    return {
      id: 'next.gateNoIo',
      priority: 72,
      category: 'nextStep',
      title: t(hasInput ? 'assistant.next.needsOutput.title' : 'assistant.next.needsInput.title'),
      body: t(hasInput ? 'assistant.next.needsOutput.body' : 'assistant.next.needsInput.body'),
      actions: hasInput
        ? [
            { kind: 'place-kind', componentKind: 'output', label: t('assistant.action.placeOutput') },
            { kind: 'place-kind', componentKind: 'led', label: t('assistant.action.placeLed') },
          ]
        : [
            { kind: 'place-kind', componentKind: 'input', label: t('assistant.action.placeInput') },
            { kind: 'place-kind', componentKind: 'button', label: t('assistant.action.placeButton') },
          ],
    };
  },
};

/* ----------------------- components but no wires -------------------- */

const noWiresRule: AssistantRule = {
  id: 'next.noWires',
  priority: 68,
  category: 'nextStep',
  run(ctx) {
    if (ctx.document.components.length < 2) return null;
    if (ctx.document.wires.length > 0) return null;
    return {
      id: 'next.noWires',
      priority: 68,
      category: 'nextStep',
      title: t('assistant.next.noWires.title'),
      body: t('assistant.next.noWires.body'),
      actions: [
        { kind: 'open-tour', label: t('assistant.action.startTour') },
      ],
    };
  },
};

/* ----------------------- wired but paused --------------------------- */

const readyToRunRule: AssistantRule = {
  id: 'next.readyToRun',
  priority: 55,
  category: 'nextStep',
  run(ctx) {
    if (ctx.running) return null;
    if (ctx.document.wires.length < 2) return null;
    if (ctx.diagnostics.length > 0) return null;
    return {
      id: 'next.readyToRun',
      priority: 55,
      category: 'nextStep',
      title: t('assistant.next.readyToRun.title'),
      body: t('assistant.next.readyToRun.body'),
    };
  },
};

export const NEXT_STEP_RULES: readonly AssistantRule[] = [
  emptyCanvasRule,
  inputOnlyRule,
  gateWithoutIoRule,
  noWiresRule,
  readyToRunRule,
];
