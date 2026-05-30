// @vitest-environment happy-dom
/**
 * Canvas controller integration test. We don't paint anything — instead
 * a stub Renderer reports hit-test results we control, and we drive a
 * scripted sequence of pointer events at the canvas to verify the
 * controller dispatches the right store mutations.
 *
 * Covered flows:
 *   - place tool commits a component on pointerdown
 *   - wire tool starts on pin click, commits on second pin click
 *   - empty pointerdown clears selection
 *   - Shift+click on empty starts a marquee
 *   - drag on selected component triggers MoveComponentsCommand
 *   - suggestion-hint click promotes to place tool with that kind
 */

import { asComponentId, type ComponentId } from '@gatecraft/engine';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { attachCanvasController } from '../src/interaction/canvas-controller.js';
import { asWireId, type Point, type VisualComponent } from '../src/model/document.js';
import { IDLE_TOOL, INITIAL_VIEWPORT, useAppStore } from '../src/model/store.js';
import type { PinHit, Renderer, RendererSelection } from '../src/render/renderer.js';

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => ({}),
    }),
  });
  // happy-dom doesn't ship pointer capture by default — stub so the
  // controller doesn't throw when it asks the canvas to capture.
  const cap = new Set<number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (canvas as any).setPointerCapture = (id: number): void => {
    cap.add(id);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (canvas as any).releasePointerCapture = (id: number): void => {
    cap.delete(id);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (canvas as any).hasPointerCapture = (id: number): boolean => cap.has(id);
  return canvas;
}

interface RendererStubControls {
  hitComponentResult: ComponentId | null;
  hitPinResult: PinHit | null;
  hitWireResult: null;
  hitSuggestionResult: { kind: string; world: Point } | null;
}

function makeRenderer(controls: RendererStubControls): Renderer {
  return {
    setDocument: () => undefined,
    setViewport: () => undefined,
    setSelection: (_s: RendererSelection) => undefined,
    setTool: () => undefined,
    setHoverPin: () => undefined,
    setSimSnapshot: () => undefined,
    setNetlist: () => undefined,
    setDiagnostics: () => undefined,
    setLibrary: () => undefined,
    setRunning: () => undefined,
    setSuggestionAnchor: () => undefined,
    hitTestSuggestion: () => controls.hitSuggestionResult,
    render: () => undefined,
    hitTestComponent: () => controls.hitComponentResult,
    hitTestPin: () => controls.hitPinResult,
    hitTestWire: () => controls.hitWireResult,
    componentsInRect: () => [],
    pinWorld: () => null,
    dispose: () => undefined,
  };
}

/**
 * Reset the store between tests — `useAppStore` is a module-level
 * singleton, so leaked state from one test can pollute the next.
 */
function resetStore(): void {
  useAppStore.setState({
    document: { components: [], wires: [] },
    selection: { componentIds: new Set() },
    tool: IDLE_TOOL,
    viewport: INITIAL_VIEWPORT,
    history: [],
    redoStack: [],
    suggestionAnchor: null,
    lastPlacedKind: null,
  });
}

function fireDown(canvas: HTMLCanvasElement, x: number, y: number, button = 0, shiftKey = false): void {
  const ev = new MouseEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button,
    shiftKey,
  });
  // happy-dom doesn't ship PointerEvent; MouseEvent carries the same
  // shape for the props we use.
  Object.defineProperty(ev, 'pointerId', { value: 1 });
  canvas.dispatchEvent(ev);
}
function fireMove(canvas: HTMLCanvasElement, x: number, y: number): void {
  const ev = new MouseEvent('pointermove', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(ev, 'pointerId', { value: 1 });
  canvas.dispatchEvent(ev);
}
function fireUp(canvas: HTMLCanvasElement, x: number, y: number): void {
  const ev = new MouseEvent('pointerup', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(ev, 'pointerId', { value: 1 });
  canvas.dispatchEvent(ev);
}

describe('canvas-controller', () => {
  let canvas: HTMLCanvasElement;
  let controls: RendererStubControls;
  let detach: () => void;

  beforeEach(() => {
    resetStore();
    canvas = makeCanvas();
    controls = {
      hitComponentResult: null,
      hitPinResult: null,
      hitWireResult: null,
      hitSuggestionResult: null,
    };
    detach = attachCanvasController(canvas, makeRenderer(controls));
  });

  afterEach(() => {
    detach();
  });

  it('place tool commits a component on pointerdown', () => {
    useAppStore.getState().setTool({
      type: 'place',
      kind: 'and',
      params: { width: 1, inputs: 2 },
      ghostWorld: null,
    });
    fireDown(canvas, 100, 100);
    const doc = useAppStore.getState().document;
    expect(doc.components).toHaveLength(1);
    expect(doc.components[0]!.kind).toBe('and');
    // Tool returns to idle after commit.
    expect(useAppStore.getState().tool.type).toBe('idle');
    // Newly placed component is selected.
    expect([...useAppStore.getState().selection.componentIds]).toHaveLength(1);
    // Suggestion anchor + lastPlacedKind set so palette/hints can react.
    expect(useAppStore.getState().lastPlacedKind).toBe('and');
    expect(useAppStore.getState().suggestionAnchor).not.toBeNull();
  });

  it('wire tool: clicking a pin starts a wire, second pin click commits', () => {
    // Set up: two components already on the canvas (we just need the ids;
    // the renderer stub reports each pin hit).
    const id1 = asComponentId('c1');
    const id2 = asComponentId('c2');
    const c1: VisualComponent = {
      id: id1,
      kind: 'input',
      params: { width: 1 },
      position: { x: 0, y: 0 },
      rotation: 0,
    };
    const c2: VisualComponent = {
      id: id2,
      kind: 'output',
      params: { width: 1 },
      position: { x: 200, y: 0 },
      rotation: 0,
    };
    useAppStore.setState({ document: { components: [c1, c2], wires: [] } });
    // First click: input's 'out' pin → wire starts.
    controls.hitPinResult = {
      ref: { componentId: id1, portName: 'out' },
      world: { x: 50, y: 50 },
    };
    fireDown(canvas, 50, 50);
    expect(useAppStore.getState().tool.type).toBe('wire');
    // Second click: output's 'in' pin → wire commits.
    controls.hitPinResult = {
      ref: { componentId: id2, portName: 'in' },
      world: { x: 200, y: 50 },
    };
    fireDown(canvas, 200, 50);
    const wires = useAppStore.getState().document.wires;
    expect(wires).toHaveLength(1);
    expect(wires[0]!.endpoints[0].componentId).toBe(id1);
    expect(wires[0]!.endpoints[1].componentId).toBe(id2);
    expect(useAppStore.getState().tool.type).toBe('idle');
  });

  it('empty pointerdown clears selection', () => {
    useAppStore.setState({
      selection: { componentIds: new Set([asComponentId('xyz')]) },
    });
    // Empty canvas: no component/pin/wire hits.
    fireDown(canvas, 400, 400);
    fireUp(canvas, 400, 400); // click-without-move triggers selection logic
    expect([...useAppStore.getState().selection.componentIds]).toHaveLength(0);
  });

  it('Shift+click on empty starts a marquee selection', () => {
    fireDown(canvas, 100, 100, 0, /* shiftKey */ true);
    const tool = useAppStore.getState().tool;
    expect(tool.type).toBe('marquee');
  });

  it('suggestion-hint click pivots into place tool for the suggested kind', () => {
    controls.hitSuggestionResult = { kind: 'or', world: { x: 120, y: 80 } };
    fireDown(canvas, 120, 80);
    const tool = useAppStore.getState().tool;
    expect(tool.type).toBe('place');
    if (tool.type === 'place') {
      expect(tool.kind).toBe('or');
      expect(tool.ghostWorld).toEqual({ x: 120, y: 80 });
    }
    // Anchor is cleared so the floating + hints disappear.
    expect(useAppStore.getState().suggestionAnchor).toBeNull();
  });

  it('drag on selected component dispatches MoveComponentsCommand on pointerup', () => {
    const id = asComponentId('drag-me');
    const c: VisualComponent = {
      id,
      kind: 'and',
      params: { width: 1, inputs: 2 },
      position: { x: 100, y: 100 },
      rotation: 0,
    };
    useAppStore.setState({
      document: { components: [c], wires: [] },
      selection: { componentIds: new Set([id]) },
    });
    controls.hitComponentResult = id;
    // Pointerdown starts a potential drag.
    fireDown(canvas, 110, 110);
    // Move past the click threshold (4px) so the controller switches
    // into move-components mode.
    fireMove(canvas, 140, 130);
    fireUp(canvas, 140, 130);
    // Position should have shifted; exact delta depends on snap, but
    // the component must have moved from (100,100).
    const after = useAppStore.getState().document.components[0]!;
    expect(after.position.x).not.toBe(100);
    // History must have one entry (the MoveComponentsCommand).
    expect(useAppStore.getState().history).toHaveLength(1);
  });
});
// keep ts noUnusedLocals happy
void asWireId;
