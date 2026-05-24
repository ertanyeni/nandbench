/**
 * High-level keyboard shortcuts that operate on the store + worker.
 *
 * Bound at the window level by canvas-controller. Pure functions of the
 * current store state — never touch the DOM directly except to suppress
 * the browser default.
 */

import type { ComponentId, PortRef } from '@gatecraft/engine';
import { asComponentId } from '@gatecraft/engine';
import {
  AddComponentCommand,
  AddWireCommand,
  DeleteCommand,
  MoveComponentsCommand,
  RotateComponentsCommand,
  wiresTouching,
  type ComponentMove,
  type ComponentRotation,
} from '../commands/index.js';
import { asWireId, type Point, type VisualComponent, type VisualWire } from '../model/document.js';
import { compositeShape, getShape, GRID, pinWorldPosition, rotateShape, type ComponentShape } from '../model/kinds.js';
import { lRoute } from '../model/routing.js';
import type { Clipboard } from '../model/store.js';
import { useAppStore } from '../model/store.js';

/** Compute the world pin position of a port for an arbitrary visual component. */
function pinWorldFor(
  comp: VisualComponent,
  portName: string,
  library: Parameters<typeof shapeFor>[1],
): Point | null {
  try {
    return pinWorldPosition(comp.position, shapeFor(comp, library), portName);
  } catch {
    return null;
  }
}

function shapeFor(
  comp: VisualComponent,
  library: ReturnType<typeof useAppStore.getState>['library'],
): ComponentShape {
  let s: ComponentShape;
  if (comp.kind.startsWith('composite:')) {
    const refId = String(comp.params['refId'] ?? '');
    const saved = library.find((sc) => sc.id === refId);
    s = saved
      ? compositeShape({
          label: saved.name || 'COMPOSITE',
          inputs: saved.inputs.map((p) => ({ name: p.name, width: p.width })),
          outputs: saved.outputs.map((p) => ({ name: p.name, width: p.width })),
        })
      : compositeShape({ label: '?', inputs: [], outputs: [] });
  } else {
    s = getShape(comp.kind, comp.params);
  }
  if (comp.rotation !== 0) s = rotateShape(s, comp.rotation);
  return s;
}

/* -------------------------- Rotate ------------------------------ */

export function rotateSelected(direction: 'cw' | 'ccw' = 'cw'): void {
  const store = useAppStore.getState();
  const ids = [...store.selection.componentIds];
  if (ids.length === 0) return;
  const library = store.library;
  const compsById = new Map<ComponentId, VisualComponent>();
  for (const c of store.document.components) compsById.set(c.id, c);

  const advance = (r: 0 | 90 | 180 | 270): 0 | 90 | 180 | 270 => {
    const cur = r;
    const next = direction === 'cw' ? cur + 90 : cur + 270;
    return ((next % 360) as 0 | 90 | 180 | 270);
  };

  const rotations: ComponentRotation[] = [];
  for (const id of ids) {
    const c = compsById.get(id);
    if (!c) continue;
    rotations.push({ id, from: c.rotation, to: advance(c.rotation) });
  }

  // For each wire touching a rotated component, recompute its path as an
  // L-route between the new pin world positions (other endpoint stays where
  // it was if unaffected).
  const rotatingIds = new Set(rotations.map((r) => r.id));
  const targetRotation = new Map(rotations.map((r) => [r.id, r.to]));
  const newCompFor = (id: ComponentId): VisualComponent | null => {
    const c = compsById.get(id);
    if (!c) return null;
    const newRot = targetRotation.get(id);
    return newRot !== undefined ? { ...c, rotation: newRot } : c;
  };
  const incident = wiresTouching(store.document, rotatingIds);
  const wireUpdates = incident.map((w) => {
    const a = newCompFor(w.endpoints[0].componentId);
    const b = newCompFor(w.endpoints[1].componentId);
    if (!a || !b) return { id: w.id, from: w.path, to: w.path };
    const aPos = pinWorldFor(a, w.endpoints[0].portName, library);
    const bPos = pinWorldFor(b, w.endpoints[1].portName, library);
    if (!aPos || !bPos) return { id: w.id, from: w.path, to: w.path };
    return { id: w.id, from: w.path, to: lRoute(aPos, bPos) };
  });

  store.dispatch(new RotateComponentsCommand(rotations, wireUpdates));
}

/* -------------------------- Select all -------------------------- */

export function selectAll(): void {
  const store = useAppStore.getState();
  store.setSelection(store.document.components.map((c) => c.id));
}

/* -------------------------- Nudge ------------------------------- */

