/**
 * Lesson library — short, structured introductions to digital logic that
 * pair concept with a hands-on template. The Lessons panel renders these
 * in order; each lesson can optionally jump the user into a template so
 * they can wiggle inputs while reading.
 *
 * Content lives in i18n (`lesson.<id>.*` keys); this module only owns the
 * ordering, step count, and template binding.
 */

export interface Lesson {
  readonly id: string;
  readonly titleKey: string;
  readonly summaryKey: string;
  readonly stepKeys: readonly string[];
  /** Template id to "Open" — must exist in TEMPLATES (see fixtures/templates.ts). */
  readonly templateId?: string;
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'bits',
    titleKey: 'lesson.bits.title',
    summaryKey: 'lesson.bits.summary',
    stepKeys: ['lesson.bits.step1', 'lesson.bits.step2', 'lesson.bits.step3'],
    templateId: 'half-adder',
  },
  {
    id: 'gates',
    titleKey: 'lesson.gates.title',
    summaryKey: 'lesson.gates.summary',
    stepKeys: ['lesson.gates.step1', 'lesson.gates.step2', 'lesson.gates.step3'],
    templateId: 'empty',
  },
  {
    id: 'half-adder',
    titleKey: 'lesson.halfAdder.title',
    summaryKey: 'lesson.halfAdder.summary',
    stepKeys: [
      'lesson.halfAdder.step1',
      'lesson.halfAdder.step2',
      'lesson.halfAdder.step3',
    ],
    templateId: 'half-adder',
  },
  {
    id: 'full-adder',
    titleKey: 'lesson.fullAdder.title',
    summaryKey: 'lesson.fullAdder.summary',
    stepKeys: [
      'lesson.fullAdder.step1',
      'lesson.fullAdder.step2',
      'lesson.fullAdder.step3',
    ],
    templateId: 'full-adder',
  },
  {
    id: 'clock',
    titleKey: 'lesson.clock.title',
    summaryKey: 'lesson.clock.summary',
    stepKeys: ['lesson.clock.step1', 'lesson.clock.step2', 'lesson.clock.step3'],
    templateId: 'clock-blink',
  },
  {
    id: 'counter',
    titleKey: 'lesson.counter.title',
    summaryKey: 'lesson.counter.summary',
    stepKeys: ['lesson.counter.step1', 'lesson.counter.step2', 'lesson.counter.step3'],
    templateId: 'counter-led',
  },
];
