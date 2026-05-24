/**
 * Concrete commands. Each is a closed-form (no closures over external state)
 * value so the history list is serializable in principle — useful later for
 * persistence and Yjs.
 */

import type { ComponentId, ComponentParams, PortRef } from '@gatecraft/engine';
import type { CircuitDocument, Point, VisualComponent, VisualWire, WireId } from '../model/document.js';
import type { Command } from './types.js';

export { type Command } from './types.js';

/* ----------------------- AddComponent --------------------------- */

export class AddComponentCommand implements Command {
  readonly label = 'add component';
  constructor(private readonly component: VisualComponent) {}
  apply(doc: CircuitDocument): CircuitDocument {
    return { ...doc, components: [...doc.components, this.component] };
  }
  revert(doc: CircuitDocument): CircuitDocument {
    return {
      ...doc,
      components: doc.components.filter((c) => c.id !== this.component.id),
    };
  }
}

/* ----------------------- AddWire -------------------------------- */

export class AddWireCommand implements Command {
  readonly label = 'add wire';
  constructor(private readonly wire: VisualWire) {}
  apply(doc: CircuitDocument): CircuitDocument {
    return { ...doc, wires: [...doc.wires, this.wire] };
  }
  revert(doc: CircuitDocument): CircuitDocument {
    return { ...doc, wires: doc.wires.filter((w) => w.id !== this.wire.id) };
  }
}

/* ----------------------- MoveComponents ------------------------- */

export interface ComponentMove {
  readonly id: ComponentId;
  readonly from: Point;
  readonly to: Point;
}

/**
 * Translate a set of components + reroute every wire that touches them.
 * Wires that are *fully* incident on moved components translate rigidly;
 * wires that touch only one end re-route as a simple L between the new pin
 * world position and the still-anchored other end.
 *
 * The reroute geometry is captured up front (in `wireUpdates`) so apply()
 * and revert() are pure functions of the doc + this command's data.
 */
export class MoveComponentsCommand implements Command {
  readonly label = 'move';
  constructor(
    private readonly moves: readonly ComponentMove[],
    private readonly wireUpdates: readonly {
      readonly id: WireId;
      readonly from: readonly Point[];
      readonly to: readonly Point[];
    }[],
  ) {}

  apply(doc: CircuitDocument): CircuitDocument {
    return this.transform(doc, true);
  }
  revert(doc: CircuitDocument): CircuitDocument {
    return this.transform(doc, false);
  }

  private transform(doc: CircuitDocument, forward: boolean): CircuitDocument {
    const moveMap = new Map<ComponentId, Point>();
    for (const m of this.moves) moveMap.set(m.id, forward ? m.to : m.from);
    const components = doc.components.map((c) => {
      const p = moveMap.get(c.id);
      return p ? { ...c, position: p } : c;
    });
    const wireMap = new Map<WireId, readonly Point[]>();
    for (const w of this.wireUpdates) wireMap.set(w.id, forward ? w.to : w.from);
    const wires = doc.wires.map((w) => {
      const p = wireMap.get(w.id);
      return p ? { ...w, path: p } : w;
    });
    return { components, wires };
  }
}

/* ----------------------- DeleteSelection ------------------------ */

/**
 * Removes a set of components and every wire that touches them. The whole
 * thing is one undoable unit so Backspace + Undo is symmetric.
 */
export class DeleteCommand implements Command {
  readonly label = 'delete';
  constructor(
    private readonly removedComponents: readonly VisualComponent[],
    private readonly removedWires: readonly VisualWire[],
  ) {}
  apply(doc: CircuitDocument): CircuitDocument {
    const compIds = new Set(this.removedComponents.map((c) => c.id));
    const wireIds = new Set(this.removedWires.map((w) => w.id));
    return {
      components: doc.components.filter((c) => !compIds.has(c.id)),
      wires: doc.wires.filter((w) => !wireIds.has(w.id)),
    };
  }
  revert(doc: CircuitDocument): CircuitDocument {
    // Append removed entities back. Document order changes (they go to the
    // end); for v1 that's acceptable — render order only matters for
    // hit-test priority and the renderer already iterates last-to-first.
    return {
      components: [...doc.components, ...this.removedComponents],
      wires: [...doc.wires, ...this.removedWires],
    };
  }
}

