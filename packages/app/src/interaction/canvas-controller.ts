/**
 * Translates pointer/wheel events on the canvas into store mutations.
 *
 * Wires + placement commit on pointerdown — clicks are "down-edge" actions
 * so a single press doesn't both start AND immediately commit a tool.
 * Drag actions (pan, move-components) commit on pointerup.
 */

import type {
  CompiledNetlist,
  ComponentId,
  PortRef,
  SignalValue,
} from '@gatecraft/engine';
import { asComponentId, portKey } from '@gatecraft/engine';
import {
  AddComponentCommand,
  AddWireCommand,
  MoveComponentsCommand,
  wiresTouching,
  type ComponentMove,
} from '../commands/index.js';
import { asWireId, type Point, type VisualComponent, type VisualWire } from '../model/document.js';
import { getShape, pinWorldPosition } from '../model/kinds.js';
import { lRoute, routeOrthogonal, snapToGrid as snapToGridRaw, type PinSide } from '../model/routing.js';
import type { Point as RoutingPoint } from '../model/document.js';

/** Snap helper that honours the store's snap toggle. */
function snapToGrid(p: RoutingPoint): RoutingPoint {
  return useAppStore.getState().snapEnabled ? snapToGridRaw(p) : p;
}
import { screenToWorld, useAppStore } from '../model/store.js';
import type { Renderer } from '../render/renderer.js';

export type ControllerTarget = 'main' | 'split';

/**
 * Returns the slice of store state + actions that the controller should
 * read/write for the given target pane. Reading `document/tool/selection
 * /viewport/compiled` routes to the matching pane's slice; dispatch and
 * undo/redo are delegated to the pane's own action.
 *
 * Note: this returns plain values (not subscriptions) — callers must
 * call it again to see fresh state.
 */
function paneState(pane: ControllerTarget) {
  const s = useAppStore.getState();
  if (pane === 'main') {
    return {
      document: s.document,
      compiled: s.compiled,
      tool: s.tool,
      selection: s.selection,
      viewport: s.viewport,
      snapEnabled: s.snapEnabled,
      library: s.library,
      lastPlacedKind: s.lastPlacedKind,
      suggestionAnchor: s.suggestionAnchor,
      paletteOpen: s.paletteOpen,
      clipboard: s.clipboard,
      dispatch: s.dispatch,
      undo: s.undo,
      redo: s.redo,
      setTool: s.setTool,
      setSelection: s.setSelection,
      setWireSelection: s.setWireSelection,
      clearSelection: s.clearSelection,
      setViewport: s.setViewport,
      panBy: s.panBy,
      zoomAt: s.zoomAt,
      setLastPlacedKind: s.setLastPlacedKind,
      setSuggestionAnchor: s.setSuggestionAnchor,
      setClipboard: s.setClipboard,
      running: s.running,
      setRunning: s.setRunning,
      focus: () => s.setFocusedPane('main'),
    };
  }
  // split — fall back to the live main doc when no tab is pinned (mirror mode)
  const splitDocId = s.splitDocumentId;
  const splitDoc = splitDocId
    ? s.documents.get(splitDocId)?.document ?? s.document
    : s.document;
  return {
    document: splitDoc,
    compiled: s.splitCompiled,
    tool: s.splitTool,
    selection: s.splitSelection,
    viewport: s.secondaryViewport,
    snapEnabled: s.snapEnabled,
    library: s.library,
    lastPlacedKind: s.lastPlacedKind,
    suggestionAnchor: s.suggestionAnchor,
    paletteOpen: s.paletteOpen,
    clipboard: s.clipboard,
    dispatch: s.splitDispatch,
    undo: s.splitUndo,
    redo: s.splitRedo,
    setTool: s.setSplitTool,
    setSelection: s.setSplitSelection,
    setWireSelection: (_ids: Iterable<unknown>): void => {
      // Wire selection on the split pane is V2 — keep a stub so callers
      // don't have to branch.
    },
    clearSelection: (): void => s.setSplitSelection([]),
    setViewport: s.setSecondaryViewport,
    panBy: (dxScreen: number, dyScreen: number): void => {
      const vp = useAppStore.getState().secondaryViewport;
      useAppStore.getState().setSecondaryViewport({
        zoom: vp.zoom,
        panX: vp.panX - dxScreen / vp.zoom,
        panY: vp.panY - dyScreen / vp.zoom,
      });
    },
    zoomAt: (sx: number, sy: number, factor: number): void => {
      const vp = useAppStore.getState().secondaryViewport;
      const worldX = vp.panX + sx / vp.zoom;
      const worldY = vp.panY + sy / vp.zoom;
      const nextZoom = Math.max(0.2, Math.min(4, vp.zoom * factor));
      useAppStore.getState().setSecondaryViewport({
        zoom: nextZoom,
        panX: worldX - sx / nextZoom,
        panY: worldY - sy / nextZoom,
      });
    },
    setLastPlacedKind: s.setLastPlacedKind,
    setSuggestionAnchor: s.setSuggestionAnchor,
    setClipboard: s.setClipboard,
    running: s.splitRunning,
    setRunning: s.setSplitRunning,
    focus: () => s.setFocusedPane('split'),
  };
}
import {
  copySelection,
  deleteSelected,
  duplicateSelection,
  nudge,
  pasteClipboard,
  rotateSelected,
  selectAll,
} from './keyboard.js';

