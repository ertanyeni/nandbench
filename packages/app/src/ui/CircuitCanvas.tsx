import { useEffect, useRef } from 'react';
import { attachCanvasController } from '../interaction/canvas-controller.js';
import { useAppStore } from '../model/store.js';
import { suggestionsFor } from '../model/suggestions.js';
import { applyColorMode, Canvas2DRenderer } from '../render/canvas2d.js';

const suggestionKindsFor = (kind: string): readonly string[] => suggestionsFor(kind);

export function CircuitCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);
  const focusedPane = useAppStore((s) => s.focusedPane);
  const splitView = useAppStore((s) => s.splitView);
  // Show the focus ring only when there's actually a second pane to
  // ambiguate against — a solo canvas doesn't need it.
  const showRing = splitView && focusedPane === 'main';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new Canvas2DRenderer(canvas);
    rendererRef.current = renderer;
    if (import.meta.env.DEV) {
      (window as unknown as { __renderer: Canvas2DRenderer }).__renderer = renderer;
    }

    const detachController = attachCanvasController(canvas, renderer);

    const apply = (): void => {
      const s = useAppStore.getState();
      applyColorMode(s.colorMode);
      renderer.setLibrary(s.library);
      renderer.setDocument(s.document);
      renderer.setViewport(s.viewport);
      renderer.setSelection(s.selection);
      renderer.setTool(s.tool);
      renderer.setNetlist(s.compiled.netlist);
      renderer.setSimSnapshot(s.simSnapshot);
      renderer.setRunning(s.running);
      // Build suggestion anchor view from store slices. We accept either
      // `lastPlacedKind` (just-placed flow) OR the anchored component's
      // own kind (selection flow) — so suggestions reappear whenever an
      // unconnected component is re-selected.
      if (s.suggestionAnchor) {
        const comp = s.document.components.find((c) => c.id === s.suggestionAnchor!.componentId);
        if (comp) {
          const seedKind = s.lastPlacedKind ?? comp.kind;
          const kinds = suggestionKindsFor(seedKind);
          renderer.setSuggestionAnchor({
            componentId: s.suggestionAnchor.componentId,
            world: s.suggestionAnchor.world,
            kinds,
          });
        } else {
          renderer.setSuggestionAnchor(null);
        }
      } else {
        renderer.setSuggestionAnchor(null);
      }
      // Merge compile-time + sim-time diagnostics so the canvas shows them all.
      renderer.setDiagnostics([...s.compiled.diagnostics, ...s.simDiagnostics]);
    };
    apply();
    const unsubscribe = useAppStore.subscribe(apply);

    return () => {
      detachController();
      unsubscribe();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-tour="canvas"
      role="application"
      aria-label="gatecraft circuit canvas"
      tabIndex={0}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'crosshair',
        touchAction: 'none',
        userSelect: 'none',
        // Inset focus ring when the user is editing the main pane and a
        // split is visible — matches SecondaryCanvas's pattern.
        boxShadow: showRing ? 'inset 0 0 0 2px #60a5fa' : 'none',
        transition: 'box-shadow 120ms',
      }}
    />
  );
}
