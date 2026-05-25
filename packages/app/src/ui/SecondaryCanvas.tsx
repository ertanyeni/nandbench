import { useEffect, useRef } from 'react';
import { useAppStore } from '../model/store.js';
import { applyColorMode, Canvas2DRenderer } from '../render/canvas2d.js';
import { t } from '../i18n/index.js';
import { SURFACE } from './palette-tokens.js';

/**
 * Secondary read-only canvas pane — appears on the right side of the
 * editor when split view is on. Renders the same document as the main
 * canvas but with an independent viewport (its own zoom/pan) so the
 * user can pin a wide overview while zooming the main canvas in.
 *
 * The pane has its own renderer instance and its own pointer handlers
 * for wheel-zoom + middle/right-drag pan. It does NOT install the full
 * canvas controller (no placement, no wire drawing, no selection
 * mutation) — interactions stay on the main canvas.
 */
export function SecondaryCanvas(): JSX.Element | null {
  const splitView = useAppStore((s) => s.splitView);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);

  useEffect(() => {
    if (!splitView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new Canvas2DRenderer(canvas);
    rendererRef.current = renderer;

    // Mirror the document + sim state, but read viewport / selection
    // from the *secondary* slice so the two panes diverge cleanly.
    const apply = (): void => {
      const s = useAppStore.getState();
      applyColorMode(s.colorMode);
      renderer.setLibrary(s.library);
      renderer.setDocument(s.document);
      renderer.setViewport(s.secondaryViewport);
      renderer.setSelection(s.selection); // mirror selection so user knows what's selected
      renderer.setTool({ type: 'idle' }); // hide tool ghosts (no placement here)
      renderer.setNetlist(s.compiled.netlist);
      renderer.setSimSnapshot(s.simSnapshot);
      renderer.setRunning(s.running);
      renderer.setSuggestionAnchor(null);
      renderer.setDiagnostics([...s.compiled.diagnostics, ...s.simDiagnostics]);
    };
    apply();
    const unsubscribe = useAppStore.subscribe(apply);

    // Independent wheel-zoom (centered on cursor).
    const onWheel = (ev: WheelEvent): void => {
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = ev.clientX - rect.left;
      const sy = ev.clientY - rect.top;
      const vp = useAppStore.getState().secondaryViewport;
      const worldX = vp.panX + sx / vp.zoom;
      const worldY = vp.panY + sy / vp.zoom;
      const step = ev.deltaY > 0 ? 0.9 : 1.1;
      const nextZoom = Math.max(0.2, Math.min(4, vp.zoom * step));
      const nextPanX = worldX - sx / nextZoom;
      const nextPanY = worldY - sy / nextZoom;
      useAppStore.getState().setSecondaryViewport({
        zoom: nextZoom,
        panX: nextPanX,
        panY: nextPanY,
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Drag-to-pan with primary mouse (no tool here, so left-drag = pan).
    let dragStart: { sx: number; sy: number; vp: { panX: number; panY: number; zoom: number } } | null = null;
    const onPointerDown = (ev: PointerEvent): void => {
      const vp = useAppStore.getState().secondaryViewport;
      dragStart = { sx: ev.clientX, sy: ev.clientY, vp: { ...vp } };
      try {
        canvas.setPointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onPointerMove = (ev: PointerEvent): void => {
      if (!dragStart) return;
      const dx = ev.clientX - dragStart.sx;
      const dy = ev.clientY - dragStart.sy;
      useAppStore.getState().setSecondaryViewport({
        zoom: dragStart.vp.zoom,
        panX: dragStart.vp.panX - dx / dragStart.vp.zoom,
        panY: dragStart.vp.panY - dy / dragStart.vp.zoom,
      });
    };
    const onPointerUp = (): void => {
      dragStart = null;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      unsubscribe();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [splitView]);

  if (!splitView) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 78,
        right: 0,
        bottom: 24,
        width: '40%',
        minWidth: 320,
        background: SURFACE.editorBg,
        borderLeft: `1px solid ${SURFACE.borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 8,
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          fontWeight: 700,
          color: SURFACE.headerSubtext,
          background: SURFACE.chromeBg,
          borderBottom: `1px solid ${SURFACE.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ flex: 1 }}>{t('split.title')}</span>
        <button
          onClick={() => useAppStore.getState().setSplitView(false)}
          aria-label={t('split.close')}
          title={t('split.close')}
          style={{
            background: 'transparent',
            border: `1px solid ${SURFACE.borderColor}`,
            color: SURFACE.itemSubText,
            borderRadius: 4,
            padding: '1px 6px',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 11,
          }}
        >
          ×
        </button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={t('split.title')}
        style={{
          flex: 1,
          width: '100%',
          display: 'block',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  );
}
