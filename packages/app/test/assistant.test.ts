import { describe, expect, it } from 'vitest';
import { asComponentId } from '@nandbench/engine';
import { ALL_RULES, evaluateAssistant } from '../src/assistant/index.js';
import { CONCEPT_RULES } from '../src/assistant/rules/concepts.js';
import { CURRICULUM_RULES } from '../src/assistant/rules/curriculum.js';
import { DIAGNOSTIC_RULES } from '../src/assistant/rules/diagnostics.js';
import { NEXT_STEP_RULES } from '../src/assistant/rules/next-step.js';
import { PATTERN_RULES } from '../src/assistant/rules/patterns.js';
import { QUALITY_RULES } from '../src/assistant/rules/quality.js';
import { EN, TR } from '../src/i18n/index.js';
import type { CircuitDocument, VisualComponent } from '../src/model/document.js';

function comp(id: string, kind: string, params: Record<string, unknown> = {}): VisualComponent {
  return {
    id: asComponentId(id),
    kind,
    params: params as VisualComponent['params'],
    position: { x: 0, y: 0 },
    rotation: 0,
  };
}

const EMPTY_DOC: CircuitDocument = { components: [], wires: [] };

const baseCtx = {
  library: [],
  diagnostics: [],
  lastPlacedKind: null,
  running: false,
  selectedIds: new Set<string>(),
};

describe('Assistant — rule engine', () => {
  it('empty canvas → onboarding card', () => {
    const e = evaluateAssistant({ ...baseCtx, document: EMPTY_DOC });
    expect(e.responses.some((r) => r.id === 'next.empty')).toBe(true);
    expect(e.byCategory.get('onboarding')?.length).toBeGreaterThan(0);
  });

  it('multi-driver diagnostic fires its dedicated card', () => {
    const e = evaluateAssistant({
      ...baseCtx,
      document: EMPTY_DOC,
      diagnostics: [{ kind: 'multi-driver', net: 'n1' as never, drivers: [] }],
    });
    expect(e.responses.some((r) => r.id === 'diag.multiDriver')).toBe(true);
  });

  it('XOR + AND with few comps → half-adder pattern card', () => {
    const doc: CircuitDocument = {
      components: [comp('x', 'xor'), comp('a', 'and'), comp('i1', 'input'), comp('i2', 'input')],
      wires: [],
    };
    const e = evaluateAssistant({ ...baseCtx, document: doc });
    expect(e.responses.some((r) => r.id === 'pattern.halfAdder')).toBe(true);
  });

  it('full-adder shape outranks half-adder', () => {
    const doc: CircuitDocument = {
      components: [
        comp('x1', 'xor'),
        comp('x2', 'xor'),
        comp('a1', 'and'),
        comp('a2', 'and'),
        comp('o1', 'or'),
      ],
      wires: [],
    };
    const e = evaluateAssistant({ ...baseCtx, document: doc });
    const ids = e.responses.map((r) => r.id);
    expect(ids).toContain('pattern.fullAdder');
    // Full-adder has higher priority than half-adder (68 vs 65)
    const faIdx = ids.indexOf('pattern.fullAdder');
    const haIdx = ids.indexOf('pattern.halfAdder');
    if (haIdx >= 0) expect(faIdx).toBeLessThan(haIdx);
  });

  it('concept card fires when lastPlacedKind is set', () => {
    const e = evaluateAssistant({
      ...baseCtx,
      document: { components: [comp('a', 'and')], wires: [] },
      lastPlacedKind: 'and',
    });
    expect(e.responses.some((r) => r.id === 'concept.and')).toBe(true);
  });

  it('responses sorted by priority desc, id asc for ties', () => {
    const doc: CircuitDocument = {
      components: [comp('x', 'xor'), comp('a', 'and'), comp('i', 'input')],
      wires: [],
    };
    const e = evaluateAssistant({ ...baseCtx, document: doc, lastPlacedKind: 'and' });
    for (let i = 1; i < e.responses.length; i++) {
      const prev = e.responses[i - 1]!;
      const cur = e.responses[i]!;
      expect(prev.priority).toBeGreaterThanOrEqual(cur.priority);
      if (prev.priority === cur.priority) {
        expect(prev.id.localeCompare(cur.id)).toBeLessThanOrEqual(0);
      }
    }
  });
});

describe('Assistant — i18n key coverage', () => {
  // Every titleKey / bodyKey referenced by every rule must resolve in
  // both EN and TR. We don't have static enumeration of every key (rule
  // bodies build them dynamically), but we can drive a known set of
  // contexts through every rule and check the produced title/body are
  // *not* the raw key (t() returns the key on miss).
  const knownKeys = new Set<string>([
    ...Object.keys(EN),
    ...Object.keys(TR),
  ]);

  it('every rule id is unique across the catalog', () => {
    const ids = ALL_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rule-group lengths match the all-rules concatenation', () => {
    expect(ALL_RULES.length).toBe(
      NEXT_STEP_RULES.length +
        DIAGNOSTIC_RULES.length +
        PATTERN_RULES.length +
        CONCEPT_RULES.length +
        QUALITY_RULES.length +
        CURRICULUM_RULES.length,
    );
  });

  it('every assistant.* key in EN has a matching TR key', () => {
    const enAssistantKeys = Object.keys(EN).filter((k) => k.startsWith('assistant.'));
    const missingTr = enAssistantKeys.filter((k) => !(k in TR));
    expect(missingTr, `Missing TR keys: ${missingTr.join(', ')}`).toEqual([]);
    expect(enAssistantKeys.length).toBeGreaterThan(20); // sanity floor
  });

  it('every assistant.* key referenced by a sample rule output resolves', () => {
    // Force the engine into a state that fires every category at least once.
    const doc: CircuitDocument = {
      components: [
        comp('x1', 'xor'),
        comp('x2', 'xor'),
        comp('a1', 'and'),
        comp('a2', 'and'),
        comp('o1', 'or'),
        comp('i1', 'input'),
      ],
      wires: [],
    };
    const e = evaluateAssistant({
      ...baseCtx,
      document: doc,
      lastPlacedKind: 'register',
      diagnostics: [{ kind: 'floating-input', port: { componentId: asComponentId('i1'), portName: 'out' } }],
    });
    for (const r of e.responses) {
      expect(r.title, `title for ${r.id} looks like a raw key`).not.toMatch(/^assistant\./);
      expect(r.body, `body for ${r.id} looks like a raw key`).not.toMatch(/^assistant\./);
    }
  });

  void knownKeys; // silence unused
});
