/**
 * Quality auditor rules — surface stylistic / maintainability hints once
 * the circuit is functional. These never block; they suggest improvements
 * a student should *learn* to reach for, not flag bugs.
 *
 *   - 5+ wires from the same output → "consider a Tunnel for clarity"
 *   - 4+ LEDs on a multi-bit bus → "Splitter + 7-segment cleans this up"
 *   - 8+ identical components → "save this as a Composite"
 */

import { t } from '../../i18n/index.js';
import { componentsByKind, wiresIncidentTo } from '../types.js';
import type { AssistantRule } from '../types.js';

/* ----------------------- fan-out > 5 → tunnel ----------------------- */

const highFanoutRule: AssistantRule = {
  id: 'quality.highFanout',
  priority: 35,
  category: 'quality',
  run(ctx) {
    for (const c of ctx.document.components) {
      // For inputs / constants / clocks, count outgoing wires from `out`.
      if (c.kind !== 'input' && c.kind !== 'constant' && c.kind !== 'clock') continue;
      const out = wiresIncidentTo(ctx.document, c.id).filter(
        (w) =>
          (w.endpoints[0].componentId === c.id && w.endpoints[0].portName === 'out') ||
          (w.endpoints[1].componentId === c.id && w.endpoints[1].portName === 'out'),
      );
      if (out.length >= 5) {
        return {
          id: 'quality.highFanout',
          priority: 35,
          category: 'quality',
          title: t('assistant.quality.highFanout.title', { n: out.length }),
          body: t('assistant.quality.highFanout.body'),
          tags: ['Tunnel'],
          actions: [
            { kind: 'place-kind', componentKind: 'tunnel', label: t('assistant.action.placeTunnel') },
            { kind: 'open-glossary', termId: 'tunnel', label: t('assistant.action.openGlossary') },
          ],
        };
      }
    }
    return null;
  },
};

/* ----------------------- many LEDs → splitter+7-seg ----------------- */

const ledClusterRule: AssistantRule = {
  id: 'quality.ledCluster',
  priority: 30,
  category: 'quality',
  run(ctx) {
    const byKind = componentsByKind(ctx.document);
    const ledCount = byKind.get('led')?.length ?? 0;
    if (ledCount < 4) return null;
    return {
      id: 'quality.ledCluster',
      priority: 30,
      category: 'quality',
      title: t('assistant.quality.ledCluster.title', { n: ledCount }),
      body: t('assistant.quality.ledCluster.body'),
      tags: ['Splitter', '7-SEG'],
      actions: [
        { kind: 'place-kind', componentKind: '7seg', label: t('assistant.action.placeSevenSeg') },
        { kind: 'place-kind', componentKind: 'splitter', label: t('assistant.action.placeSplitter') },
      ],
    };
  },
};

/* ----------------------- repeated structure → composite ------------- */

const repeatedStructureRule: AssistantRule = {
  id: 'quality.repeated',
  priority: 28,
  category: 'quality',
  run(ctx) {
    // 8+ components of the *same* kind beyond IO/LEDs hints at a reusable block.
    const byKind = componentsByKind(ctx.document);
    for (const [kind, list] of byKind) {
      if (kind === 'input' || kind === 'output' || kind === 'led' || kind === 'button') continue;
      if (kind === 'tunnel' || kind === 'splitter') continue;
      if (list.length >= 8) {
        return {
          id: 'quality.repeated',
          priority: 28,
          category: 'quality',
          title: t('assistant.quality.repeated.title', { kind: kind.toUpperCase(), n: list.length }),
          body: t('assistant.quality.repeated.body'),
          tags: ['Composite'],
          actions: [
            { kind: 'open-glossary', termId: 'composite', label: t('assistant.action.openGlossary') },
          ],
        };
      }
    }
    return null;
  },
};

/* ----------------------- composite reuse opportunity --------------- */

const compositeReuseRule: AssistantRule = {
  id: 'quality.compositeReuse',
  priority: 25,
  category: 'quality',
  run(ctx) {
    // The user has saved circuits in the library but isn't using them.
    if (ctx.library.length === 0) return null;
    const placedCompositeIds = new Set<string>();
    for (const c of ctx.document.components) {
      if (c.kind.startsWith('composite:')) {
        const refId = String(c.params['refId'] ?? '');
        if (refId) placedCompositeIds.add(refId);
      }
    }
    const unused = ctx.library.filter((sc) => !placedCompositeIds.has(sc.id));
    if (unused.length === 0) return null;
    const sample = unused[0]!;
    return {
      id: 'quality.compositeReuse',
      priority: 25,
      category: 'quality',
      title: t('assistant.quality.compositeReuse.title', { name: sample.name, n: unused.length }),
      body: t('assistant.quality.compositeReuse.body'),
      tags: ['Library'],
    };
  },
};

export const QUALITY_RULES: readonly AssistantRule[] = [
  highFanoutRule,
  ledClusterRule,
  repeatedStructureRule,
  compositeReuseRule,
];
