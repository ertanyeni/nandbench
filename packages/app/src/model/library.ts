/**
 * Saved-circuit library + interface inference.
 *
 * A SavedCircuit is a frozen snapshot of a document that can be instantiated
 * inside other circuits as a composite component. Its "interface" — the
 * external port set — is auto-derived from the document's Input / Output
 * pins, taken in vertical (top-to-bottom) order.
 *
 * Composites are a pure document-layer concept: the engine never sees a
 * "composite" kind. `netlist-sync.ts` flattens every composite into its
 * saved sub-circuit (with namespaced ids) before invoking compileNetlist.
 * This is why the engine's contract doesn't need to know about hierarchy.
 */

import type { ComponentId, ComponentParams, PortDirection } from '@nandbench/engine';
import type { CircuitDocument, VisualComponent } from './document.js';

export type SavedCircuitId = string & { readonly __brand: 'SavedCircuitId' };

export const asSavedCircuitId = (s: string): SavedCircuitId => s as SavedCircuitId;

export interface CompositePort {
  /** External port name on the composite instance. Stable. */
  readonly name: string;
  readonly direction: PortDirection;
  readonly width: number;
  /** Which inner `input`/`output` component this external port maps to. */
  readonly innerComponentId: ComponentId;
}

export interface SavedCircuit {
  readonly id: SavedCircuitId;
  readonly name: string;
  readonly doc: CircuitDocument;
  readonly inputs: readonly CompositePort[];
  readonly outputs: readonly CompositePort[];
  readonly createdAt: number;
}

/**
 * Walk the document, find every `input` and `output` component, and emit
 * external ports for them in top-to-bottom-then-left-to-right order. The
 * port name uses the component's `name` param if set, otherwise auto-gens
 * `in0` / `out0` etc.
 */
export function inferInterface(doc: CircuitDocument): {
  inputs: CompositePort[];
  outputs: CompositePort[];
} {
  const inputs: VisualComponent[] = [];
  const outputs: VisualComponent[] = [];
  for (const c of doc.components) {
    if (c.kind === 'input' || c.kind === 'button') inputs.push(c);
    else if (c.kind === 'output' || c.kind === 'led') outputs.push(c);
  }
  // Sort by Y then X for predictable port order.
  const byPosition = (a: VisualComponent, b: VisualComponent): number => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y;
    return a.position.x - b.position.x;
  };
  inputs.sort(byPosition);
  outputs.sort(byPosition);

  const named = (c: VisualComponent, fallback: string): string => {
    const n = String(c.params['name'] ?? '').trim();
    return n || fallback;
  };

  return {
    inputs: inputs.map((c, i) => ({
      name: named(c, `in${i}`),
      direction: 'in' as const,
      width: Number(c.params['width'] ?? 1),
      innerComponentId: c.id,
    })),
    outputs: outputs.map((c, i) => ({
      name: named(c, `out${i}`),
      direction: 'out' as const,
      width: Number(c.params['width'] ?? 1),
      innerComponentId: c.id,
    })),
  };
}

/** Build a SavedCircuit from a document snapshot. */
export function snapshotAsSavedCircuit(
  id: SavedCircuitId,
  name: string,
  doc: CircuitDocument,
): SavedCircuit {
  const { inputs, outputs } = inferInterface(doc);
  return { id, name, doc, inputs, outputs, createdAt: Date.now() };
}

/**
 * Params attached to a placed composite instance. The instance refers to
 * a SavedCircuit via `refId`; all behavior is derived from that.
 */
export interface CompositeParams extends ComponentParams {
  refId: string;
}