export function nudge(dxGridUnits: number, dyGridUnits: number): void {
  const store = useAppStore.getState();
  const ids = [...store.selection.componentIds];
  if (ids.length === 0) return;
  const delta: Point = { x: dxGridUnits * GRID, y: dyGridUnits * GRID };
  if (delta.x === 0 && delta.y === 0) return;
  const moves: ComponentMove[] = [];
  for (const id of ids) {
    const c = store.document.components.find((x) => x.id === id);
    if (!c) continue;
    moves.push({
      id,
      from: c.position,
      to: { x: c.position.x + delta.x, y: c.position.y + delta.y },
    });
  }
  const movingIds = new Set(ids);
  const incident = wiresTouching(store.document, movingIds);
  const wireUpdates = incident.map((w) => {
    const aComp = store.document.components.find((c) => c.id === w.endpoints[0].componentId);
    const bComp = store.document.components.find((c) => c.id === w.endpoints[1].componentId);
    if (!aComp || !bComp) return { id: w.id, from: w.path, to: w.path };
    const aPos = pinWorldFor(aComp, w.endpoints[0].portName, store.library);
    const bPos = pinWorldFor(bComp, w.endpoints[1].portName, store.library);
    if (!aPos || !bPos) return { id: w.id, from: w.path, to: w.path };
    const a = movingIds.has(aComp.id) ? { x: aPos.x + delta.x, y: aPos.y + delta.y } : aPos;
    const b = movingIds.has(bComp.id) ? { x: bPos.x + delta.x, y: bPos.y + delta.y } : bPos;
    return { id: w.id, from: w.path, to: lRoute(a, b) };
  });
  store.dispatch(new MoveComponentsCommand(moves, wireUpdates));
}

/* -------------------------- Delete ------------------------------ */

export function deleteSelected(): void {
  const store = useAppStore.getState();
  const sel = store.selection.componentIds;
  const wireSel = store.selection.wireIds ?? new Set();
  if (sel.size === 0 && wireSel.size === 0) return;
  const removedComps = store.document.components.filter((c) => sel.has(c.id));
  // Wires removed = all wires touching deleted components + explicitly selected wires.
  const incident = wiresTouching(store.document, sel);
  const explicit = store.document.wires.filter((w) => wireSel.has(w.id));
  // Deduplicate by id.
  const removedWires = [...new Map([...incident, ...explicit].map((w) => [w.id, w])).values()];
  if (removedComps.length === 0 && removedWires.length === 0) return;
  store.dispatch(new DeleteCommand(removedComps, removedWires), { selectionAfter: [] });
}

/* -------------------------- Copy / Paste / Duplicate ------------ */

export function copySelection(): void {
  const store = useAppStore.getState();
  const ids = new Set(store.selection.componentIds);
  if (ids.size === 0) return;
  const components = store.document.components.filter((c) => ids.has(c.id));
  // Anchor: top-left bounding box of the selection.
  const anchor = components.reduce(
    (acc, c) => ({ x: Math.min(acc.x, c.position.x), y: Math.min(acc.y, c.position.y) }),
    { x: Infinity, y: Infinity },
  );
  // Include only wires whose BOTH endpoints land in the selection (otherwise
  // pasting would create dangling references to components not on the clipboard).
  const wires = store.document.wires.filter(
    (w) => ids.has(w.endpoints[0].componentId) && ids.has(w.endpoints[1].componentId),
  );
  store.setClipboard({ components, wires, anchor });
}

export function pasteClipboard(at: Point | null = null): void {
  const store = useAppStore.getState();
  const clip = store.clipboard;
  if (!clip || clip.components.length === 0) return;
  // Paste relative offset: if a position is given, anchor the top-left of
  // the paste at that point. Otherwise offset by one grid cell.
  const offset: Point = at
    ? { x: at.x - clip.anchor.x, y: at.y - clip.anchor.y }
    : { x: GRID * 2, y: GRID * 2 };
  pasteAt(clip, offset);
}

export function duplicateSelection(): void {
  copySelection();
  pasteClipboard();
}

function pasteAt(clip: Clipboard, offset: Point): void {
  const store = useAppStore.getState();
  // Generate fresh ids; build a remap so wires can reference them.
  const idMap = new Map<ComponentId, ComponentId>();
  const newComps: VisualComponent[] = clip.components.map((c) => {
    const newId = asComponentId(crypto.randomUUID());
    idMap.set(c.id, newId);
    return {
      ...c,
      id: newId,
      position: { x: c.position.x + offset.x, y: c.position.y + offset.y },
    };
  });
  const newWires: VisualWire[] = clip.wires.map((w) => ({
    id: asWireId(crypto.randomUUID()),
    endpoints: [
      remapEndpoint(w.endpoints[0], idMap),
      remapEndpoint(w.endpoints[1], idMap),
    ],
    path: w.path.map((p) => ({ x: p.x + offset.x, y: p.y + offset.y })),
  }));
  // Dispatch as a single multi-step transaction is overkill — issue one
  // AddComponent per new comp + one AddWire per new wire. Each is undoable
  // individually; pressing Cmd+Z N times peels them off in reverse order.
  for (const c of newComps) {
    store.dispatch(new AddComponentCommand(c));
  }
  for (const w of newWires) {
    store.dispatch(new AddWireCommand(w));
  }
  store.setSelection(newComps.map((c) => c.id));
}

function remapEndpoint(
  ref: PortRef,
  idMap: ReadonlyMap<ComponentId, ComponentId>,
): PortRef {
  const newId = idMap.get(ref.componentId);
  return newId ? { componentId: newId, portName: ref.portName } : ref;
}
