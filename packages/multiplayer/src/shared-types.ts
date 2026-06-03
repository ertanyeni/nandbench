/**
 * Local mirror of the few document types we need to read/write Yjs maps.
 * Duplicating them keeps `@nandbench/multiplayer` independent of the app
 * package — both packages settle on the same JSON shape, and the doc
 * round-trip is enforced by the persistence schema tests in the app.
 */

export type Brand<T, B> = T & { readonly __brand: B };
export type ComponentId = Brand<string, 'ComponentId'>;
export type WireId = Brand<string, 'WireId'>;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface PortRef {
  readonly componentId: ComponentId;
  readonly portName: string;
}

export interface VisualComponent {
  readonly id: ComponentId;
  readonly kind: string;
  readonly params: Record<string, unknown>;
  readonly position: Point;
  readonly rotation: 0 | 90 | 180 | 270;
}

export interface VisualWire {
  readonly id: WireId;
  readonly endpoints: readonly [PortRef, PortRef];
  readonly path: readonly Point[];
}

export interface CircuitDocument {
  readonly components: readonly VisualComponent[];
  readonly wires: readonly VisualWire[];
}
