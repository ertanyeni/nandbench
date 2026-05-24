/**
 * Rule engine — pure function that runs every registered rule against a
 * single context snapshot and returns a ranked list of responses.
 *
 * The engine is deliberately stateless: every assistant render passes a
 * fresh context and gets a fresh list. Cards in the UI re-key on response
 * `id`, so identical rules across renders produce stable React keys.
 */

import { ALL_RULES } from './rules/index.js';
import type { AssistantContext, AssistantResponse, AssistantRule } from './types.js';

export interface AssistantEvaluation {
  /** Responses sorted by priority (high → low). */
  readonly responses: readonly AssistantResponse[];
  /** Convenience grouping by category. Same responses, partitioned. */
  readonly byCategory: ReadonlyMap<string, readonly AssistantResponse[]>;
}

export function evaluateAssistant(
  ctx: AssistantContext,
  rules: readonly AssistantRule[] = ALL_RULES,
): AssistantEvaluation {
  const collected: AssistantResponse[] = [];
  for (const rule of rules) {
    let out: ReturnType<AssistantRule['run']>;
    try {
      out = rule.run(ctx);
    } catch (e) {
      // A faulty rule must never crash the assistant — degrade gracefully.
      // eslint-disable-next-line no-console
      console.warn(`assistant rule ${rule.id} threw`, e);
      continue;
    }
    if (!out) continue;
    if (Array.isArray(out)) collected.push(...out);
    else collected.push(out as AssistantResponse);
  }
  // Stable order: priority desc, then id asc for determinism.
  const sorted = [...collected].sort((a, b) =>
    a.priority === b.priority ? a.id.localeCompare(b.id) : b.priority - a.priority,
  );
  const byCategory = new Map<string, AssistantResponse[]>();
  for (const r of sorted) {
    let bucket = byCategory.get(r.category);
    if (!bucket) {
      bucket = [];
      byCategory.set(r.category, bucket);
    }
    bucket.push(r);
  }
  return { responses: sorted, byCategory };
}
