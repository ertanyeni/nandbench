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
  const splitOrientation = useAppStore((s) => s.splitOrientation);
  const splitDocumentId = useAppStore((s) => s.splitDocumentId);
  const documentsMap = useAppStore((s) => s.documents);
  const activeDocumentId = useAppStore((s) => s.activeDocumentId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);

  // Swap the active editor tab with the pinned split tab. The previously
  // active tab takes over the split slot (now pinned), so the user can
  // edit the freshly-promoted tab in the main editor and bounce back
  // with another click. Effectively this is "two-pane editing" without
  // a full pane-state refactor.
  const swapMainAndSplit = (): void => {
    const s = useAppStore.getState();
    const splitId = s.splitDocumentId;
    const oldActiveId = s.activeDocumentId;
    if (!splitId || splitId === oldActiveId) return;
    s.switchDocument(splitId);
    s.setSplitDocumentId(oldActiveId);
  };

  // Resolve the document the split should display. Pinned tab takes
  // priority; falling back to the live editor doc when null OR when the
  // pinned id happens to *be* the active tab.
  const resolveTargetDoc = (): { name: string; doc: ReturnType<typeof useAppStore.getState>['document'] } => {
    const s = useAppStore.getState();
    if (s.splitDocumentId && s.splitDocumentId !== s.activeDocumentId) {
      const frozen = s.documents.get(s.splitDocumentId);
      if (frozen) return { name: frozen.name, doc: frozen.document };
    }
    return { name: s.activeDocumentName, doc: s.document };
  };

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
      const target = resolveTargetDoc();
      renderer.setDocument(target.doc);
      renderer.setViewport(s.secondaryViewport);
      // Selection only makes sense when we're mirroring the active tab —
      // if we're pinning a different tab, blank the selection so the
      // user doesn't see a halo around a non-matching component id.
      const pinningOther = s.splitDocumentId && s.splitDocumentId !== s.activeDocumentId;
      renderer.setSelection(pinningOther ? { componentIds: new Set() } : s.selection);
      renderer.setTool({ type: 'idle' });
      // Sim state only mirrors the active tab — pinned tabs are static.
      renderer.setNetlist(pinningOther ? undefined : s.compiled.netlist);
      renderer.setSimSnapshot(pinningOther ? undefined : s.simSnapshot);
      renderer.setRunning(s.running);
      renderer.setSuggestionAnchor(null);
      renderer.setDiagnostics(pinningOther ? [] : [...s.compiled.diagnostics, ...s.simDiagnostics]);
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

    // Pointerdown behavior depends on what the split is showing:
    //   - Mirror mode (no pinned tab) → left-drag pans the view.
    //   - Pinned tab → first click swaps panes (this tab becomes
    //     editable in the main editor; the old main tab moves into
    //     the split). Drag-to-pan still works after the swap if the
    //     user clicks again — by then the split is back in mirror
    //     mode for whatever ended up pinned.
    let dragStart: { sx: number; sy: number; vp: { panX: number; panY: number; zoom: number } } | null = null;
    const onPointerDown = (ev: PointerEvent): void => {
      const s = useAppStore.getState();
      if (s.splitDocumentId && s.splitDocumentId !== s.activeDocumentId) {
        ev.preventDefault();
        swapMainAndSplit();
        return;
      }
      const vp = s.secondaryViewport;
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

  // Compute the pane position from orientation. Right = vertical split
  // (40% wide on the right edge); Bottom = horizontal split (40% tall
  // on the bottom edge, above the status bar).
  const paneStyle: React.CSSProperties =
    splitOrientation === 'right'
      ? {
          top: 78,
          right: 0,
          bottom: 24,
          width: '40%',
          minWidth: 320,
          borderLeft: `1px solid ${SURFACE.borderColor}`,
        }
      : {
          left: 44,
          right: 0,
          bottom: 24,
          height: '45%',
          minHeight: 220,
          borderTop: `1px solid ${SURFACE.borderColor}`,
        };

  const pinning = splitDocumentId && splitDocumentId !== activeDocumentId;
  const pinnedTab = pinning ? documentsMap.get(splitDocumentId) : null;
  const headerLabel = pinnedTab
    ? `${pinnedTab.name} · ${t('split.pinned')}`
    : t('split.mirrorActive');

  return (
    <div
      style={{
        position: 'absolute',
        background: SURFACE.editorBg,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 8,
        ...paneStyle,
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
        <span style={{ flex: 1 }}>{headerLabel}</span>
        {pinning ? (
          <>
            <button
              onClick={swapMainAndSplit}
              title={t('split.swap')}
              style={iconBtnStyle}
            >
              ↔
            </button>
            <button
              onClick={() => useAppStore.getState().setSplitDocumentId(null)}
              title={t('split.unpin')}
              style={iconBtnStyle}
            >
              ↺
            </button>
          </>
        ) : null}
        <button
          onClick={() =>
            useAppStore
              .getState()
              .setSplitOrientation(splitOrientation === 'right' ? 'bottom' : 'right')
          }
          title={t('split.toggleOrientation')}
          style={iconBtnStyle}
        >
          {splitOrientation === 'right' ? '⊟' : '⊞'}
        </button>
        <button
          onClick={() => {
            useAppStore.getState().setSplitView(false);
            useAppStore.getState().setSplitDocumentId(null);
          }}
          aria-label={t('split.close')}
          title={t('split.close')}
          style={iconBtnStyle}
        >
          ×
        </button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={t('split.title')}
        title={pinning ? t('split.clickToSwap') : undefined}
        style={{
          flex: 1,
          width: '100%',
          display: 'block',
          cursor: pinning ? 'pointer' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${SURFACE.borderColor}`,
  color: SURFACE.itemSubText,
  borderRadius: 4,
  padding: '1px 6px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 11,
};
