/**
 * Rule-based assistant — types only.
 *
 * The assistant inspects the current document, compile/sim diagnostics, and
 * the user's recent actions, then produces a ranked list of educational
 * responses. No LLM, no network: every output is the deterministic result
 * of running a static rule set against a snapshot of editor state.
 *
 * Each rule is a self-contained unit (id, priority, condition, response
 * builder). Rules don't talk to each other; the engine just collects every
 * rule whose condition fires, sorts by priority, and dedupes by category.
 */

import type { CircuitDocument, VisualComponent, VisualWire } from '../model/document.js';
import type { SavedCircuit } from '../model/library.js';
import type { Diagnostic } from '@gatecraft/engine';

/** Snapshot of editor state the rule engine sees. Read-only. */
export interface AssistantContext {
  readonly document: CircuitDocument;
  readonly library: readonly SavedCircuit[];
  readonly diagnostics: readonly Diagnostic[];
  /** The kind of the most recently placed component, or null. */
  readonly lastPlacedKind: string | null;
  /** Whether the user is actively simulating. */
  readonly running: boolean;
  /** Currently selected components — many rules trigger on focused selection. */
  readonly selectedIds: ReadonlySet<string>;
}

/** A rule's surfaced output: a single educational card the UI renders. */
export interface AssistantResponse {
  readonly id: string;
  /** Higher = more important. Engine sorts descending. */
  readonly priority: number;
  /** Visual grouping: nextStep / diagnostic / pattern / concept / quality / onboarding. */
  readonly category: AssistantCategory;
  /** One-line headline shown collapsed. */
  readonly title: string;
  /** Multi-paragraph body, shown when the card is expanded. Markdown-ish. */
  readonly body: string;
  /** Optional CTAs the user can act on directly. */
  readonly actions?: readonly AssistantAction[];
  /** Tags surface as muted chips under the title. */
  readonly tags?: readonly string[];
}

export type AssistantCategory =
  | 'onboarding'
  | 'nextStep'
  | 'diagnostic'
  | 'pattern'
  | 'concept'
  | 'quality';

export type AssistantAction =
  | { readonly kind: 'open-template'; readonly templateId: string; readonly label: string }
  | { readonly kind: 'open-lesson'; readonly lessonId: string; readonly label: string }
  | { readonly kind: 'open-glossary'; readonly termId?: string; readonly label: string }
  | { readonly kind: 'open-lessons'; readonly label: string }
  | { readonly kind: 'open-tour'; readonly label: string }
  | { readonly kind: 'place-kind'; readonly componentKind: string; readonly label: string }
  | { readonly kind: 'select'; readonly componentId: string; readonly label: string };

/** Engine API. Rules are pure functions over context. */
export interface AssistantRule {
  readonly id: string;
  /** Default priority if the rule fires; rules can override with returned response.priority. */
  readonly priority: number;
  readonly category: AssistantCategory;
  /**
   * Run the rule against the given context. Returns one or more responses
   * (or null for "no match"). Multiple responses lets a single rule emit
   * one per diagnostic, one per pattern, etc.
   */
  readonly run: (ctx: AssistantContext) => AssistantResponse | readonly AssistantResponse[] | null;
}

/* ----------------------- Small derived helpers ---------------------- */

/** True if the document has zero components and zero wires. */
export function isEmptyDocument(doc: CircuitDocument): boolean {
  return doc.components.length === 0 && doc.wires.length === 0;
}

/** Group components by kind for fast pattern matching. */
export function componentsByKind(doc: CircuitDocument): ReadonlyMap<string, readonly VisualComponent[]> {
  const out = new Map<string, VisualComponent[]>();
  for (const c of doc.components) {
    let list = out.get(c.kind);
    if (!list) {
      list = [];
      out.set(c.kind, list);
    }
    list.push(c);
  }
  return out;
}

/** All wires incident to the given component id (either endpoint matches). */
export function wiresIncidentTo(doc: CircuitDocument, id: string): readonly VisualWire[] {
  return doc.wires.filter(
    (w) => w.endpoints[0].componentId === id || w.endpoints[1].componentId === id,
  );
}

/** Count diagnostics of each kind, useful for "summary line" rules. */
export function countDiagnostics(diags: readonly Diagnostic[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of diags) out[d.kind] = (out[d.kind] ?? 0) + 1;
  return out;
}
