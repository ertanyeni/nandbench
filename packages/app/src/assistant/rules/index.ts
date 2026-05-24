import { CONCEPT_RULES } from './concepts.js';
import { CURRICULUM_RULES } from './curriculum.js';
import { DIAGNOSTIC_RULES } from './diagnostics.js';
import { NEXT_STEP_RULES } from './next-step.js';
import { PATTERN_RULES } from './patterns.js';
import { QUALITY_RULES } from './quality.js';
import type { AssistantRule } from '../types.js';

export const ALL_RULES: readonly AssistantRule[] = [
  ...NEXT_STEP_RULES,
  ...DIAGNOSTIC_RULES,
  ...PATTERN_RULES,
  ...CONCEPT_RULES,
  ...QUALITY_RULES,
  ...CURRICULUM_RULES,
];