const CLICK_THRESHOLD_PX = 4;
const ZOOM_PER_WHEEL_NOTCH = 1.1;

interface PointerSession {
  active: boolean;
  startScreen: Point;
  lastScreen: Point;
  startWorld: Point;
  movedPastThreshold: boolean;
  mode: 'pan' | 'move-components' | null;
}

export function attachCanvasController(
  canvas: HTMLCanvasElement,
  renderer: Renderer,
  pane: ControllerTarget = 'main',
): () => void {
  const session: PointerSession = {
    active: false,
    startScreen: { x: 0, y: 0 },
    lastScreen: { x: 0, y: 0 },
    startWorld: { x: 0, y: 0 },
    movedPastThreshold: false,
    mode: null,
  };

  const localPoint = (clientX: number, clientY: number): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onPointerDown = (ev: PointerEvent): void => {
    // Any meaningful pointer activity makes this pane the focused one
    // for Inspector / Cmd+Z / Play target.
    paneState(pane).focus();
    if (ev.button === 2) {
      // Right click: cancel any in-progress tool.
      const tool = paneState(pane).tool;
      if (tool.type === 'wire' || tool.type === 'place') {
        paneState(pane).setTool({ type: 'idle' });
        renderer.setHoverPin(null);
      }
      return;
    }
    if (ev.button !== 0 && ev.button !== 1) return;

    const screen = localPoint(ev.clientX, ev.clientY);
    const store = paneState(pane);
    const world = screenToWorld(store.viewport, screen.x, screen.y);
    const tool = store.tool;

    // Place tool: commit immediately on pointerdown.
    if (tool.type === 'place') {
      const snapped = snapToGrid(world);
      const id = asComponentId(crypto.randomUUID());
      const comp: VisualComponent = {
        id,
        kind: tool.kind,
        params: tool.params,
        position: snapped,
        rotation: 0,
      };
      store.dispatch(new AddComponentCommand(comp), { selectionAfter: [id] });
      store.setTool({ type: 'idle' });
      // Drive the suggestion anchor: palette will glow recommended next kinds
      // and the canvas will draw clickable "+" hints next to this component.
      store.setLastPlacedKind(tool.kind);
      store.setSuggestionAnchor({ componentId: id, world: snapped });
      ev.preventDefault();
      return;
    }

    // Wire tool: handle wire actions on pointerdown (so the SAME press that
    // started the wire doesn't immediately cancel it on pointerup).
    if (tool.type === 'wire') {
      const pinHit = renderer.hitTestPin(world.x, world.y);
      if (pinHit) {
        // Same pin as start → cancel; different pin → commit.
        if (
          pinHit.ref.componentId === tool.startPin.componentId &&
          pinHit.ref.portName === tool.startPin.portName
        ) {
          store.setTool({ type: 'idle' });
          renderer.setHoverPin(null);
          ev.preventDefault();
          return;
        }
        const path = finalizeWirePath(tool.path, pinHit.world);
        const wire: VisualWire = {
          id: asWireId(crypto.randomUUID()),
          endpoints: [tool.startPin, pinHit.ref],
          path,
        };
        store.dispatch(new AddWireCommand(wire));
        store.setTool({ type: 'idle' });
        renderer.setHoverPin(null);
        ev.preventDefault();
        return;
      }
      // Empty-space click → append a Manhattan waypoint.
      const snapped = snapToGrid(world);
      const last = tool.path[tool.path.length - 1];
      let nextPath: Point[];
      if (!last) {
        nextPath = [snapped];
      } else if (last.x === snapped.x || last.y === snapped.y) {
        nextPath = [...tool.path, snapped];
      } else {
        const bend: Point = { x: snapped.x, y: last.y };
        nextPath = [...tool.path, bend, snapped];
      }
      store.setTool({ ...tool, path: nextPath });
      ev.preventDefault();
      return;
    }

    // Idle tool: first check for a suggestion-hint hit (the floating "+"
    // bubbles near a freshly placed component). Acts as a shortcut into the
    // place tool for the suggested kind, snapped at the hint's world point.
    const suggestionHit = renderer.hitTestSuggestion(world.x, world.y);
    if (suggestionHit) {
      const params = defaultParamsForKind(suggestionHit.kind);
      store.setTool({ type: 'place', kind: suggestionHit.kind, params, ghostWorld: suggestionHit.world });
      store.setSuggestionAnchor(null);
      ev.preventDefault();
      return;
    }

    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {
      // Pointer capture can fail for synthetic events (no pointer tracked) —
      // not fatal. Drag-outside-canvas in that case may lose pointermove,
      // but for real user input the capture succeeds.
    }
    session.active = true;
    session.startScreen = screen;
    session.lastScreen = screen;
    session.startWorld = world;
    session.movedPastThreshold = false;
    session.mode = null;

    // Pin click starts a wire.
    const pinHit = renderer.hitTestPin(world.x, world.y);
    if (pinHit) {
      store.setTool({
        type: 'wire',
        startPin: pinHit.ref,
        path: [pinHit.world],
        hoverWorld: pinHit.world,
      });
      session.active = false;
      try {
        if (canvas.hasPointerCapture(ev.pointerId)) {
          canvas.releasePointerCapture(ev.pointerId);
        }
      } catch {
        // Synthetic events may not have a tracked pointer.
      }
      ev.preventDefault();
      return;
    }

    // Component hit → adjust selection, prepare for possible move.
    const compHit = renderer.hitTestComponent(world.x, world.y);
    // Shift + click on empty space starts a marquee selection drag.
    if (!compHit && ev.shiftKey) {
      store.setTool({
        type: 'marquee',
        anchorWorld: world,
        hoverWorld: world,
        additive: true,
      });
      session.mode = null;
      ev.preventDefault();
      return;
    }
    if (compHit) {
      const selection = store.selection.componentIds;
      const additive = ev.shiftKey;
      let nextSelection: ReadonlySet<ComponentId>;
      if (additive) {
        const next = new Set(selection);
        if (next.has(compHit)) next.delete(compHit);
        else next.add(compHit);
        nextSelection = next;
      } else if (selection.has(compHit)) {
        nextSelection = selection;
      } else {
        nextSelection = new Set([compHit]);
      }
      store.setSelection(nextSelection);

      // Live-sim interaction: clicking an Input or Button toggles its
      // driven value via the worker's setInput. We mark `dragStartedAsToggle`
      // on the session so the pointerup doesn't also fire a select/clear.
      const inst = store.document.components.find((c) => c.id === compHit);
      if (inst && (inst.kind === 'input' || inst.kind === 'button')) {
        toggleInputOrButton(store.compiled.netlist.portToNet, inst.id, pane);
      }
    }
    ev.preventDefault();
  };

  const onPointerMove = (ev: PointerEvent): void => {
    const screen = localPoint(ev.clientX, ev.clientY);
    let store = paneState(pane);
    const world = screenToWorld(store.viewport, screen.x, screen.y);

    // Hover effects (cheap, do every move).
    if (store.tool.type === 'wire') {
      const pinHit = renderer.hitTestPin(world.x, world.y);
      renderer.setHoverPin(pinHit);
      const snapped = pinHit ? pinHit.world : snapToGrid(world);
      store.setTool({ ...store.tool, hoverWorld: snapped });
    } else if (store.tool.type === 'place') {
      store.setTool({ ...store.tool, ghostWorld: snapToGrid(world) });
    } else if (store.tool.type === 'marquee') {
      store.setTool({ ...store.tool, hoverWorld: world });
    } else if (store.tool.type === 'idle') {
      const pinHit = renderer.hitTestPin(world.x, world.y);
      renderer.setHoverPin(pinHit);
      // Hover-tooltip for suggestion hints — emits a screen-space
      // event so a DOM overlay can render the kind's short description.
      const sugHit = renderer.hitTestSuggestion(world.x, world.y);
      window.dispatchEvent(
        new CustomEvent('gatecraft:hover-suggestion', {
          detail: sugHit
            ? { kind: sugHit.kind, screenX: ev.clientX, screenY: ev.clientY }
            : null,
        }),
      );
    }

    if (!session.active) return;

    const totalDx = screen.x - session.startScreen.x;
    const totalDy = screen.y - session.startScreen.y;
    if (
      !session.movedPastThreshold &&
      Math.abs(totalDx) + Math.abs(totalDy) > CLICK_THRESHOLD_PX
    ) {
      session.movedPastThreshold = true;
      if (session.mode === null) {
        const selection = store.selection.componentIds;
        const overSelected = renderer.hitTestComponent(
          session.startWorld.x,
          session.startWorld.y,
        );
        if (
          overSelected !== null &&
          selection.has(overSelected) &&
          store.tool.type === 'idle'
        ) {
          const original = new Map<ComponentId, Point>();
          for (const id of selection) {
            const c = store.document.components.find((x) => x.id === id);
            if (c) original.set(id, c.position);
          }
          store.setTool({
            type: 'move',
            originalPositions: original,
            delta: { x: 0, y: 0 },
            startWorld: session.startWorld,
          });
          session.mode = 'move-components';
          // Re-fetch state since we just mutated it.
          store = paneState(pane);
        } else {
          session.mode = 'pan';
        }
      }
    }

    if (session.movedPastThreshold) {
      const dxScreen = screen.x - session.lastScreen.x;
      const dyScreen = screen.y - session.lastScreen.y;
      if (session.mode === 'pan') {
        if (dxScreen !== 0 || dyScreen !== 0) store.panBy(dxScreen, dyScreen);
      } else if (session.mode === 'move-components') {
        const live = paneState(pane);
        const t = live.tool;
        if (t.type === 'move') {
          const delta = snapToGrid({
            x: world.x - session.startWorld.x,
            y: world.y - session.startWorld.y,
          });
          if (delta.x !== t.delta.x || delta.y !== t.delta.y) {
            live.setTool({ ...t, delta });
          }
        }
      }
    }
    session.lastScreen = screen;
  };

  const onPointerUp = (ev: PointerEvent): void => {
    if (canvas.hasPointerCapture(ev.pointerId)) {
      canvas.releasePointerCapture(ev.pointerId);
    }
    const screen = localPoint(ev.clientX, ev.clientY);
    const store = paneState(pane);
    const world = screenToWorld(store.viewport, screen.x, screen.y);
    const wasActive = session.active;
    const wasMoved = session.movedPastThreshold;
    session.active = false;

    const tool = store.tool;

    if (tool.type === 'marquee') {
      const rect = normalizeRect(tool.anchorWorld, tool.hoverWorld);
      const hits = renderer.componentsInRect(rect);
      const next = tool.additive
        ? new Set<ComponentId>([...store.selection.componentIds, ...hits])
        : new Set<ComponentId>(hits);
      store.setSelection(next);
      store.setTool({ type: 'idle' });
      return;
    }

    if (tool.type === 'move') {
      const delta = tool.delta;
      if (delta.x !== 0 || delta.y !== 0) {
        const moves: ComponentMove[] = [];
        for (const [id, from] of tool.originalPositions) {
          moves.push({ id, from, to: { x: from.x + delta.x, y: from.y + delta.y } });
        }
        const movingIds = new Set(tool.originalPositions.keys());
        const incident = wiresTouching(store.document, movingIds);
        const siblings = buildSiblingMap(store.document.wires);
        const wireUpdates = incident.map((w) => {
          const newPath = rerouteIncidentWire(
            w,
            movingIds,
            delta,
            store.document.components,
            siblings,
          );
          return { id: w.id, from: w.path, to: newPath };
        });
        store.dispatch(new MoveComponentsCommand(moves, wireUpdates));
      }
      store.setTool({ type: 'idle' });
      return;
    }

    // Idle: a click on empty space (no movement) selects a wire if one is
    // under the cursor, otherwise clears selection.
    if (wasActive && !wasMoved && tool.type === 'idle') {
      const compHit = renderer.hitTestComponent(world.x, world.y);
      if (!compHit) {
        const wireHit = renderer.hitTestWire(world.x, world.y);
        if (wireHit) {
          // Shift-click toggles a wire in/out of the current selection;
          // a plain click resets to a single-wire selection.
          if (ev.shiftKey) {
            const current = new Set(store.selection.wireIds ?? []);
            if (current.has(wireHit)) current.delete(wireHit);
            else current.add(wireHit);
            store.setWireSelection(current);
          } else {
            store.setWireSelection([wireHit]);
          }
        } else if (!ev.shiftKey) {
          store.clearSelection();
        }
      }
    }
  };

  const onPointerCancel = (ev: PointerEvent): void => {
    if (canvas.hasPointerCapture(ev.pointerId)) {
      canvas.releasePointerCapture(ev.pointerId);
    }
    session.active = false;
    const tool = paneState(pane).tool;
    if (tool.type === 'move') {
      paneState(pane).setTool({ type: 'idle' });
    }
  };

  const onWheel = (ev: WheelEvent): void => {
    ev.preventDefault();
    const { x, y } = localPoint(ev.clientX, ev.clientY);
    const notches = -ev.deltaY / 100;
    const factor = Math.pow(ZOOM_PER_WHEEL_NOTCH, notches);
    paneState(pane).zoomAt(x, y, factor);
  };

  const onContextMenu = (ev: MouseEvent): void => {
    ev.preventDefault();
    paneState(pane).focus();
    const world = screenToWorld(paneState(pane).viewport, ev.offsetX, ev.offsetY);
    const compHit = renderer.hitTestComponent(world.x, world.y);
    const wireHit = !compHit ? renderer.hitTestWire(world.x, world.y) : null;
    if (!compHit && !wireHit) return;
    // If a wire was hit, pre-select it so the context menu acts on it.
    if (wireHit && !paneState(pane).selection.wireIds?.has(wireHit)) {
      paneState(pane).setWireSelection([wireHit]);
    }
    if (compHit && !paneState(pane).selection.componentIds.has(compHit)) {
      paneState(pane).setSelection([compHit]);
    }
    // Forward to React via a window event with the cursor position; the
    // ContextMenu component listens and renders the popup.
    window.dispatchEvent(
      new CustomEvent('gatecraft:open-context-menu', {
        detail: { screenX: ev.clientX, screenY: ev.clientY, target: compHit ? 'component' : 'wire' },
      }),
    );
  };

  const onKeyDown = (ev: KeyboardEvent): void => {
    // Don't steal keys when typing in a form field anywhere on the page.
    const target = ev.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }
    // Keyboard always targets the user's currently focused pane.
    // Reading store.focusedPane here means Cmd+Z, R, Delete etc. behave
    // intuitively when the user switches focus between panes.
    const focused = useAppStore.getState().focusedPane;
    const store = paneState(focused);
    const meta = ev.metaKey || ev.ctrlKey;
    const k = ev.key.toLowerCase();

    if (meta && !ev.shiftKey && k === 'z') {
      ev.preventDefault();
      store.undo();
      return;
    }
    if ((meta && ev.shiftKey && k === 'z') || (meta && k === 'y')) {
      ev.preventDefault();
      store.redo();
      return;
    }
    if (meta && k === 'a') {
      ev.preventDefault();
      selectAll();
      return;
    }
    if (meta && k === 'c') {
      ev.preventDefault();
      copySelection();
      return;
    }
    if (meta && k === 'v') {
      ev.preventDefault();
      pasteClipboard();
      return;
    }
    if (meta && k === 'd') {
      ev.preventDefault();
      duplicateSelection();
      return;
    }
    if (meta && k === 'r') {
      ev.preventDefault();
      rotateSelected(ev.shiftKey ? 'ccw' : 'cw');
      return;
    }
    // Bare `R` rotates the selection too — matches the muscle-memory from
    // Figma/Logisim. Shift+R goes counter-clockwise.
    if (!meta && k === 'r' && store.selection.componentIds.size > 0) {
      ev.preventDefault();
      rotateSelected(ev.shiftKey ? 'ccw' : 'cw');
      return;
    }

    if (ev.key === 'Escape') {
      const tool = store.tool;
      if (tool.type !== 'idle') {
        store.setTool({ type: 'idle' });
        renderer.setHoverPin(null);
      } else if (store.suggestionAnchor) {
        store.setSuggestionAnchor(null);
      } else {
        store.clearSelection();
      }
      return;
    }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      const hasComps = store.selection.componentIds.size > 0;
      const hasWires = (store.selection.wireIds?.size ?? 0) > 0;
      if (!hasComps && !hasWires) return;
      ev.preventDefault();
      deleteSelected();
      return;
    }
    if (ev.key === ' ' || ev.code === 'Space') {
      ev.preventDefault();
      store.setRunning(!store.running);
      return;
    }
    if (ev.key.startsWith('Arrow')) {
      if (store.selection.componentIds.size === 0) return;
      ev.preventDefault();
      const step = ev.shiftKey ? 5 : 1;
      switch (ev.key) {
        case 'ArrowUp':
          nudge(0, -step);
          break;
        case 'ArrowDown':
          nudge(0, step);
          break;
        case 'ArrowLeft':
          nudge(-step, 0);
          break;
        case 'ArrowRight':
          nudge(step, 0);
          break;
      }
    }
  };

  const onDoubleClick = (ev: MouseEvent): void => {
    const ps = paneState(pane);
    const world = screenToWorld(ps.viewport, ev.offsetX, ev.offsetY);
    const compHit = renderer.hitTestComponent(world.x, world.y);
    if (!compHit) return;
    const comp = ps.document.components.find((c) => c.id === compHit);
    if (!comp || !comp.kind.startsWith('composite:')) return;
    const refId = String(comp.params['refId'] ?? '');
    const saved = ps.library.find((sc) => sc.id === refId);
    if (!saved) return;
    // Drill-in always opens a new tab in the main editor, regardless of
    // which pane was double-clicked — there's only one tab strip.
    const live = useAppStore.getState();
    live.newDocument({ name: saved.name, document: saved.doc });
    useAppStore.setState({
      activeDocumentOrigin: { kind: 'library', refId: saved.id },
    });
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('dblclick', onDoubleClick);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('dblclick', onDoubleClick);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('keydown', onKeyDown);
  };
}

