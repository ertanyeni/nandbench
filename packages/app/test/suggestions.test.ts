import { describe, expect, it } from 'vitest';
import { createRegistry, registerPrimitives } from '@gatecraft/engine';
import { referencedKinds, SUGGESTIONS, suggestionsFor } from '../src/model/suggestions.js';

describe('Suggestions table', () => {
  it('every referenced kind is a real registered primitive', () => {
    const registry = createRegistry();
    registerPrimitives(registry);
    for (const k of referencedKinds()) {
      expect(registry.get(k), `kind "${k}" missing from registry`).toBeDefined();
    }
  });

  it('every list is non-empty except for terminal kinds (led, tunnel self-loop)', () => {
    for (const [k, vs] of Object.entries(SUGGESTIONS)) {
      if (k === 'led') continue; // LEDs are sinks; nothing follows.
      expect(vs.length, `suggestions for ${k} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('composite:* kinds yield a sensible default suggestion list', () => {
    const out = suggestionsFor('composite:my-circuit');
    expect(out).toContain('output');
  });

  it('unknown kinds return an empty list (no throw)', () => {
    expect(suggestionsFor('not-a-real-kind')).toEqual([]);
  });
});
