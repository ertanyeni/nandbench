/**
 * Curriculum rule — suggests the next unfinished lesson when the user
 * is on a clean canvas or has just completed a circuit. Pulls progress
 * from localStorage via [[nextLesson]].
 */

import { nextLesson, readCurriculum } from '../../curriculum.js';
import { t } from '../../i18n/index.js';
import type { AssistantRule } from '../types.js';

const curriculumNextRule: AssistantRule = {
  id: 'curriculum.next',
  priority: 32,
  category: 'onboarding',
  run(_ctx) {
    const next = nextLesson();
    const { completed } = readCurriculum();
    if (!next) {
      // graduated — celebrate once when the last lesson is done
      if (completed.length === 0) return null;
      return {
        id: 'curriculum.graduated',
        priority: 32,
        category: 'onboarding',
        title: t('assistant.curriculum.graduated.title'),
        body: t('assistant.curriculum.graduated.body'),
      };
    }
    return {
      id: 'curriculum.next',
      priority: 32,
      category: 'onboarding',
      title: t('assistant.curriculum.next.title', {
        lesson: t(next.titleKey),
        done: completed.length,
        total: completed.length + 1, // at least one ahead — accurate enough
      }),
      body: t('assistant.curriculum.next.body'),
      tags: ['Lessons'],
      actions: [
        { kind: 'open-lessons', label: t('assistant.action.openLessons') },
      ],
    };
  },
};

export const CURRICULUM_RULES: readonly AssistantRule[] = [curriculumNextRule];
