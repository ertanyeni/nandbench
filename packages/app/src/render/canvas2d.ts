/**
 * Canvas 2D implementation of the Renderer.
 *
 * Per ARCHITECTURE.md §4 it never blocks on the engine and draws layered:
 *   - background  — solid fill + grid
 *   - static      — components + wires (the document)
 *   - dynamic     — selection, placement ghost, draft wire, drag preview
 *
 * The "dynamic" layer is driven by transient store state (tool, dragPreview)
 * and re-renders every frame — they're the cheap part.
 */

import type {
  CompiledNetlist,
  ComponentId,
  ComponentParams,
  Diagnostic,
  PortRef,
  SignalValue,
  SimSnapshot,
} from '@nandbench/engine';
import { portKey } from '@nandbench/engine';
import {
  componentWorldBox,
  compositeShape,
  getShape,
  GRID,
  pinWorldPosition,
  rotateShape,
  type ComponentShape,
} from '../model/kinds.js';
import type { CircuitDocument, Point, VisualComponent, VisualWire } from '../model/document.js';
import type { SavedCircuit } from '../model/library.js';
import { lRoute } from '../model/routing.js';
import type { Tool, Viewport } from '../model/store.js';
import { Quadtree } from '../spatial/quadtree.js';
import type { Renderer, RendererSelection } from './renderer.js';

/**
 * Render palette. Mutable on purpose — `applyColorMode` swaps in the
 * color-blind-friendly variant in-place so the renderer always reads the
 * current tones without us threading a config argument everywhere.
 */
const COLORS = {
  background: '#0f1115',
  gridMinor: '#1a1f2a',
  gridMajor: '#222a39',
  wireUndriven: '#5b6573',
  wire0: '#4a5566',
  wire1: '#22c55e',
  wireX: '#ef4444',
  wireZ: '#3b82f6',
  wireMixed: '#a855f7',
  wireDraft: '#60a5fa',
  pin: '#cbd5e1',
  pinHover: '#60a5fa',
  ghost: 'rgba(96, 165, 250, 0.35)',
  ghostStroke: '#60a5fa',
  ledOn: '#22c55e',
  ledOnGlow: 'rgba(34, 197, 94, 0.45)',
  ledOff: '#3a4150',
  ledX: '#ef4444',
};

const PALETTE_DEFAULT = { ...COLORS };
const PALETTE_DEUTERANOPIA = {
  ...COLORS,
  // Replace green→1 with bright yellow, red→X with vivid orange, keep
  // blue→Z. Deuteranopia confuses green/red; yellow/blue/orange survive.
  wire1: '#facc15',
  wireX: '#fb923c',
  wireMixed: '#c084fc',
  ledOn: '#facc15',
  ledOnGlow: 'rgba(250, 204, 21, 0.45)',
  ledX: '#fb923c',
};

export function applyColorMode(mode: 'default' | 'deuteranopia'): void {
  const src = mode === 'deuteranopia' ? PALETTE_DEUTERANOPIA : PALETTE_DEFAULT;
  Object.assign(COLORS, src);
}

const PIN_HIT_RADIUS = 8; // world units around a pin counted as a "pin click"

export interface PinHit {
  readonly ref: PortRef;
  readonly world: Point;
}

