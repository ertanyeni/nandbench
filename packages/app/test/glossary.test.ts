import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../src/glossary.js';
import { EN, TR } from '../src/i18n/index.js';

describe('Glossary', () => {
  it('every term has a unique id', () => {
    const ids = GLOSSARY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every glossary i18n key exists in both EN and TR', () => {
    const keys: string[] = [];
    for (const g of GLOSSARY) keys.push(g.nameKey, g.descKey);
    const missingEn = keys.filter((k) => !(k in EN));
    const missingTr = keys.filter((k) => !(k in TR));
    expect(missingEn, `missing EN: ${missingEn.join(', ')}`).toEqual([]);
    expect(missingTr, `missing TR: ${missingTr.join(', ')}`).toEqual([]);
  });
});
