/**
 * Renderer interface — the seam that lets us swap Canvas 2D for PixiJS/WebGL
 * later without touching the rest of the app (ARCHITECTURE.md §4).
 *
 * Inputs:
 *   setDocument   — the visual model (positions, wires)
 *   setViewport   — pan/zoom transform
 *   setSelection  — which components to highlight
 *   setSimSnapshot — (Faz 3+) per-net values for live signal animation
 *   render        — draws one frame from the latest inputs
 *
 * hitTestComponent — world-space query, returns the topmost component id at
 *   that point, or null. Used by the interaction layer.
 */

import type {
  CompiledNetlist,
  ComponentId,
  Diagnostic,
  PortRef,
  SimSnapshot,
} from '@nandbench/engine';
import type { CircuitDocument, Point, WireId } from '../model/document.js';
import type { SavedCircuit } from '../model/library.js';
import type { Tool, Viewport } from '../model/store.js';

export interface RendererSelection {
  readonly componentIds: ReadonlySet<ComponentId>;
  readonly wireIds?: ReadonlySet<WireId>;
}

export interface PinHit {
  readonly ref: PortRef;
  readonly world: Point;
}

export interface Renderer {
  setDocument(doc: CircuitDocument): void;
  setViewport(v: Viewport): void;
  setSelection(s: RendererSelection): void;
  setTool(t: Tool): void;
  setHoverPin(hit: PinHit | null): void;
  setSimSnapshot(snap: SimSnapshot | undefined): void;
  setNetlist(netlist: CompiledNetlist | undefined): void;
  setDiagnostics(diagnostics: readonly Diagnostic[]): void;
  setLibrary(library: readonly SavedCircuit[]): void;
  setRunning(running: boolean): void;
  setSuggestionAnchor(
    anchor: { componentId: ComponentId; world: Point; kinds: readonly string[] } | null,
  ): void;
  hitTestSuggestion(worldX: number, worldY: number): { kind: string; world: Point } | null;
  render(): void;
  hitTestComponent(worldX: number, worldY: number): ComponentId | null;
  hitTestPin(worldX: number, worldY: number): PinHit | null;
  /** Returns the wire id at (worldX, worldY) within a small slop, or null. */
  hitTestWire(worldX: number, worldY: number): WireId | null;
  /** Components fully contained within the given world-space rect. */
  componentsInRect(rect: { x: number; y: number; w: number; h: number }): readonly ComponentId[];
  pinWorld(ref: PortRef): Point | null;
  dispose(): void;
}
