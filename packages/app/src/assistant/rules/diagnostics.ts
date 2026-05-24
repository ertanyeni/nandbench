/**
 * Diagnostic explainer rules — one rule per Diagnostic.kind. Each rule
 * fires when the current compile/sim result contains diagnostics of that
 * kind, and emits a single educational card per kind (not per diagnostic
 * instance — we don't want to drown the user in 30 identical floating-
 * input cards). The card includes:
 *
 *   - a plain-language explanation of *why* this diagnostic happens
 *   - a concrete worked example so the user can recognise the pattern
 *     in their own circuit
 *   - the typical fix, with a "place X" action where applicable
 *   - a glossary cross-reference for the underlying concept
 *
 * Priorities are tuned so diagnostic cards sit above pattern hints but
 * below onboarding (an empty-canvas user shouldn't see "fix your wires").
 */

import { t } from '../../i18n/index.js';
import { countDiagnostics } from '../types.js';
import type { AssistantContext, AssistantResponse, AssistantRule } from '../types.js';

/* ------------------------ width-mismatch ------------------------ */

const widthMismatchRule: AssistantRule = {
  id: 'diag.widthMismatch',
  priority: 75,
  category: 'diagnostic',
  run(ctx) {
    const counts = countDiagnostics(ctx.diagnostics);
    const n = counts['width-mismatch'] ?? 0;
    if (n === 0) return null;
    return {
      id: 'diag.widthMismatch',
      priority: 75,
      category: 'diagnostic',
      title: t('assistant.diag.widthMismatch.title', { n }),
      body: t('assistant.diag.widthMismatch.body'),
      tags: ['width-mismatch'],
      actions: [
        { kind: 'open-glossary', termId: 'bit', label: t('assistant.action.openGlossary') },
        { kind: 'open-lesson', lessonId: 'bits', label: t('assistant.action.openLesson') },
      ],
    };
  },
};

/* ------------------------ multi-driver -------------------------- */

const multiDriverRule: AssistantRule = {
  id: 'diag.multiDriver',
  priority: 80,
  category: 'diagnostic',
  run(ctx) {
    const counts = countDiagnostics(ctx.diagnostics);
    const n = counts['multi-driver'] ?? 0;
    if (n === 0) return null;
    return {
      id: 'diag.multiDriver',
      priority: 80,
      category: 'diagnostic',
      title: t('assistant.diag.multiDriver.title', { n }),
      body: t('assistant.diag.multiDriver.body'),
      tags: ['multi-driver'],
      actions: [
        { kind: 'open-glossary', termId: 'multiDriver', label: t('assistant.action.openGlossary') },
        {
          kind: 'place-kind',
          componentKind: 'controlled-buffer',
          label: t('assistant.action.placeControlledBuffer'),
        },
      ],
    };
  },
};

/* ------------------------ oscillation --------------------------- */

const oscillationRule: AssistantRule = {
  id: 'diag.oscillation',
  priority: 85,
  category: 'diagnostic',
  run(ctx) {
    const counts = countDiagnostics(ctx.diagnostics);
    const n = counts['oscillation'] ?? 0;
    if (n === 0) return null;
    return {
      id: 'diag.oscillation',
      priority: 85,
      category: 'diagnostic',
      title: t('assistant.diag.oscillation.title'),
      body: t('assistant.diag.oscillation.body'),
      tags: ['oscillation'],
      actions: [
        { kind: 'open-glossary', termId: 'oscillation', label: t('assistant.action.openGlossary') },
        { kind: 'open-lesson', lessonId: 'clock', label: t('assistant.action.openLessonClock') },
        {
          kind: 'place-kind',
          componentKind: 'register',
          label: t('assistant.action.placeRegister'),
        },
      ],
    };
  },
};

/* ------------------------ floating-input ------------------------ */

const floatingInputRule: AssistantRule = {
  id: 'diag.floatingInput',
  priority: 60,
  category: 'diagnostic',
  run(ctx) {
    const counts = countDiagnostics(ctx.diagnostics);
    const n = counts['floating-input'] ?? 0;
    if (n === 0) return null;
    return {
      id: 'diag.floatingInput',
      priority: 60,
      category: 'diagnostic',
      title: t('assistant.diag.floatingInput.title', { n }),
      body: t('assistant.diag.floatingInput.body'),
      tags: ['floating-input'],
      actions: [
        { kind: 'place-kind', componentKind: 'input', label: t('assistant.action.placeInput') },
        { kind: 'place-kind', componentKind: 'constant', label: t('assistant.action.placeConstant') },
        { kind: 'open-glossary', termId: 'z', label: t('assistant.action.openGlossaryZ') },
      ],
    };
  },
};

/* ------------------------ composite-cycle ----------------------- */

const compositeCycleRule: AssistantRule = {
  id: 'diag.compositeCycle',
  priority: 90,
  category: 'diagnostic',
  run(ctx) {
    const counts = countDiagnostics(ctx.diagnostics);
    if ((counts['composite-cycle'] ?? 0) === 0) return null;
    return {
      id: 'diag.compositeCycle',
      priority: 90,
      category: 'diagnostic',
      title: t('assistant.diag.compositeCycle.title'),
      body: t('assistant.diag.compositeCycle.body'),
      tags: ['composite-cycle'],
      actions: [
        { kind: 'open-glossary', termId: 'composite', label: t('assistant.action.openGlossary') },
      ],
    };
  },
};

const compositeDepthRule: AssistantRule = {
  id: 'diag.compositeDepth',
  priority: 70,
  category: 'diagnostic',
  run(ctx) {
    const counts = countDiagnostics(ctx.diagnostics);
    if ((counts['composite-depth-exceeded'] ?? 0) === 0) return null;
    return {
      id: 'diag.compositeDepth',
      priority: 70,
      category: 'diagnostic',
      title: t('assistant.diag.compositeDepth.title'),
      body: t('assistant.diag.compositeDepth.body'),
      tags: ['composite-depth-exceeded'],
    };
  },
};

/* ------------------------ aggregate summary --------------------- */

/**
 * If there are 3+ diagnostics overall, show a short reassurance card —
 * many simulators surface diagnostics during construction (the half-built
 * circuit naturally has floating inputs etc.). The card teaches the user
 * that diagnostics are a *feature*, not a sign of failure.
 */
const reassureRule: AssistantRule = {
  id: 'diag.reassure',
  priority: 50,
  category: 'diagnostic',
  run(ctx) {
    if (ctx.diagnostics.length < 3) return null;
    // Suppress this when there's a real error type — those get their own card.
    const counts = countDiagnostics(ctx.diagnostics);
    if ((counts['multi-driver'] ?? 0) > 0 || (counts['oscillation'] ?? 0) > 0) return null;
    return {
      id: 'diag.reassure',
      priority: 50,
      category: 'diagnostic',
      title: t('assistant.diag.reassure.title', { n: ctx.diagnostics.length }),
      body: t('assistant.diag.reassure.body'),
    };
  },
};

void ({} as AssistantContext); // silence unused
void ({} as AssistantResponse);

export const DIAGNOSTIC_RULES: readonly AssistantRule[] = [
  widthMismatchRule,
  multiDriverRule,
  oscillationRule,
  floatingInputRule,
  compositeCycleRule,
  compositeDepthRule,
  reassureRule,
];
