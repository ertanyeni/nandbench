import { describe, expect, it } from 'vitest';
import { TEMPLATES } from '../src/fixtures/templates.js';
import { EN, TR } from '../src/i18n/index.js';
import { LESSONS } from '../src/lessons.js';

describe('Lesson library', () => {
  it('every lesson has a unique id', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every i18n key referenced by a lesson exists in both EN and TR', () => {
    const allKeys: string[] = [];
    for (const l of LESSONS) {
      allKeys.push(l.titleKey, l.summaryKey, ...l.stepKeys);
    }
    const missingEn = allKeys.filter((k) => !(k in EN));
    const missingTr = allKeys.filter((k) => !(k in TR));
    expect(missingEn, `missing in EN: ${missingEn.join(', ')}`).toEqual([]);
    expect(missingTr, `missing in TR: ${missingTr.join(', ')}`).toEqual([]);
  });

  it('every templateId reference resolves to a real template', () => {
    const tplIds = new Set(TEMPLATES.map((t) => t.id));
    for (const l of LESSONS) {
      if (l.templateId) {
        expect(tplIds.has(l.templateId), `lesson ${l.id} → template ${l.templateId}`).toBe(true);
      }
    }
  });

  it('every lesson has at least one step', () => {
    for (const l of LESSONS) {
      expect(l.stepKeys.length, `lesson ${l.id} has no steps`).toBeGreaterThan(0);
    }
  });
});