export class Canvas2DRenderer implements Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private document: CircuitDocument = { components: [], wires: [] };
  private viewport: Viewport = { panX: 0, panY: 0, zoom: 1 };
  private selection: RendererSelection = { componentIds: new Set() };
  private tool: Tool = { type: 'idle' };
  private simSnapshot: SimSnapshot | undefined;
  private netlist: CompiledNetlist | undefined;
  private diagnostics: readonly Diagnostic[] = [];
  private library: readonly SavedCircuit[] = [];
  private running = false;
  private suggestionAnchor:
    | { componentId: ComponentId; world: Point; kinds: readonly string[] }
    | null = null;
  /** Cached suggestion hint hit-boxes — refreshed each frame. */
  private suggestionHitBoxes: { kind: string; world: Point; r: number }[] = [];
  private readonly shapeCache = new Map<string, ComponentShape>();
  private quadtree: Quadtree<ComponentId> = new Quadtree({ x: 0, y: 0, w: 1, h: 1 });
  private rafScheduled = false;
  private dpr = 1;
  private resizeObserver: ResizeObserver | null = null;
  /** Hovered pin (for highlight); set by the controller. */
  private hoverPin: PinHit | null = null;
  /** Transient pulse highlights — used by the Diagnostics panel to flash the
   *  spot we just panned to. Cleared once their TTL elapses. */
  private pulses: { x: number; y: number; startedAt: number }[] = [];
  private readonly onPulseEvent = (ev: Event): void => {
    const detail = (ev as CustomEvent<{ x: number; y: number }>).detail;
    if (!detail) return;
    this.pulses.push({ x: detail.x, y: detail.y, startedAt: performance.now() });
    this.scheduleRender();
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.handleResize();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);
    window.addEventListener('nandbench:pulse-at', this.onPulseEvent);
  }

  dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('nandbench:pulse-at', this.onPulseEvent);
  }

  setDocument(doc: CircuitDocument): void {
    if (this.document === doc) return;
    this.document = doc;
    this.rebuildSpatialIndex();
    this.scheduleRender();
  }

  setViewport(v: Viewport): void {
    if (this.viewport === v) return;
    this.viewport = v;
    this.scheduleRender();
  }

  setSelection(s: RendererSelection): void {
    if (this.selection === s) return;
    this.selection = s;
    this.scheduleRender();
  }

  setTool(t: Tool): void {
    if (this.tool === t) return;
    this.tool = t;
    this.scheduleRender();
  }

  setHoverPin(hit: PinHit | null): void {
    if (this.hoverPin === hit) return;
    this.hoverPin = hit;
    this.scheduleRender();
  }

  setSimSnapshot(snap: SimSnapshot | undefined): void {
    if (this.simSnapshot === snap) return;
    this.simSnapshot = snap;
    this.scheduleRender();
  }

  setNetlist(netlist: CompiledNetlist | undefined): void {
    if (this.netlist === netlist) return;
    this.netlist = netlist;
    this.scheduleRender();
  }

  setDiagnostics(diagnostics: readonly Diagnostic[]): void {
    if (this.diagnostics === diagnostics) return;
    this.diagnostics = diagnostics;
    this.scheduleRender();
  }

  setLibrary(library: readonly SavedCircuit[]): void {
    if (this.library === library) return;
    this.library = library;
    // Composite shapes depend on the library — invalidate so they re-build.
    this.shapeCache.clear();
    this.rebuildSpatialIndex();
    this.scheduleRender();
  }

  setRunning(running: boolean): void {
    if (this.running === running) return;
    this.running = running;
    this.scheduleRender();
  }

  setSuggestionAnchor(
    anchor: { componentId: ComponentId; world: Point; kinds: readonly string[] } | null,
  ): void {
    this.suggestionAnchor = anchor;
    this.scheduleRender();
  }

  hitTestSuggestion(worldX: number, worldY: number): { kind: string; world: Point } | null {
    for (const box of this.suggestionHitBoxes) {
      const dx = worldX - box.world.x;
      const dy = worldY - box.world.y;
      if (dx * dx + dy * dy <= box.r * box.r) {
        return { kind: box.kind, world: box.world };
      }
    }
    return null;
  }

  render(): void {
    this.rafScheduled = false;
    const { ctx, canvas, viewport } = this;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, cssW, cssH);
    this.drawGrid(cssW, cssH);

    // World → screen transform
    ctx.setTransform(
      viewport.zoom * this.dpr,
      0,
      0,
      viewport.zoom * this.dpr,
      -viewport.panX * viewport.zoom * this.dpr,
      -viewport.panY * viewport.zoom * this.dpr,
    );

    this.drawWires();
    this.drawSignalFlow();
    this.drawComponents();
    this.drawDiagnosticOverlays();
    this.drawSuggestionHints();
    this.drawDraftWire();
    this.drawPlacementGhost();
    this.drawMarquee();
    this.drawHoverPin();
    this.drawPulses();

    ctx.restore();
    void this.simSnapshot;
  }

  componentsInRect(rect: { x: number; y: number; w: number; h: number }): readonly ComponentId[] {
    // queryRect returns intersecting; tighten to "fully contained" so the
    // marquee semantic matches Logisim / Figma.
    const candidates = this.quadtree.queryRect(rect);
    const out: ComponentId[] = [];
    for (const id of candidates) {
      const c = this.document.components.find((x) => x.id === id);
      if (!c) continue;
      const box = componentWorldBox(c.position, this.getOrCacheShape(c));
      if (
        box.x >= rect.x &&
        box.y >= rect.y &&
        box.x + box.w <= rect.x + rect.w &&
        box.y + box.h <= rect.y + rect.h
      ) {
        out.push(id);
      }
    }
    return out;
  }

  hitTestWire(worldX: number, worldY: number): import('../model/document.js').WireId | null {
    // Point-to-segment distance against every wire's polyline. 8 world-px
    // slop matches the visible stroke width + a forgiving margin so users
    // can click "near" the wire without having to land on the pixel.
    const slop = 8;
    const slop2 = slop * slop;
    let best: { dist2: number; id: import('../model/document.js').WireId } | null = null;
    for (const w of this.document.wires) {
      for (let i = 1; i < w.path.length; i++) {
        const a = w.path[i - 1]!;
        const b = w.path[i]!;
        const d2 = pointSegmentDist2(worldX, worldY, a.x, a.y, b.x, b.y);
        if (d2 <= slop2 && (best === null || d2 < best.dist2)) {
          best = { dist2: d2, id: w.id };
        }
      }
    }
    return best?.id ?? null;
  }

  hitTestComponent(worldX: number, worldY: number): ComponentId | null {
    const hits = this.quadtree.queryPoint(worldX, worldY);
    if (hits.length === 0) return null;
    const hitSet = new Set(hits);
    for (let i = this.document.components.length - 1; i >= 0; i--) {
      const c = this.document.components[i]!;
      if (hitSet.has(c.id)) return c.id;
    }
    return null;
  }

  /**
   * Find the pin closest to (worldX, worldY) within PIN_HIT_RADIUS.
   * Returns the pin's PortRef + absolute world position, or null.
   *
   * For Faz 2 sizes (≲ 100 components) a linear scan is fine; we'll add a
   * pin-AABB quadtree once the gate count makes it noticeable.
   */
  hitTestPin(worldX: number, worldY: number): PinHit | null {
    let best: { dist2: number; hit: PinHit } | null = null;
    const r2 = PIN_HIT_RADIUS * PIN_HIT_RADIUS;
    for (const c of this.document.components) {
      const shape = this.getOrCacheShape(c);
      // Cheap early-out: must be within bbox + radius slop.
      const box = componentWorldBox(c.position, shape);
      if (
        worldX < box.x - PIN_HIT_RADIUS ||
        worldX > box.x + box.w + PIN_HIT_RADIUS ||
        worldY < box.y - PIN_HIT_RADIUS ||
        worldY > box.y + box.h + PIN_HIT_RADIUS
      ) {
        continue;
      }
      for (const pin of shape.pins) {
        const px = c.position.x + pin.position.x;
        const py = c.position.y + pin.position.y;
        const ddx = worldX - px;
        const ddy = worldY - py;
        const dist2 = ddx * ddx + ddy * ddy;
        if (dist2 <= r2 && (best === null || dist2 < best.dist2)) {
          best = {
            dist2,
            hit: {
              ref: { componentId: c.id, portName: pin.name },
              world: { x: px, y: py },
            },
          };
        }
      }
    }
    return best?.hit ?? null;
  }

  /** Resolve a pin reference to its current world position. */
  pinWorld(ref: PortRef): Point | null {
    const c = this.document.components.find((x) => x.id === ref.componentId);
    if (!c) return null;
    return pinWorldPosition(c.position, this.getOrCacheShape(c), ref.portName);
  }

  /* -------------------------- internals -------------------------- */

  private handleResize(): void {
    const canvas = this.canvas;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(cssW * this.dpr));
    canvas.height = Math.max(1, Math.floor(cssH * this.dpr));
    this.scheduleRender();
  }

  private scheduleRender(): void {
    if (this.rafScheduled) return;
    this.rafScheduled = true;
    requestAnimationFrame(() => this.render());
  }

  private getOrCacheShape(c: VisualComponent): ComponentShape {
    const key = `${shapeCacheKey(c.kind, c.params)}|r${c.rotation}`;
    let s = this.shapeCache.get(key);
    if (!s) {
      s = this.buildShape(c);
      this.shapeCache.set(key, s);
    }
    return s;
  }

  private buildShape(c: VisualComponent): ComponentShape {
    let s: ComponentShape;
    if (c.kind.startsWith('composite:')) {
      const refId = String(c.params['refId'] ?? '');
      const saved = this.library.find((sc) => sc.id === refId);
      s = saved
        ? compositeShape({
            label: saved.name || 'COMPOSITE',
            inputs: saved.inputs.map((p) => ({ name: p.name, width: p.width })),
            outputs: saved.outputs.map((p) => ({ name: p.name, width: p.width })),
          })
        : compositeShape({ label: '?', inputs: [], outputs: [] });
    } else {
      s = getShape(c.kind, c.params);
    }
    if (c.rotation !== 0) s = rotateShape(s, c.rotation);
    return s;
  }

  private rebuildSpatialIndex(): void {
    const items = this.document.components.map((c) => {
      const shape = this.getOrCacheShape(c);
      const bbox = componentWorldBox(c.position, shape);
      return { bbox, payload: c.id };
    });
    this.quadtree = Quadtree.build(items);
  }

  private drawGrid(cssW: number, cssH: number): void {
    const { ctx, viewport } = this;
    const z = viewport.zoom;
    const step = GRID * z;
    if (step < 4) return;
    const startWorldX = viewport.panX;
    const startWorldY = viewport.panY;
    const firstX = Math.floor(startWorldX / GRID) * GRID;
    const firstY = Math.floor(startWorldY / GRID) * GRID;
    ctx.lineWidth = 1;
    for (let wx = firstX; (wx - startWorldX) * z < cssW; wx += GRID) {
      const sx = (wx - startWorldX) * z;
      ctx.strokeStyle = wx % (GRID * 5) === 0 ? COLORS.gridMajor : COLORS.gridMinor;
      ctx.beginPath();
      ctx.moveTo(Math.round(sx) + 0.5, 0);
      ctx.lineTo(Math.round(sx) + 0.5, cssH);
      ctx.stroke();
    }
    for (let wy = firstY; (wy - startWorldY) * z < cssH; wy += GRID) {
      const sy = (wy - startWorldY) * z;
      ctx.strokeStyle = wy % (GRID * 5) === 0 ? COLORS.gridMajor : COLORS.gridMinor;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(sy) + 0.5);
      ctx.lineTo(cssW, Math.round(sy) + 0.5);
      ctx.stroke();
    }
  }

  private drawComponents(): void {
    const { ctx } = this;
    const move = this.activeMove();
    for (const c of this.document.components) {
      const shape = this.getOrCacheShape(c);
      const selected = this.selection.componentIds.has(c.id);
      const pos = move && move.ids.has(c.id)
        ? { x: c.position.x + move.delta.x, y: c.position.y + move.delta.y }
        : c.position;
      ctx.save();
      ctx.translate(pos.x, pos.y);
      shape.draw(ctx, { selected });
      // User-supplied display label (free-form text the user typed into
      // the Inspector). Rendered above the shape's bbox, centered.
      this.drawUserLabel(c, shape);
      // Per-kind dynamic overlays (LED glow, input switch state).
      this.drawDynamicOverlay(c, shape);
      ctx.fillStyle = COLORS.pin;
      for (const pin of shape.pins) {
        const sig = this.signalForPort({ componentId: c.id, portName: pin.name });
        ctx.fillStyle = sig ? pinColorForSignal(sig) : COLORS.pin;
        ctx.beginPath();
        ctx.arc(pin.position.x, pin.position.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Inline output-value chip — small label next to the bbox showing
      // the current snapshot value of the component's primary output.
      // Skipped for IO peripherals (LED / 7-seg already show the value
      // through their built-in animation, input/button via the dot).
      this.drawInlineValueChip(c, shape);
      if (c.kind.startsWith('composite:')) {
        this.drawCompositeBadge(shape);
      }
      if (selected && this.selection.componentIds.size === 1) {
        this.drawSelectionInfoChip(c, shape);
      }
      ctx.restore();
    }
  }

  /**
   * Faint kind/info chip above the bbox of a singularly-selected
   * component — saves the user a glance at the Inspector when they
   * just need a reminder of what's selected.
   */
  private drawSelectionInfoChip(c: VisualComponent, shape: ComponentShape): void {
    const { ctx } = this;
    const text = chipTextFor(c);
    if (!text) return;
    ctx.save();
    ctx.font = '600 10px ui-sans-serif, system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const padX = 5;
    const padY = 2;
    const m = ctx.measureText(text);
    const w = m.width + padX * 2;
    const h = 14;
    // Place at the top-left of the bbox, just outside the shape so it
    // doesn't sit on top of pins or a user label.
    const x = 0;
    const y = -h - 4;
    ctx.fillStyle = 'rgba(96, 165, 250, 0.18)';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(x, y, w, h, 3);
    if (!ctx.roundRect) ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dbeafe';
    ctx.fillText(text, x + padX, y + h / 2);
    ctx.restore();
    void shape;
  }

  /**
   * Free-form user label rendered above a component's bbox, centered.
   * Sourced from `params.label`. We trim and bail on empty strings so
   * a "Label" inspector input doesn't auto-paint when the user just
   * opens it.
   */
  private drawUserLabel(c: VisualComponent, shape: ComponentShape): void {
    const raw = c.params['label'];
    if (typeof raw !== 'string') return;
    const text = raw.trim();
    if (text.length === 0) return;
    const { ctx } = this;
    ctx.save();
    ctx.font = '600 11px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const x = shape.bbox.w / 2;
    const y = -6;
    const metrics = ctx.measureText(text);
    const padX = 6;
    const padY = 2;
    const boxW = metrics.width + padX * 2;
    const boxH = 14;
    ctx.fillStyle = 'rgba(31, 41, 55, 0.92)';
    ctx.strokeStyle = '#3b6ec3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(x - boxW / 2, y - boxH + padY, boxW, boxH, 4);
    if (!ctx.roundRect) ctx.rect(x - boxW / 2, y - boxH + padY, boxW, boxH);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dbeafe';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Tiny ⤢ badge in the top-right of a composite instance — a wordless
   * "this opens" affordance pairing with the canvas double-click handler.
   */
  private drawCompositeBadge(shape: ComponentShape): void {
    const { ctx } = this;
    const size = 14;
    const x = shape.bbox.w - size - 4;
    const y = 4;
    ctx.fillStyle = 'rgba(96, 165, 250, 0.18)';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(x, y, size, size, 3);
    if (!ctx.roundRect) ctx.rect(x, y, size, size);
    ctx.fill();
    ctx.stroke();
    // Diagonal arrow glyph inside.
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + size - 3);
    ctx.lineTo(x + size - 3, y + 3);
    ctx.moveTo(x + size - 7, y + 3);
    ctx.lineTo(x + size - 3, y + 3);
    ctx.lineTo(x + size - 3, y + 7);
    ctx.stroke();
  }

  private drawInlineValueChip(c: VisualComponent, shape: ComponentShape): void {
    if (c.kind === 'led' || c.kind === '7seg' || c.kind === 'input' || c.kind === 'button') return;
    if (c.kind.startsWith('composite:')) return;
    // Pick the "primary" output to chip — preference order. Most primitives
    // expose one of these; we render the first match.
    const candidates = ['out', 'q', 'sum', 'lo'];
    let portName: string | null = null;
    for (const p of candidates) {
      if (shape.pins.some((pin) => pin.name === p)) {
        portName = p;
        break;
      }
    }
    if (!portName) return;
    const sig = this.signalForPort({ componentId: c.id, portName });
    if (!sig) return;
    const text = formatSignalChip(sig);
    if (!text) return;
    const { ctx } = this;
    const fontSize = 9;
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const padX = 4;
    const padY = 1;
    const tw = ctx.measureText(text).width;
    const chipW = tw + padX * 2;
    const chipH = fontSize + padY * 2 + 2;
    // Place near the top-right corner of the component bbox.
    const x = shape.bbox.w - chipW - 2;
    const y = 2;
    ctx.fillStyle = 'rgba(15, 17, 21, 0.85)';
    ctx.strokeStyle = chipBorderForSignal(sig);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(x, y, chipW, chipH, 3);
    if (!ctx.roundRect) {
      ctx.rect(x, y, chipW, chipH);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = chipTextForSignal(sig);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x + padX, y + padY + 1);
  }

  /**
   * Component-specific overlays driven by the current simulation snapshot.
   * LED lights, input/button "pressed" highlight, 7-segment lit segments,
   * register / counter state readouts. Drawn in the component's local
   * coordinate space (already translated).
   */
  private drawDynamicOverlay(c: VisualComponent, shape: ComponentShape): void {
    if (c.kind === 'led') {
      const sig = this.signalForPort({ componentId: c.id, portName: 'in' });
      const w = shape.bbox.w;
      const h = shape.bbox.h;
      const cx = w / 2 + 4;
      const cy = h / 2;
      let fill: string = COLORS.ledOff;
      let glow: string | null = null;
      if (sig) {
        if (sig.unknown !== 0n) fill = COLORS.ledX;
        else if (sig.value !== 0n) {
          fill = COLORS.ledOn;
          glow = COLORS.ledOnGlow;
        }
      }
      const { ctx } = this;
      if (glow) {
        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 14;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cx, cy, h / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cx, cy, h / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9aa4b2';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      return;
    }
    if (c.kind === 'input' || c.kind === 'button') {
      const sig = this.signalForPort({ componentId: c.id, portName: 'out' });
      if (sig && sig.unknown === 0n && sig.hiZ === 0n) {
        const isHigh = sig.value !== 0n;
        const { ctx } = this;
        ctx.fillStyle = isHigh ? '#22c55e' : 'transparent';
        if (isHigh) {
          ctx.beginPath();
          ctx.arc(shape.bbox.w / 2, shape.bbox.h / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }
    if (c.kind === '7seg') {
      // Draw real segments from net values.
      this.drawSevenSegment(c, shape);
      return;
    }
  }

  private drawSevenSegment(c: VisualComponent, shape: ComponentShape): void {
    const { ctx } = this;
    const w = shape.bbox.w;
    const h = shape.bbox.h;
    // Cover the "8." text placeholder.
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(w / 2 - 18, h / 2 - 24, 36, 50);
    // Segment geometry inside a bounding sub-rect.
    const cx = w / 2;
    const cy = h / 2;
    const sw = 22;
    const sh = 36;
    const t = 3;
    const lit = (name: string): boolean => {
      const sig = this.signalForPort({ componentId: c.id, portName: name });
      return !!sig && sig.unknown === 0n && sig.hiZ === 0n && sig.value !== 0n;
    };
    const seg = (name: string, x: number, y: number, w2: number, h2: number): void => {
      ctx.fillStyle = lit(name) ? COLORS.ledOn : '#2a3140';
      ctx.fillRect(x, y, w2, h2);
    };
    const left = cx - sw / 2;
    const right = cx + sw / 2 - t;
    const top = cy - sh / 2;
    const middle = cy - t / 2;
    const bottom = cy + sh / 2 - t;
    seg('a', left + t, top, sw - 2 * t, t);
    seg('b', right, top + t, t, sh / 2 - 2 * t);
    seg('c', right, middle + 2 * t, t, sh / 2 - 2 * t);
    seg('d', left + t, bottom, sw - 2 * t, t);
    seg('e', left, middle + 2 * t, t, sh / 2 - 2 * t);
    seg('f', left, top + t, t, sh / 2 - 2 * t);
    seg('g', left + t, middle, sw - 2 * t, t);
    if (lit('dp')) {
      ctx.fillStyle = COLORS.ledOn;
      ctx.beginPath();
      ctx.arc(right + t, bottom + t, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawWires(): void {
    const { ctx } = this;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const move = this.activeMove();
    const selectedWires = this.selection.wireIds ?? new Set<string>();
    for (const wire of this.document.wires) {
      const path = this.effectiveWirePath(wire, move);
      if (path.length < 2) continue;
      const isSelected = selectedWires.has(wire.id);
      const style = this.styleForWire(wire);
      // Selection halo behind the actual stroke.
      if (isSelected) {
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.55)';
        ctx.lineWidth = 6;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(path[0]!.x, path[0]!.y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i]!.x, path[i]!.y);
        ctx.stroke();
      }
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.setLineDash(style.dash);
      ctx.beginPath();
      ctx.moveTo(path[0]!.x, path[0]!.y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i]!.x, path[i]!.y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineWidth = 1.8;
    this.drawJunctionDots(move);
  }

  private styleForWire(wire: VisualWire): { color: string; width: number; dash: number[] } {
    const v = this.signalForPort(wire.endpoints[0]) ?? this.signalForPort(wire.endpoints[1]);
    if (!v || v.width === 0) {
      // No sim yet OR genuinely no engine binding — dim gray, dashed to
      // visually shout "no data flowing here".
      return { color: COLORS.wireUndriven, width: 1.4, dash: [3, 4] };
    }
    const widthMask = (1n << BigInt(v.width)) - 1n;
    // Pure Z (high impedance, no driver) → blue dashed.
    if ((v.hiZ & widthMask) === widthMask) {
      return { color: COLORS.wireZ, width: 1.6, dash: [6, 4] };
    }
    // Any X bit → red, fat, solid (urgent).
    if ((v.unknown & widthMask) !== 0n) {
      return {
        color: v.unknown === widthMask ? COLORS.wireX : COLORS.wireMixed,
        width: 2.4,
        dash: [],
      };
    }
    // Partial Z (mix of Z + defined bits) → dotted.
    if ((v.hiZ & widthMask) !== 0n) {
      return { color: COLORS.wireMixed, width: 1.8, dash: [2, 3] };
    }
    // Fully defined.
    return {
      color: v.value !== 0n ? COLORS.wire1 : COLORS.wire0,
      width: 1.8,
      dash: [],
    };
  }

  /**
   * Junction dots — visually distinguish "two wires happen to cross" from
   * "the two wires are electrically joined." We dot every point where:
   *   (a) two or more wire segments belonging to the SAME net meet, and
   *   (b) those segments come from at least 3 distinct directions (so a
   *       simple L-bend doesn't get a dot).
   * Color matches the net's current value, so junctions glow too.
   */
  private drawJunctionDots(
    move: { ids: ReadonlySet<ComponentId>; delta: Point } | null,
  ): void {
    if (!this.netlist) return;
    const { ctx } = this;
    // Map: "x,y" → { netId, dirs: Set<dir> }
    type DirSet = { netId: string; dirs: Set<string> };
    const points = new Map<string, DirSet>();
    const keyOf = (p: Point): string => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const dirOf = (from: Point, to: Point): string => {
      if (to.x > from.x) return 'r';
      if (to.x < from.x) return 'l';
      if (to.y > from.y) return 'd';
      if (to.y < from.y) return 'u';
      return '0';
    };
    for (const wire of this.document.wires) {
      const netId = this.netIdForRef(wire.endpoints[0]) ?? this.netIdForRef(wire.endpoints[1]);
      if (!netId) continue;
      const path = this.effectiveWirePath(wire, move);
      for (let i = 0; i < path.length; i++) {
        const p = path[i]!;
        const k = keyOf(p);
        let rec = points.get(k);
        if (!rec) {
          rec = { netId, dirs: new Set() };
          points.set(k, rec);
        }
        if (rec.netId !== netId) continue; // crossing of different nets — no dot
        if (i > 0) rec.dirs.add(dirOf(p, path[i - 1]!));
        if (i < path.length - 1) rec.dirs.add(dirOf(p, path[i + 1]!));
      }
    }
    for (const [k, rec] of points) {
      if (rec.dirs.size < 3) continue;
      const [xStr, yStr] = k.split(',');
      const x = parseFloat(xStr!);
      const y = parseFloat(yStr!);
      const v = this.simSnapshot?.nets.get(rec.netId as never);
      ctx.fillStyle = colorForSignal(v) === COLORS.wireUndriven ? '#cbd5e1' : colorForSignal(v);
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private netIdForRef(ref: PortRef): string | undefined {
    if (!this.netlist) return undefined;
    return this.netlist.portToNet.get(portKey(ref.componentId, ref.portName)) as
      | string
      | undefined;
  }

  private colorForWire(wire: VisualWire): string {
    const v = this.signalForPort(wire.endpoints[0]) ?? this.signalForPort(wire.endpoints[1]);
    return colorForSignal(v);
  }

  private signalForPort(ref: PortRef): SignalValue | undefined {
    if (!this.netlist || !this.simSnapshot) return undefined;
    const netId = this.netlist.portToNet.get(portKey(ref.componentId, ref.portName));
    if (!netId) return undefined;
    return this.simSnapshot.nets.get(netId);
  }

  private activeMove(): { ids: ReadonlySet<ComponentId>; delta: Point } | null {
    if (this.tool.type !== 'move') return null;
    if (this.tool.delta.x === 0 && this.tool.delta.y === 0) {
      return { ids: new Set(this.tool.originalPositions.keys()), delta: this.tool.delta };
    }
    return { ids: new Set(this.tool.originalPositions.keys()), delta: this.tool.delta };
  }

  private effectiveWirePath(
    wire: VisualWire,
    move: { ids: ReadonlySet<ComponentId>; delta: Point } | null,
  ): readonly Point[] {
    if (!move || (move.delta.x === 0 && move.delta.y === 0)) return wire.path;
    const aMoving = move.ids.has(wire.endpoints[0].componentId);
    const bMoving = move.ids.has(wire.endpoints[1].componentId);
    if (!aMoving && !bMoving) return wire.path;
    const aWorld = this.pinPositionUnder(wire.endpoints[0], move);
    const bWorld = this.pinPositionUnder(wire.endpoints[1], move);
    if (!aWorld || !bWorld) return wire.path;
    return lRoute(aWorld, bWorld);
  }

  private pinPositionUnder(
    ref: PortRef,
    move: { ids: ReadonlySet<ComponentId>; delta: Point } | null,
  ): Point | null {
    const c = this.document.components.find((x) => x.id === ref.componentId);
    if (!c) return null;
    const base = pinWorldPosition(c.position, this.getOrCacheShape(c), ref.portName);
    if (move && move.ids.has(c.id)) {
      return { x: base.x + move.delta.x, y: base.y + move.delta.y };
    }
    return base;
  }

  private drawDraftWire(): void {
    if (this.tool.type !== 'wire') return;
    const { ctx } = this;
    const path = this.tool.path.slice();
    if (this.tool.hoverWorld) {
      // Add a temporary L-segment from the last committed waypoint to the hover.
      const last = path[path.length - 1];
      if (last) {
        if (last.x !== this.tool.hoverWorld.x && last.y !== this.tool.hoverWorld.y) {
          // Add a bend (HV by default — pin sides usually face horizontally).
          path.push({ x: this.tool.hoverWorld.x, y: last.y });
        }
        path.push(this.tool.hoverWorld);
      }
    }
    if (path.length < 2) return;
    ctx.strokeStyle = COLORS.wireDraft;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(path[0]!.x, path[0]!.y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i]!.x, path[i]!.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawPlacementGhost(): void {
    if (this.tool.type !== 'place' || !this.tool.ghostWorld) return;
    const { ctx } = this;
    const shape = this.getOrCacheShape({
      id: 'ghost' as ComponentId,
      kind: this.tool.kind,
      params: this.tool.params,
      position: this.tool.ghostWorld,
      rotation: 0,
    });
    ctx.save();
    ctx.translate(this.tool.ghostWorld.x, this.tool.ghostWorld.y);
    ctx.globalAlpha = 0.55;
    shape.draw(ctx, { selected: false });
    ctx.fillStyle = COLORS.pin;
    for (const pin of shape.pins) {
      ctx.beginPath();
      ctx.arc(pin.position.x, pin.position.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Inline diagnostic overlays — the live-debugging killer feature.
   *   width-mismatch / floating-input: a triangle on the offending port
   *   multi-driver: a red ring around every driver pin on the net
   *   oscillation: a pulsing border on each net's driver+sink pins
   *
   * Drawn in world space; size is scaled inversely with zoom so markers
   * don't shrink to invisibility at low zoom or balloon at high zoom.
   */
  private drawDiagnosticOverlays(): void {
    if (this.diagnostics.length === 0) return;
    const { ctx, viewport } = this;
    const z = viewport.zoom;
    const sized = (px: number): number => px / z;
    const phase = (Date.now() % 1000) / 1000; // 0..1
    const pulse = 0.6 + 0.4 * Math.sin(phase * Math.PI * 2);

    for (const d of this.diagnostics) {
      switch (d.kind) {
        case 'width-mismatch': {
          const p = this.pinPositionUnder(d.port, this.activeMove());
          if (p) this.drawWarning(p, sized(10), '#f59e0b');
          break;
        }
        case 'floating-input': {
          const p = this.pinPositionUnder(d.port, this.activeMove());
          if (p) this.drawQuestion(p, sized(8), '#3b82f6');
          break;
        }
        case 'multi-driver': {
          for (const driver of d.drivers) {
            const p = this.pinPositionUnder(driver, this.activeMove());
            if (p) {
              ctx.strokeStyle = `rgba(239, 68, 68, ${pulse.toFixed(3)})`;
              ctx.lineWidth = sized(2.4);
              ctx.beginPath();
              ctx.arc(p.x, p.y, sized(8), 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          break;
        }
        case 'oscillation': {
          if (!this.netlist) break;
          for (const netId of d.nets) {
            const net = this.netlist.nets.get(netId);
            if (!net) continue;
            for (const ref of [...net.drivers, ...net.sinks]) {
              const p = this.pinPositionUnder(ref, this.activeMove());
              if (!p) continue;
              ctx.strokeStyle = `rgba(245, 158, 11, ${pulse.toFixed(3)})`;
              ctx.lineWidth = sized(2);
              ctx.beginPath();
              ctx.arc(p.x, p.y, sized(10), 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          break;
        }
      }
    }
    // Schedule another frame while pulsing diagnostics exist so the animation
    // keeps moving even if nothing else changes.
    if (this.diagnostics.some((d) => d.kind === 'multi-driver' || d.kind === 'oscillation')) {
      this.scheduleRender();
    }
  }

  private drawWarning(p: Point, r: number, color: string): void {
    const { ctx } = this;
    // Triangle with "!" interior.
    ctx.save();
    ctx.translate(p.x + r * 0.6, p.y - r * 0.6);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#0f1115';
    ctx.lineWidth = 1.2 / this.viewport.zoom;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.95, r * 0.7);
    ctx.lineTo(-r * 0.95, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f1115';
    ctx.font = `${Math.max(8, r * 1.3)}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, r * 0.15);
    ctx.restore();
  }

  private drawQuestion(p: Point, r: number, color: string): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(p.x + r * 0.7, p.y - r * 0.7);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#0f1115';
    ctx.lineWidth = 1.2 / this.viewport.zoom;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f1115';
    ctx.font = `${Math.max(8, r * 1.4)}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, r * 0.15);
    ctx.restore();
  }

  /**
   * Moving dots on wires whose resolved value is fully 1, when the sim is
   * running. Direction is driver → sinks; we compute the canonical path from
   * the net's first driver outward. Cheap per-frame work; we re-schedule
   * while any animated wire exists so the dots keep moving.
   */
  private drawSignalFlow(): void {
    if (!this.running || !this.netlist || !this.simSnapshot) return;
    const { ctx } = this;
    const move = this.activeMove();
    const phase = (Date.now() % 1200) / 1200;
    const SPACING = 80;
    let anyActive = false;

    for (const wire of this.document.wires) {
      const netId =
        this.netIdForRef(wire.endpoints[0]) ?? this.netIdForRef(wire.endpoints[1]);
      if (!netId) continue;
      const net = this.netlist.nets.get(netId as never);
      if (!net) continue;
      const v = this.simSnapshot.nets.get(netId as never);
      if (!v || v.width === 0) continue;
      const widthMask = (1n << BigInt(v.width)) - 1n;
      if (v.unknown !== 0n || v.hiZ !== 0n) continue;
      if (v.value !== widthMask) continue; // fully 1 only — clean signal
      // Decide path orientation: start endpoint must be a driver.
      const path = this.effectiveWirePath(wire, move);
      if (path.length < 2) continue;
      const driverIds = new Set(net.drivers.map((d) => d.componentId));
      const startEndpoint = wire.endpoints[0];
      const startIsDriver = driverIds.has(startEndpoint.componentId);
      const orientedPath = startIsDriver ? path : [...path].reverse();
      const segLengths = this.segmentLengths(orientedPath);
      const totalLen = segLengths.reduce((a, b) => a + b, 0);
      if (totalLen < 16) continue;
      const dotCount = Math.max(1, Math.floor(totalLen / SPACING));
      for (let i = 0; i < dotCount; i++) {
        const fraction = (i / dotCount + phase) % 1;
        const dist = fraction * totalLen;
        const pos = this.pointAtDistance(orientedPath, segLengths, dist);
        if (!pos) continue;
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      anyActive = true;
    }
    if (anyActive) this.scheduleRender();
  }

  private segmentLengths(path: readonly Point[]): number[] {
    const out: number[] = [];
    for (let i = 1; i < path.length; i++) {
      const dx = path[i]!.x - path[i - 1]!.x;
      const dy = path[i]!.y - path[i - 1]!.y;
      out.push(Math.sqrt(dx * dx + dy * dy));
    }
    return out;
  }

  private pointAtDistance(
    path: readonly Point[],
    lengths: readonly number[],
    distance: number,
  ): Point | null {
    let remaining = distance;
    for (let i = 0; i < lengths.length; i++) {
      const len = lengths[i]!;
      if (remaining <= len) {
        const ratio = len === 0 ? 0 : remaining / len;
        const a = path[i]!;
        const b = path[i + 1]!;
        return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
      }
      remaining -= len;
    }
    return null;
  }

  /**
   * Soft "+" hints near the most recently placed component, one per
   * suggested kind. Click handler lives in the controller, which uses
   * hitTestSuggestion() against the boxes we cache here.
   */
  private drawSuggestionHints(): void {
    this.suggestionHitBoxes = [];
    const anchor = this.suggestionAnchor;
    if (!anchor) return;
    const comp = this.document.components.find((c) => c.id === anchor.componentId);
    if (!comp) return;
    const shape = this.getOrCacheShape(comp);
    // Departure point + extension direction follow the component's
    // natural output side. Output-style parts (LEDs, outputs) have only
    // a left pin — their suggestions then extend to the *left*.
    const rightPin = shape.pins.find((p) => p.side === 'right');
    const leftPin = shape.pins.find((p) => p.side === 'left');
    const useLeftSide = !rightPin && !!leftPin;
    const sourcePin = rightPin ?? leftPin;
    let pinPos: Point = {
      x: comp.position.x + (useLeftSide ? 0 : shape.bbox.w),
      y: comp.position.y + shape.bbox.h / 2,
    };
    if (sourcePin) {
      pinPos = {
        x: comp.position.x + sourcePin.position.x,
        y: comp.position.y + sourcePin.position.y,
      };
    }
    const baseOffset = useLeftSide ? -80 : 80;
    const spacing = 34;
    // Show up to 5 suggestions when the table provides them — gives the
    // user a richer "what comes next" picture without overcrowding.
    const kinds = anchor.kinds.slice(0, 5);
    const { ctx } = this;
    const phase = (Date.now() % 1500) / 1500;
    const pulse = 0.65 + 0.35 * Math.sin(phase * Math.PI * 2);
    kinds.forEach((k, i) => {
      const x = pinPos.x + baseOffset;
      const y = pinPos.y + (i - (kinds.length - 1) / 2) * spacing;
      const r = 12;
      this.suggestionHitBoxes.push({ kind: k, world: { x, y }, r });
      ctx.save();
      ctx.fillStyle = `rgba(96, 165, 250, ${(0.18 * pulse).toFixed(3)})`;
      ctx.strokeStyle = `rgba(96, 165, 250, ${(0.85 * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.4 / this.viewport.zoom;
      // Dashed connector from the pin to the hint, ending at the
      // hint circle's near edge.
      ctx.setLineDash([4 / this.viewport.zoom, 3 / this.viewport.zoom]);
      ctx.beginPath();
      ctx.moveTo(pinPos.x, pinPos.y);
      ctx.lineTo(x + (useLeftSide ? r : -r), y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5 / this.viewport.zoom;
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y + 5);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `${Math.max(8, 10 / this.viewport.zoom)}px ui-sans-serif, system-ui`;
      ctx.textAlign = useLeftSide ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(k, x + (useLeftSide ? -(r + 4) : r + 4), y);
      ctx.restore();
    });
    this.scheduleRender();
  }

  private drawMarquee(): void {
    if (this.tool.type !== 'marquee') return;
    const { ctx } = this;
    const a = this.tool.anchorWorld;
    const b = this.tool.hoverWorld;
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    ctx.save();
    // Beefier fill + double-stroke for a cleaner selection feel.
    ctx.fillStyle = 'rgba(96, 165, 250, 0.18)';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.4 / this.viewport.zoom;
    ctx.setLineDash([8 / this.viewport.zoom, 5 / this.viewport.zoom]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    // Count badge at top-right corner — how many components currently
    // sit inside the marquee.
    const candidates = this.componentsInRect({ x, y, w, h });
    if (candidates.length > 0 && (w > 30 || h > 30)) {
      const badgeText = String(candidates.length);
      const fontSize = 11 / this.viewport.zoom;
      ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const padX = 5 / this.viewport.zoom;
      const padY = 2 / this.viewport.zoom;
      const tw = ctx.measureText(badgeText).width;
      const badgeW = tw + padX * 2;
      const badgeH = fontSize + padY * 2 + 2 / this.viewport.zoom;
      const bx = x + w - badgeW - 2 / this.viewport.zoom;
      const by = y + 2 / this.viewport.zoom;
      ctx.fillStyle = '#1f3a66';
      ctx.fillRect(bx, by, badgeW, badgeH);
      ctx.fillStyle = '#dbeafe';
      ctx.fillText(badgeText, bx + padX, by + padY);
    }
    ctx.restore();
  }

  private drawHoverPin(): void {
    if (!this.hoverPin) return;
    const { ctx } = this;
    ctx.fillStyle = COLORS.pinHover;
    ctx.strokeStyle = COLORS.pinHover;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.hoverPin.world.x, this.hoverPin.world.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.hoverPin.world.x, this.hoverPin.world.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Transient halo at each active pulse point — expanding ring with
   * easing opacity decay. ~1s lifetime per pulse.
   */
  private drawPulses(): void {
    if (this.pulses.length === 0) return;
    const TTL = 1100;
    const now = performance.now();
    this.pulses = this.pulses.filter((p) => now - p.startedAt < TTL);
    if (this.pulses.length === 0) return;
    const { ctx } = this;
    for (const p of this.pulses) {
      const t = (now - p.startedAt) / TTL;
      const radius = 6 + 30 * t;
      const alpha = (1 - t) * 0.85;
      ctx.strokeStyle = `rgba(250, 204, 21, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      // Inner solid dot for the first 400ms.
      if (t < 0.4) {
        ctx.fillStyle = `rgba(250, 204, 21, ${(0.55 * (1 - t / 0.4)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    this.scheduleRender();
  }
}

function shapeCacheKey(kind: string, params: ComponentParams): string {
  // Stable key by sorting param entries.
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${kind}|${entries.map(([k, v]) => `${k}=${String(v)}`).join('&')}`;
}

/**
 * Short label for the in-canvas selection chip. Combines the kind with
 * the one or two parameters that matter for that kind (bit width, gate
 * input count) so the user gets a one-glance summary.
 */
function chipTextFor(c: VisualComponent): string {
  const k = c.kind;
  const params = c.params;
  if (k.startsWith('composite:')) return 'composite';
  const w = typeof params['width'] === 'number' ? (params['width'] as number) : null;
  const inputs = typeof params['inputs'] === 'number' ? (params['inputs'] as number) : null;
  const parts: string[] = [k.toUpperCase()];
  if (inputs !== null && inputs !== 2) parts.push(`${inputs}-in`);
  if (w !== null && w !== 1) parts.push(`${w}b`);
  return parts.join(' · ');
}

/** Map a 4-valued multi-bit SignalValue to a wire color. */
function colorForSignal(v: SignalValue | undefined): string {
  if (!v) return COLORS.wireUndriven;
  if (v.width === 0) return COLORS.wireUndriven;
  const widthMask = (1n << BigInt(v.width)) - 1n;
  if ((v.unknown & widthMask) !== 0n) {
    // Any X bit — wire is in conflict / undefined.
    return v.unknown === widthMask ? COLORS.wireX : COLORS.wireMixed;
  }
  if ((v.hiZ & widthMask) === widthMask) return COLORS.wireZ;
  if ((v.hiZ & widthMask) !== 0n) return COLORS.wireMixed;
  // Fully defined: pick by majority-of-bits-set heuristic. For 1-bit signals
  // this is exact; for buses we color "active" if any bit is 1.
  return v.value !== 0n ? COLORS.wire1 : COLORS.wire0;
}

/** Pin dot color — same palette but a touch lighter for visibility. */
function pinColorForSignal(v: SignalValue): string {
  return colorForSignal(v);
}

/**
 * Render a SignalValue as a chip-friendly token. Returns "" for empty
 * width signals so the chip is suppressed. Multi-bit values render in hex.
 */
function formatSignalChip(v: SignalValue): string {
  if (v.width === 0) return '';
  const widthMask = (1n << BigInt(v.width)) - 1n;
  if (v.unknown !== 0n && (v.unknown & widthMask) === widthMask) return 'X';
  if (v.hiZ !== 0n && (v.hiZ & widthMask) === widthMask) return 'Z';
  if (v.unknown !== 0n || v.hiZ !== 0n) return '?';
  if (v.width === 1) return (v.value & 1n) === 1n ? '1' : '0';
  return `0x${v.value.toString(16).toUpperCase()}`;
}

function chipBorderForSignal(v: SignalValue): string {
  const widthMask = (1n << BigInt(v.width)) - 1n;
  if (v.unknown !== 0n) return '#ef4444';
  if (v.hiZ !== 0n && (v.hiZ & widthMask) === widthMask) return '#3b82f6';
  if (v.width === 1 && (v.value & 1n) === 1n) return '#22c55e';
  return '#3a4150';
}

function chipTextForSignal(v: SignalValue): string {
  if (v.unknown !== 0n) return '#fca5a5';
  const widthMask = (1n << BigInt(v.width)) - 1n;
  if (v.hiZ !== 0n && (v.hiZ & widthMask) === widthMask) return '#93c5fd';
  if (v.width === 1 && (v.value & 1n) === 1n) return '#86efac';
  return '#cbd5e1';
}

/** Squared distance from point (px,py) to the segment (ax,ay)–(bx,by). */
function pointSegmentDist2(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    const ex = px - ax;
    const ey = py - ay;
    return ex * ex + ey * ey;
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return ex * ex + ey * ey;
}