/**
 * Default params used when entering place-tool from a canvas suggestion hint.
 * Picks the same values the Palette uses for fresh items.
 */
function defaultParamsForKind(kind: string): Record<string, number | string | boolean> {
  switch (kind) {
    case 'input':
    case 'output':
    case 'register':
    case 'not':
    case 'buffer':
      return { width: 1 };
    case 'constant':
      return { width: 1, value: '1' };
    case 'splitter':
      return { width: 4, fanout: 4 };
    case 'tunnel':
      return { width: 1, label: 'X' };
    case 'and':
    case 'or':
    case 'nand':
    case 'nor':
    case 'xor':
    case 'xnor':
      return { width: 1, inputs: 2 };
    case 'mux':
      return { width: 1, inputs: 2 };
    case 'demux':
      return { width: 1, outputs: 2 };
    case 'decoder':
      return { inputs: 2 };
    case 'adder':
    case 'subtractor':
      return { width: 1 };
    case 'comparator':
      return { width: 1, signed: false };
    case 'counter':
    case 'shift-register':
      return { width: 4 };
    default:
      return {};
  }
}

function normalizeRect(a: Point, b: Point): { x: number; y: number; w: number; h: number } {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

function finalizeWirePath(path: readonly Point[], endPin: Point): Point[] {
  if (path.length === 0) return [endPin];
  const last = path[path.length - 1]!;
  if (last.x === endPin.x || last.y === endPin.y) return [...path, endPin];
  return [...path, { x: endPin.x, y: last.y }, endPin];
}

/**
 * Toggle a 1-bit Input or Button by reading the current snapshot net value
 * and posting the inverted value back to the worker via setInput. Multi-bit
 * inputs need the Inspector — a single click only flips 1-bit drivers.
 */
function toggleInputOrButton(
  portToNet: CompiledNetlist['portToNet'],
  componentId: ComponentId,
  pane: ControllerTarget,
): void {
  // Route to the matching pane's sim worker — clicking an input on the
  // split canvas drives the split worker, not the main one.
  const w = window as unknown as {
    __sim?: { setInput: (p: PortRef, v: SignalValue) => void };
    __splitSim?: { setInput: (p: PortRef, v: SignalValue) => void };
  };
  const sim = pane === 'main' ? w.__sim : w.__splitSim;
  if (!sim) return;
  const state = useAppStore.getState();
  const snap = pane === 'main' ? state.simSnapshot : state.splitSimSnapshot;
  const netId = portToNet.get(portKey(componentId, 'out'));
  if (!netId) return;
  const v = snap?.nets.get(netId);
  let nextValue: SignalValue;
  if (v && v.unknown === 0n && v.hiZ === 0n) {
    const isHigh = v.value !== 0n;
    nextValue = { width: 1, value: isHigh ? 0n : 1n, unknown: 0n, hiZ: 0n };
  } else {
    nextValue = { width: 1, value: 1n, unknown: 0n, hiZ: 0n };
  }
  sim.setInput({ componentId, portName: 'out' }, nextValue);
}

function rerouteIncidentWire(
  wire: VisualWire,
  movingIds: ReadonlySet<ComponentId>,
  delta: Point,
  components: readonly VisualComponent[],
  /**
   * Pre-built sibling lookup: portKey → list of wire ids sharing that
   * port, in document order. We use the wire's index in that list as
   * its bus-lane offset so parallel wires fan out cleanly.
   */
  siblings?: ReadonlyMap<string, readonly string[]>,
): Point[] {
  const refToWorldAndSide = (
    ref: PortRef,
  ): { world: Point; side: PinSide } | null => {
    const c = components.find((x) => x.id === ref.componentId);
    if (!c) return null;
    const shape = getShape(c.kind, c.params);
    const base = pinWorldPosition(c.position, shape, ref.portName);
    const pin = shape.pins.find((p) => p.name === ref.portName);
    const world = movingIds.has(c.id) ? { x: base.x + delta.x, y: base.y + delta.y } : base;
    return { world, side: (pin?.side ?? 'right') as PinSide };
  };
  const a = refToWorldAndSide(wire.endpoints[0]);
  const b = refToWorldAndSide(wire.endpoints[1]);
  if (!a || !b) return [...wire.path];
  // Build the obstacle list — everything except the two endpoints, with
  // each box shifted by the active move delta when its component is part
  // of the drag.
  const obstacles = components
    .filter((c) => c.id !== wire.endpoints[0].componentId && c.id !== wire.endpoints[1].componentId)
    .map((c) => {
      try {
        const shape = getShape(c.kind, c.params);
        const pos = movingIds.has(c.id)
          ? { x: c.position.x + delta.x, y: c.position.y + delta.y }
          : c.position;
        return { x: pos.x, y: pos.y, w: shape.bbox.w, h: shape.bbox.h };
      } catch {
        return null;
      }
    })
    .filter((b): b is { x: number; y: number; w: number; h: number } => b !== null);
  // Bus lane staggering — figure out our index within the set of wires
  // that share this exit port, so we can shift the stub.
  let siblingIndex = 0;
  if (siblings) {
    const ep = wire.endpoints[0];
    const key = `${ep.componentId}::${ep.portName}`;
    const group = siblings.get(key);
    if (group) {
      const idx = group.indexOf(wire.id);
      if (idx > 0) siblingIndex = idx;
    }
  }
  return routeOrthogonal(a.world, b.world, a.side, b.side, 16, obstacles, { siblingIndex });
}

/** Pre-compute the bus-lane sibling map for a set of wires. */
export function buildSiblingMap(wires: readonly VisualWire[]): ReadonlyMap<string, readonly string[]> {
  const out = new Map<string, string[]>();
  for (const w of wires) {
    const ep = w.endpoints[0];
    const key = `${ep.componentId}::${ep.portName}`;
    let group = out.get(key);
    if (!group) {
      group = [];
      out.set(key, group);
    }
    group.push(w.id);
  }
  return out;
}
