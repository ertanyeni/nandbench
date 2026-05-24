/**
 * Zustand store — the single UI-state hub.
 *
 * Layers:
 *   document      — canonical circuit (mutated only via Command.apply/revert)
 *   compiled      — engine netlist + diagnostics, recomputed after each edit
 *   history       — past commands (for undo)
 *   redoStack     — undone commands (cleared on a new edit)
 *   viewport      — pan/zoom
 *   selection     — which components are highlighted
 *   tool          — what the user is doing (idle / place / wire / move)
 *   dragPreview   — transient offset shown by the renderer while dragging
 */

import type {
  ComponentId,
  ComponentParams,
  Diagnostic,
  PortRef,
  SimSnapshot,
} from '@gatecraft/engine';
import { create } from 'zustand';
import type { Command } from '../commands/types.js';
import { setActiveLocale, type Locale } from '../i18n/index.js';
import {
  emptyDocument,
  type CircuitDocument,
  type Point,
  type VisualComponent,
  type VisualWire,
  type WireId,
} from './document.js';
import { asSavedCircuitId, snapshotAsSavedCircuit, type SavedCircuit, type SavedCircuitId } from './library.js';
import { compileDocument, type CompiledState } from './netlist-sync.js';

export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

export interface Selection {
  componentIds: ReadonlySet<ComponentId>;
  wireIds?: ReadonlySet<WireId>;
}

/* ---------------- Tool state ---------------- */

export type Tool =
  | { readonly type: 'idle' }
  | {
      readonly type: 'place';
      readonly kind: string;
      readonly params: ComponentParams;
      /** Last known world-snapped position of the placement ghost. */
      readonly ghostWorld: Point | null;
    }
  | {
      readonly type: 'wire';
      /** Pin where the in-progress wire begins. */
      readonly startPin: PortRef;
      /** Waypoints already committed by clicks (world coords). path[0] = start pin pos. */
      readonly path: readonly Point[];
      /** Current mouse position in world coords (for the live preview segment). */
      readonly hoverWorld: Point | null;
    }
  | {
      readonly type: 'move';
      readonly originalPositions: ReadonlyMap<ComponentId, Point>;
      /** Cumulative drag delta in world coords (snapped). */
      readonly delta: Point;
      /** World position of pointerdown — basis for delta. */
      readonly startWorld: Point;
    }
  | {
      readonly type: 'marquee';
      /** World-space anchor where the rectangle started. */
      readonly anchorWorld: Point;
      /** Current mouse position in world coords for the live rect. */
      readonly hoverWorld: Point;
      readonly additive: boolean;
    };

export const IDLE_TOOL: Tool = { type: 'idle' };

/* ---------------- Clipboard ---------------- */

export interface Clipboard {
  readonly components: readonly VisualComponent[];
  readonly wires: readonly VisualWire[];
  /** Anchor world point: used to offset paste relative to cursor. */
  readonly anchor: Point;
}

/* ---------------- Multi-document tabs ---------------- */

/** Branded id for a document tab. */
export type DocumentId = string & { readonly __brand: 'DocumentId' };
export const asDocumentId = (id: string): DocumentId => id as DocumentId;

/**
 * Frozen tab — what we keep in `documents` for tabs that aren't active.
 * The live tab's state is stored in the top-level slices below.
 *
 * Runtime state (sim snapshot, history, etc.) survives a tab switch but is
 * dropped on full session restart — only `document` and `name` round-trip
 * through persistence.
 */
export interface FrozenDoc {
  readonly id: DocumentId;
  readonly name: string;
  readonly document: CircuitDocument;
  readonly history: readonly Command[];
  readonly redoStack: readonly Command[];
  readonly viewport: Viewport;
  readonly selection: Selection;
  readonly simSnapshot: SimSnapshot | undefined;
  readonly simDiagnostics: readonly Diagnostic[];
  readonly simComponentStates: ReadonlyMap<ComponentId, unknown>;
  readonly running: boolean;
  readonly tickRate: number;
  readonly dirty: boolean;
  /**
   * Optional origin marker — set when a tab represents an open library
   * entry, so close-tab can sync the edit back into the library.
   */
  readonly origin?: { readonly kind: 'library'; readonly refId: SavedCircuitId };
}

