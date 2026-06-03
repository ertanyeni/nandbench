/**
 * Document model — the canonical state of an open circuit.
 *
 * Per ARCHITECTURE.md we keep three concerns physically separate:
 *   - Logical graph    (component instances + how their ports connect)
 *   - Visual model     (positions, rotations, wire waypoints)
 *   - Simulation state (resolved net values — produced by the engine; NOT
 *                       part of the document)
 *
 * Both logical and visual data are UUID-keyed (CLAUDE.md golden rule #4).
 * The document is plain serializable JSON so persistence and Yjs retrofit
 * remain trivial.
 *
 * For Faz 1 the document is hand-authored in code; the user-facing editor
 * lands in Faz 2.
 */

import type { ComponentId, ComponentParams, PortRef } from '@nandbench/engine';

export type WireId = string & { readonly __brand: 'WireId' };

export const asWireId = (s: string): WireId => s as WireId;

/** World-space point. World units == 1 pixel at zoom = 1. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Visual + logical descriptor for a placed component. The `kind` and `params`
 * are what the engine's net compiler will read; `position` and `rotation` are
 * for the renderer only.
 */
export interface VisualComponent {
  readonly id: ComponentId;
  readonly kind: string;
  readonly params: ComponentParams;
  position: Point;
  /** Multiples of 90°. v1 always 0; reserved so we don't have to retrofit. */
  rotation: 0 | 90 | 180 | 270;
}

/**
 * A wire connecting two PortRefs along an orthogonal (Manhattan) path.
 * The path is the sequence of corner points in world space, starting at the
 * source pin and ending at the sink pin. v1 wires are authored manually;
 * auto-routing is explicitly deferred (ROADMAP.md "deliberately deferred").
 */
export interface VisualWire {
  readonly id: WireId;
  readonly endpoints: readonly [PortRef, PortRef];
  readonly path: readonly Point[];
}

export interface CircuitDocument {
  readonly components: readonly VisualComponent[];
  readonly wires: readonly VisualWire[];
}

export const emptyDocument: CircuitDocument = { components: [], wires: [] };
