import { useEffect, useRef } from 'react';
import { attachCanvasController } from '../interaction/canvas-controller.js';
import { useAppStore } from '../model/store.js';
import { suggestionsFor } from '../model/suggestions.js';
import { applyColorMode, Canvas2DRenderer } from '../render/canvas2d.js';
import { t } from '../i18n/index.js';
import { SURFACE } from './palette-tokens.js';

/**
 * Secondary editor pane — a fully-live canvas with its own controller,
 * tool, selection, history, and simulation. Appears on the right or
 * bottom edge of the editor body whenever `splitView` is true.
 *
 * Reads/writes the `split*` store slices; routes pointer + keyboard
 * events through `attachCanvasController(canvas, renderer, 'split')`.
 */
export function SecondaryCanvas(): JSX.Element | null {
  const splitView = useAppStore((s) => s.splitView);
  const splitOrientation = useAppStore((s) => s.splitOrientation);
  const splitDocumentId = useAppStore((s) => s.splitDocumentId);
  const documentsMap = useAppStore((s) => s.documents);
  const activeDocumentId = useAppStore((s) => s.activeDocumentId);
  const focusedPane = useAppStore((s) => s.focusedPane);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);

  useEffect(() => {
    if (!splitView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new Canvas2DRenderer(canvas);
    rendererRef.current = renderer;
    const detachController = attachCanvasController(canvas, renderer, 'split');

    // The renderer subscribes to the split slice so its document /
    // tool / selection / viewport / netlist / sim all come from the
    // split-pane state owned by the store.
    const apply = (): void => {
      const s = useAppStore.getState();
      applyColorMode(s.colorMode);
      renderer.setLibrary(s.library);
      // Resolve which document this pane shows:
      //   - pinned + different from active → frozen tab's doc
      //   - otherwise → live editor doc (mirror mode)
      const target =
        s.splitDocumentId && s.splitDocumentId !== s.activeDocumentId
          ? s.documents.get(s.splitDocumentId)?.document ?? s.document
          : s.document;
      renderer.setDocument(target);
      renderer.setViewport(s.secondaryViewport);
      renderer.setSelection(s.splitSelection);
      renderer.setTool(s.splitTool);
      renderer.setNetlist(s.splitCompiled.netlist);
      renderer.setSimSnapshot(s.splitSimSnapshot);
      renderer.setRunning(s.splitRunning);
      renderer.setSuggestionAnchor(null); // suggestions stay on the main pane for now
      renderer.setDiagnostics([...s.splitCompiled.diagnostics, ...s.splitSimDiagnostics]);
    };
    apply();
    const unsubscribe = useAppStore.subscribe(apply);
    void suggestionsFor; // kept for symmetry with CircuitCanvas; suggestions are main-only V1

    return () => {
      detachController();
      unsubscribe();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [splitView]);

  if (!splitView) return null;

  // Pane geometry — right (vertical split) vs bottom (horizontal split).
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
    ? `${t('split.editingPrefix')}${pinnedTab.name}`
    : t('split.mirrorActive');

  const isFocused = focusedPane === 'split';

  return (
    <div
      style={{
        position: 'absolute',
        background: SURFACE.editorBg,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 8,
        // VSCode-style focus ring on the active pane.
        boxShadow: isFocused ? 'inset 0 0 0 2px #60a5fa' : 'none',
        transition: 'box-shadow 120ms',
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
          <button
            onClick={() => useAppStore.getState().swapPanes()}
            title={t('split.swap')}
            style={iconBtnStyle}
          >
            ↔
          </button>
        ) : null}
        {pinning ? (
          <button
            onClick={() => useAppStore.getState().setSplitDocumentId(null)}
            title={t('split.unpin')}
            style={iconBtnStyle}
          >
            ↺
          </button>
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
        style={{
          flex: 1,
          width: '100%',
          display: 'block',
          cursor: 'crosshair',
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