/* ---------------- Store ---------------- */

interface AppState {
  document: CircuitDocument;
  compiled: CompiledState;
  history: readonly Command[];
  redoStack: readonly Command[];
  viewport: Viewport;
  selection: Selection;
  tool: Tool;
  /* ----- saved-circuit library ----- */
  library: readonly SavedCircuit[];
  /* ----- clipboard (in-memory, not persisted) ----- */
  clipboard: Clipboard | null;
  /* ----- UX state ----- */
  locale: Locale;
  /** kind string of the last placed component, used to drive suggestions. */
  lastPlacedKind: string | null;
  /** Transient banner shown by StatusBar after a successful "publish tab". */
  publishedFlash: { id: SavedCircuitId; name: string } | null;
  /** Anchor for canvas suggestion hints — set on placement, cleared on Esc / selection change. */
  suggestionAnchor: { readonly componentId: ComponentId; readonly world: Point } | null;
  /** Per-component runtime state from the worker (sequential only). */
  simComponentStates: ReadonlyMap<ComponentId, unknown>;
  /** Whether the right-hand palette is visible. False collapses it. */
  paletteOpen: boolean;
  /** When true, place/move operations snap world positions to the grid. */
  snapEnabled: boolean;
  /**
   * Color palette for signal values on wires + chips. `default` uses
   * green/blue/red (the high-contrast standard); `deuteranopia` swaps to
   * a blue/yellow/orange palette that survives red-green color blindness.
   */
  colorMode: 'default' | 'deuteranopia';
  /* ----- live sim state (mirrored from the worker) ----- */
  simSnapshot: SimSnapshot | undefined;
  simDiagnostics: readonly Diagnostic[];
  running: boolean;
  /** Ticks per second when running. */
  tickRate: number;
  /** Set the document directly. Used by loadDocument + dispatch flows. */
  loadDocument: (doc: CircuitDocument) => void;
  /** Replace document + library wholesale (e.g. on import). */
  loadAll: (doc: CircuitDocument, library: readonly SavedCircuit[]) => void;
  /** Run a command and push it onto history. */
  dispatch: (cmd: Command, opts?: { selectionAfter?: Iterable<ComponentId> }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setViewport: (v: Viewport) => void;
  panBy: (dxScreen: number, dyScreen: number) => void;
  zoomAt: (screenX: number, screenY: number, factor: number) => void;
  setSelection: (ids: Iterable<ComponentId>) => void;
  setWireSelection: (ids: Iterable<WireId>) => void;
  clearSelection: () => void;
  setTool: (t: Tool) => void;
  /* ----- library actions ----- */
  saveCurrentAsComposite: (name: string) => SavedCircuitId;
  /**
   * Promote the active tab into the saved-circuit library + remember the
   * link, so subsequent edits auto-sync to the library entry. Returns the
   * library id (whether new or existing).
   */
  publishActiveTab: () => SavedCircuitId;
  deleteSavedCircuit: (id: SavedCircuitId) => void;
  /* ----- clipboard ----- */
  setClipboard: (clip: Clipboard | null) => void;
  /* ----- UX actions ----- */
  setLocale: (locale: Locale) => void;
  setLastPlacedKind: (kind: string | null) => void;
  setPublishedFlash: (flash: { id: SavedCircuitId; name: string } | null) => void;
  setSuggestionAnchor: (
    anchor: { componentId: ComponentId; world: Point } | null,
  ) => void;
  setSimComponentStates: (states: ReadonlyMap<ComponentId, unknown>) => void;
  setPaletteOpen: (open: boolean) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setColorMode: (mode: 'default' | 'deuteranopia') => void;
  /* ----- sim controls ----- */
  setSimSnapshot: (snap: SimSnapshot | undefined, diags: readonly Diagnostic[]) => void;
  setRunning: (running: boolean) => void;
  setTickRate: (hz: number) => void;
  /* ----- multi-doc tabs ----- */
  /** Frozen state for every tab except the active one. */
  documents: ReadonlyMap<DocumentId, FrozenDoc>;
  /** Tab ordering (left-to-right) — includes the active id. */
  documentOrder: readonly DocumentId[];
  /** The currently focused tab. */
  activeDocumentId: DocumentId;
  /** Name of the active tab (live; mirrored into FrozenDoc on switch). */
  activeDocumentName: string;
  /** Optional library-origin marker of the active tab. */
  activeDocumentOrigin?: { readonly kind: 'library'; readonly refId: SavedCircuitId };
  /** Active doc has unsaved changes since last persist. */
  activeDocumentDirty: boolean;
  /** Create a fresh empty tab, switch to it. */
  newDocument: (opts?: { name?: string; document?: CircuitDocument }) => DocumentId;
  /** Close a tab. If it's the only one, a fresh empty doc takes its place. */
  closeDocument: (id: DocumentId) => void;
  /** Activate a different tab. Freezes the current one + thaws the target. */
  switchDocument: (id: DocumentId) => void;
  /** Rename a tab (no-op if id doesn't exist). */
  renameDocument: (id: DocumentId, name: string) => void;
  /** Reorder tabs. Skipped if the new order doesn't reference the same set. */
  setDocumentOrder: (order: readonly DocumentId[]) => void;
}

export const INITIAL_VIEWPORT: Viewport = { panX: -40, panY: -40, zoom: 1 };
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const HISTORY_CAP = 200;

/** Generate a stable, unique-enough DocumentId for a new tab. */
function newDocId(): DocumentId {
  const rand = Math.random().toString(36).slice(2, 10);
  return asDocumentId(`doc_${Date.now().toString(36)}_${rand}`);
}

const INITIAL_DOC_ID = asDocumentId('doc_initial');

export const useAppStore = create<AppState>((set, get) => ({
  document: emptyDocument,
  compiled: compileDocument(emptyDocument),
  history: [],
  redoStack: [],
  viewport: INITIAL_VIEWPORT,
  selection: { componentIds: new Set() },
  tool: IDLE_TOOL,
  simSnapshot: undefined,
  simDiagnostics: [],
  running: false,
  tickRate: 4,
  library: [],
  clipboard: null,
  locale: 'en',
  lastPlacedKind: null,
  publishedFlash: null,
  suggestionAnchor: null,
  simComponentStates: new Map(),
  paletteOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  snapEnabled:
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('gatecraft:snapEnabled') !== 'false'
      : true,
  colorMode:
    typeof localStorage !== 'undefined' && localStorage.getItem('gatecraft:colorMode') === 'deuteranopia'
      ? 'deuteranopia'
      : 'default',
  /* Tabs */
  documents: new Map(),
  documentOrder: [INITIAL_DOC_ID],
  activeDocumentId: INITIAL_DOC_ID,
  activeDocumentName: 'main',
  activeDocumentDirty: false,

  loadDocument: (doc) => {
    const lib = get().library;
    set({
      document: doc,
      compiled: compileDocument(doc, lib),
      history: [],
      redoStack: [],
      selection: { componentIds: new Set() },
      simSnapshot: undefined,
    });
  },

  loadAll: (doc, library) =>
    set({
      document: doc,
      library,
      compiled: compileDocument(doc, library),
      history: [],
      redoStack: [],
      selection: { componentIds: new Set() },
      simSnapshot: undefined,
    }),

  dispatch: (cmd, opts) => {
    const state = get();
    const nextDoc = cmd.apply(state.document);
    const nextHistory = appendBounded(state.history, cmd);
    // Auto-sync: if this tab is the editing surface of a published
    // composite, mirror every edit back into the library entry so other
    // tabs referencing it pick up the change on their next recompile.
    let nextLibrary = state.library;
    const origin = state.activeDocumentOrigin;
    if (origin?.kind === 'library') {
      nextLibrary = state.library.map((sc) =>
        sc.id === origin.refId
          ? snapshotAsSavedCircuit(origin.refId, sc.name, nextDoc)
          : sc,
      );
    }
    set({
      document: nextDoc,
      library: nextLibrary,
      compiled: compileDocument(nextDoc, nextLibrary),
      history: nextHistory,
      redoStack: [],
      activeDocumentDirty: true,
      ...(opts?.selectionAfter
        ? { selection: { componentIds: new Set(opts.selectionAfter) } }
        : {}),
    });
  },

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    const cmd = state.history[state.history.length - 1]!;
    const nextDoc = cmd.revert(state.document);
    set({
      document: nextDoc,
      compiled: compileDocument(nextDoc, state.library),
      history: state.history.slice(0, -1),
      redoStack: [...state.redoStack, cmd],
      // Drop selection on undo — referenced ids may no longer exist.
      selection: { componentIds: new Set() },
      tool: IDLE_TOOL,
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const cmd = state.redoStack[state.redoStack.length - 1]!;
    const nextDoc = cmd.apply(state.document);
    set({
      document: nextDoc,
      compiled: compileDocument(nextDoc, state.library),
      history: [...state.history, cmd],
      redoStack: state.redoStack.slice(0, -1),
      selection: { componentIds: new Set() },
      tool: IDLE_TOOL,
    });
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().redoStack.length > 0,

  setViewport: (v) => set({ viewport: v }),
  panBy: (dxScreen, dyScreen) => {
    const { viewport } = get();
    set({
      viewport: {
        ...viewport,
        panX: viewport.panX - dxScreen / viewport.zoom,
        panY: viewport.panY - dyScreen / viewport.zoom,
      },
    });
  },
  zoomAt: (screenX, screenY, factor) => {
    const { viewport } = get();
    const oldZoom = viewport.zoom;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor));
    if (newZoom === oldZoom) return;
    const worldX = screenX / oldZoom + viewport.panX;
    const worldY = screenY / oldZoom + viewport.panY;
    const panX = worldX - screenX / newZoom;
    const panY = worldY - screenY / newZoom;
    set({ viewport: { panX, panY, zoom: newZoom } });
  },
  setSelection: (ids) => set({ selection: { componentIds: new Set(ids), wireIds: new Set() } }),
  setWireSelection: (ids) =>
    set({ selection: { componentIds: new Set(), wireIds: new Set(ids) } }),
  clearSelection: () => set({ selection: { componentIds: new Set(), wireIds: new Set() } }),
  setTool: (t) => set({ tool: t }),
  saveCurrentAsComposite: (name) => {
    const state = get();
    const id = asSavedCircuitId(crypto.randomUUID());
    const sc = snapshotAsSavedCircuit(id, name, state.document);
    set({ library: [...state.library, sc] });
    return id;
  },
  publishActiveTab: () => {
    // Publish the active tab as a library composite + flag the tab's
    // origin so future edits auto-sync. If the tab is *already* a library
    // origin, we just refresh its snapshot.
    const state = get();
    const name = state.activeDocumentName || 'untitled';
    let refId: SavedCircuitId;
    if (state.activeDocumentOrigin?.kind === 'library') {
      refId = state.activeDocumentOrigin.refId;
      const updated = state.library.map((sc) =>
        sc.id === refId ? snapshotAsSavedCircuit(refId, name, state.document) : sc,
      );
      set({ library: updated });
    } else {
      refId = asSavedCircuitId(crypto.randomUUID());
      const sc = snapshotAsSavedCircuit(refId, name, state.document);
      set({
        library: [...state.library, sc],
        activeDocumentOrigin: { kind: 'library', refId },
      });
    }
    return refId;
  },
  deleteSavedCircuit: (id) => {
    const state = get();
    set({ library: state.library.filter((c) => c.id !== id) });
  },
  setClipboard: (clip) => set({ clipboard: clip }),
  setLocale: (locale) => {
    setActiveLocale(locale);
    set({ locale });
  },
  setLastPlacedKind: (kind) => set({ lastPlacedKind: kind }),
  setPublishedFlash: (flash) => set({ publishedFlash: flash }),
  setSuggestionAnchor: (anchor) => set({ suggestionAnchor: anchor }),
  setSimComponentStates: (states) => set({ simComponentStates: states }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  setSnapEnabled: (enabled) => {
    try {
      localStorage.setItem('gatecraft:snapEnabled', enabled ? 'true' : 'false');
    } catch {
      /* ignore */
    }
    set({ snapEnabled: enabled });
  },
  setColorMode: (mode) => {
    try {
      localStorage.setItem('gatecraft:colorMode', mode);
    } catch {
      /* ignore quota */
    }
    set({ colorMode: mode });
  },
  setSimSnapshot: (snap, diags) => set({ simSnapshot: snap, simDiagnostics: diags }),
  setRunning: (running) => set({ running }),
  setTickRate: (hz) => set({ tickRate: Math.max(0.5, Math.min(60, hz)) }),

  /* ----- multi-doc tab actions ----- */
  newDocument: (opts) => {
    const id = newDocId();
    const name = opts?.name ?? defaultDocName(get().documentOrder.length + 1);
    // Freeze current as a tab before switching away.
    const s = get();
    const frozen = freezeActive(s);
    const docs = new Map(s.documents);
    docs.set(frozen.id, frozen);
    const newDoc = opts?.document ?? emptyDocument;
    set({
      documents: docs,
      documentOrder: [...s.documentOrder.filter((d) => d !== id), id],
      activeDocumentId: id,
      activeDocumentName: name,
      activeDocumentDirty: false,
      activeDocumentOrigin: undefined,
      // top-level live state for the fresh doc
      document: newDoc,
      compiled: compileDocument(newDoc, s.library),
      history: [],
      redoStack: [],
      selection: { componentIds: new Set() },
      viewport: INITIAL_VIEWPORT,
      tool: IDLE_TOOL,
      simSnapshot: undefined,
      simDiagnostics: [],
      simComponentStates: new Map(),
      running: false,
    });
    return id;
  },

  closeDocument: (id) => {
    const s = get();
    // If the tab being closed represents an open library entry, sync its
    // document back into the library so the change persists.
    const isActive = id === s.activeDocumentId;
    const closingDoc = isActive ? s.document : s.documents.get(id)?.document;
    const closingOrigin = isActive ? s.activeDocumentOrigin : s.documents.get(id)?.origin;
    if (closingDoc && closingOrigin?.kind === 'library') {
      const updatedLib = s.library.map((sc) =>
        sc.id === closingOrigin.refId ? { ...sc, doc: closingDoc } : sc,
      );
      set({ library: updatedLib });
    }

    if (s.documentOrder.length === 1) {
      // Last tab — reset rather than leaving the user stranded.
      set({
        document: emptyDocument,
        compiled: compileDocument(emptyDocument, s.library),
        history: [],
        redoStack: [],
        viewport: INITIAL_VIEWPORT,
        selection: { componentIds: new Set() },
        tool: IDLE_TOOL,
        simSnapshot: undefined,
        simDiagnostics: [],
        simComponentStates: new Map(),
        running: false,
        activeDocumentName: defaultDocName(1),
        activeDocumentDirty: false,
        activeDocumentOrigin: undefined,
      });
      return;
    }
    const idx = s.documentOrder.indexOf(id);
    if (idx < 0) return;
    const newOrder = s.documentOrder.filter((d) => d !== id);
    const docs = new Map(s.documents);
    docs.delete(id);
    // If we just closed the active tab, switch to the neighbour.
    if (id === s.activeDocumentId) {
      const nextId = newOrder[Math.min(idx, newOrder.length - 1)]!;
      const next = docs.get(nextId);
      if (next) {
        docs.delete(nextId);
        set({
          documents: docs,
          documentOrder: newOrder,
          activeDocumentId: nextId,
          activeDocumentName: next.name,
          activeDocumentDirty: next.dirty,
          activeDocumentOrigin: next.origin,
          document: next.document,
          compiled: compileDocument(next.document, s.library),
          history: next.history,
          redoStack: next.redoStack,
          viewport: next.viewport,
          selection: next.selection,
          tool: IDLE_TOOL,
          simSnapshot: next.simSnapshot,
          simDiagnostics: next.simDiagnostics,
          simComponentStates: next.simComponentStates,
          running: false,
        });
      } else {
        // shouldn't happen, but recover gracefully
        set({
          documents: docs,
          documentOrder: newOrder,
          activeDocumentId: nextId,
        });
      }
    } else {
      set({ documents: docs, documentOrder: newOrder });
    }
  },

  switchDocument: (id) => {
    const s = get();
    if (id === s.activeDocumentId) return;
    if (!s.documentOrder.includes(id)) return;
    const frozen = freezeActive(s);
    const docs = new Map(s.documents);
    docs.set(frozen.id, frozen);
    const target = docs.get(id);
    if (!target) return;
    docs.delete(id);
    set({
      documents: docs,
      activeDocumentId: id,
      activeDocumentName: target.name,
      activeDocumentDirty: target.dirty,
      activeDocumentOrigin: target.origin,
      document: target.document,
      compiled: compileDocument(target.document, s.library),
      history: target.history,
      redoStack: target.redoStack,
      viewport: target.viewport,
      selection: target.selection,
      tool: IDLE_TOOL,
      simSnapshot: target.simSnapshot,
      simDiagnostics: target.simDiagnostics,
      simComponentStates: target.simComponentStates,
      running: false,
    });
  },

  renameDocument: (id, name) => {
    const s = get();
    if (id === s.activeDocumentId) {
      set({ activeDocumentName: name });
      return;
    }
    const target = s.documents.get(id);
    if (!target) return;
    const docs = new Map(s.documents);
    docs.set(id, { ...target, name });
    set({ documents: docs });
  },

  setDocumentOrder: (order) => {
    const s = get();
    if (order.length !== s.documentOrder.length) return;
    const existing = new Set(s.documentOrder);
    for (const id of order) {
      if (!existing.has(id)) return;
    }
    set({ documentOrder: [...order] });
  },
}));

function defaultDocName(n: number): string {
  return n === 1 ? 'main' : `Doc ${n}`;
}

/**
 * Snapshot the active tab's live state into a FrozenDoc — called before
 * switching tabs so the user comes back to the same viewport / history.
 */
function freezeActive(s: AppState): FrozenDoc {
  return {
    id: s.activeDocumentId,
    name: s.activeDocumentName,
    document: s.document,
    history: s.history,
    redoStack: s.redoStack,
    viewport: s.viewport,
    selection: s.selection,
    simSnapshot: s.simSnapshot,
    simDiagnostics: s.simDiagnostics,
    simComponentStates: s.simComponentStates,
    running: s.running,
    tickRate: s.tickRate,
    dirty: s.activeDocumentDirty,
    origin: s.activeDocumentOrigin,
  };
}

function appendBounded<T>(arr: readonly T[], item: T): readonly T[] {
  if (arr.length < HISTORY_CAP) return [...arr, item];
  return [...arr.slice(1), item];
}

/** Convert a screen-space point to world coordinates given a viewport. */
export function screenToWorld(v: Viewport, screenX: number, screenY: number): Point {
  return { x: screenX / v.zoom + v.panX, y: screenY / v.zoom + v.panY };
}

/** Convert a world-space point to screen coordinates given a viewport. */
export function worldToScreen(v: Viewport, worldX: number, worldY: number): Point {
  return { x: (worldX - v.panX) * v.zoom, y: (worldY - v.panY) * v.zoom };
}
