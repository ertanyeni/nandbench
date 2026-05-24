import { describe, expect, it } from 'vitest';
import { EN, setActiveLocale, t, TR } from '../src/i18n/index.js';

describe('i18n', () => {
  it('TR has every EN key', () => {
    const missing: string[] = [];
    for (const k of Object.keys(EN)) {
      if ((TR as Record<string, string | undefined>)[k] === undefined) missing.push(k);
    }
    expect(missing, `missing TR keys: ${missing.join(', ')}`).toEqual([]);
  });

  it('substitutes {vars}', () => {
    setActiveLocale('en');
    expect(t('inspector.multiSelected', { n: 3 })).toBe('3 components selected');
    expect(t('statusBar.pan', { x: 12, y: 34 })).toBe('pan 12, 34');
  });

  it('falls back to EN for unknown locale keys (defensive)', () => {
    setActiveLocale('tr');
    // Force a key that wouldn't exist — make sure we get a string back
    // (the raw key) rather than crashing.
    const out = t('this.does.not.exist');
    expect(typeof out).toBe('string');
    expect(out).toBe('this.does.not.exist');
  });

  it('honors locale switch at runtime', () => {
    setActiveLocale('en');
    const en = t('toolbar.export');
    setActiveLocale('tr');
    const tr = t('toolbar.export');
    expect(en).not.toBe(tr);
    setActiveLocale('en');
  });
});