/* ----------------------- RotateComponents ----------------------- */

export interface ComponentRotation {
  readonly id: ComponentId;
  readonly from: 0 | 90 | 180 | 270;
  readonly to: 0 | 90 | 180 | 270;
}

/**
 * Rotate selected components by some multiple of 90° and recompute the
 * paths of every wire incident on them. Same shape as MoveComponentsCommand:
 * both rotation set and wire updates are stored, so apply/revert are pure.
 */
export class RotateComponentsCommand implements Command {
  readonly label = 'rotate';
  constructor(
    private readonly rotations: readonly ComponentRotation[],
    private readonly wireUpdates: readonly {
      readonly id: WireId;
      readonly from: readonly Point[];
      readonly to: readonly Point[];
    }[],
  ) {}

  apply(doc: CircuitDocument): CircuitDocument {
    return this.transform(doc, true);
  }
  revert(doc: CircuitDocument): CircuitDocument {
    return this.transform(doc, false);
  }

  private transform(doc: CircuitDocument, forward: boolean): CircuitDocument {
    const rotMap = new Map<ComponentId, 0 | 90 | 180 | 270>();
    for (const r of this.rotations) rotMap.set(r.id, forward ? r.to : r.from);
    const components = doc.components.map((c) => {
      const r = rotMap.get(c.id);
      return r !== undefined ? { ...c, rotation: r } : c;
    });
    const wireMap = new Map<WireId, readonly Point[]>();
    for (const w of this.wireUpdates) wireMap.set(w.id, forward ? w.to : w.from);
    const wires = doc.wires.map((w) => {
      const p = wireMap.get(w.id);
      return p ? { ...w, path: p } : w;
    });
    return { components, wires };
  }
}

/* ----------------------- UpdateParams --------------------------- */

/**
 * Edit a component's params (width, inputs, value, …). When the new params
 * remove ports (e.g. AND inputs: 4 → 2 drops in2/in3), any incident wire
 * touching the now-missing ports is also dropped — captured in the command
 * for symmetric undo.
 */
export class UpdateParamsCommand implements Command {
  readonly label = 'edit params';
  constructor(
    private readonly componentId: ComponentId,
    private readonly from: ComponentParams,
    private readonly to: ComponentParams,
    private readonly droppedWires: readonly VisualWire[],
  ) {}

  apply(doc: CircuitDocument): CircuitDocument {
    const droppedIds = new Set(this.droppedWires.map((w) => w.id));
    return {
      components: doc.components.map((c) =>
        c.id === this.componentId ? { ...c, params: this.to } : c,
      ),
      wires: doc.wires.filter((w) => !droppedIds.has(w.id)),
    };
  }
  revert(doc: CircuitDocument): CircuitDocument {
    return {
      components: doc.components.map((c) =>
        c.id === this.componentId ? { ...c, params: this.from } : c,
      ),
      wires: [...doc.wires, ...this.droppedWires],
    };
  }
}

/* ----------------------- helpers -------------------------------- */

/** Find every wire that touches any of the given component ids. */
export function wiresTouching(
  doc: CircuitDocument,
  componentIds: ReadonlySet<ComponentId>,
): readonly VisualWire[] {
  return doc.wires.filter((w) => {
    const [a, b]: readonly [PortRef, PortRef] = w.endpoints;
    return componentIds.has(a.componentId) || componentIds.has(b.componentId);
  });
}

/**
 * Find wires that touch a specific (componentId, portName). Used by the
 * inspector to know which wires must be dropped when params change in a
 * way that removes ports.
 */
export function wiresOnPort(
  doc: CircuitDocument,
  componentId: ComponentId,
  portName: string,
): readonly VisualWire[] {
  return doc.wires.filter((w) => {
    const [a, b] = w.endpoints;
    return (
      (a.componentId === componentId && a.portName === portName) ||
      (b.componentId === componentId && b.portName === portName)
    );
  });
}
