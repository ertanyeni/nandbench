/**
 * Curriculum progress tracker — remembers which lessons the user has
 * opened or whose challenge they've passed, and suggests the next
 * unfinished lesson.
 *
 * Persistence is via localStorage so it survives reloads. The format is a
 * single JSON blob keyed by `STORAGE_KEY`; old keys are ignored.
 */

import { LESSONS } from './lessons.js';

const STORAGE_KEY = 'gatecraft:curriculum:v1';

interface CurriculumState {
  /** Lesson ids the user has actively opened. */
  readonly opened: readonly string[];
  /** Lesson ids whose challenge passed (where one exists). */
  readonly completed: readonly string[];
}

function load(): CurriculumState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { opened: [], completed: [] };
    const parsed = JSON.parse(raw) as Partial<CurriculumState>;
    return {
      opened: Array.isArray(parsed.opened) ? parsed.opened.filter((s) => typeof s === 'string') : [],
      completed: Array.isArray(parsed.completed)
        ? parsed.completed.filter((s) => typeof s === 'string')
        : [],
    };
  } catch {
    return { opened: [], completed: [] };
  }
}

function save(state: CurriculumState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function markLessonOpened(lessonId: string): void {
  const state = load();
  if (state.opened.includes(lessonId)) return;
  save({ ...state, opened: [...state.opened, lessonId] });
}

export function markLessonCompleted(lessonId: string): void {
  const state = load();
  if (state.completed.includes(lessonId)) return;
  save({ ...state, completed: [...state.completed, lessonId] });
}

export function unmarkLessonCompleted(lessonId: string): void {
  const state = load();
  if (!state.completed.includes(lessonId)) return;
  save({ ...state, completed: state.completed.filter((id) => id !== lessonId) });
}

export function readCurriculum(): CurriculumState {
  return load();
}

/**
 * Return the first lesson in LESSONS' canonical order that the user
 * hasn't completed yet. If everything is completed, returns null —
 * graduated.
 */
export function nextLesson(): { id: string; titleKey: string } | null {
  const { completed } = load();
  for (const l of LESSONS) {
    if (!completed.includes(l.id)) return { id: l.id, titleKey: l.titleKey };
  }
  return null;
}
