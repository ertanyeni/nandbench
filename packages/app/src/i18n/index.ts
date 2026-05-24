/**
 * Tiny i18n helper.
 *
 * Locale defaults to 'en' and is stored in the Zustand store so React
 * components re-render when it flips. `t(key, vars)` substitutes `{name}`
 * placeholders inline. Unknown keys fall back to the EN dictionary so a
 * missing TR translation degrades gracefully — failing tests catch the
 * gap but the user still sees readable text.
 */

import { EN, type EnKey } from './en.js';
import { TR } from './tr.js';

export type Locale = 'en' | 'tr';

const DICTIONARIES: Record<Locale, Record<EnKey, string>> = {
  en: EN as Record<EnKey, string>,
  tr: TR,
};

/** Module-level mirror of the store's locale, kept in sync via setLocale. */
let activeLocale: Locale = 'en';

/** Called by the store on every locale change. */
export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

/**
 * Lookup + substitute. `vars` values are inlined as `String(value)`.
 *
 * Unknown keys fall back to the EN dictionary; if still missing, we
 * return the raw key so a stray reference is visible in the UI rather
 * than swallowed silently.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = DICTIONARIES[activeLocale];
  let template: string | undefined = dict[key as EnKey];
  if (template === undefined) {
    template = (DICTIONARIES.en as Record<string, string>)[key];
  }
  if (template === undefined) return key;
  const out: string = template;
  if (!vars) return out;
  return out.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = vars[name];
    return v === undefined ? `{${name}}` : String(v);
  });
}

export { EN, TR };
export type { EnKey };
