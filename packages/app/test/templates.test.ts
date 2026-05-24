import { describe, expect, it } from 'vitest';
import { TEMPLATES } from '../src/fixtures/templates.js';
import { compileDocument } from '../src/model/netlist-sync.js';

describe('Educational templates', () => {
  it('every template builds a document without throwing', () => {
    for (const tpl of TEMPLATES) {
      expect(() => tpl.build(), `template ${tpl.id} should build`).not.toThrow();
    }
  });

  it('every template compiles to a clean netlist (no compile-time diagnostics)', () => {
    for (const tpl of TEMPLATES) {
      const doc = tpl.build();
      const { diagnostics } = compileDocument(doc, []);
      expect(
        diagnostics,
        `template ${tpl.id} produced compile-time diagnostics: ${JSON.stringify(diagnostics)}`,
      ).toEqual([]);
    }
  });

  it('template id list is unique', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
