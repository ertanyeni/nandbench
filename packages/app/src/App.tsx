import { useEffect } from 'react';
import { fullAdderDocument } from './fixtures/full-adder.js';
import { setActiveLocale } from './i18n/index.js';
import { loadFromStorage } from './model/persistence.js';
import { asDocumentId, useAppStore, type FrozenDoc, type DocumentId } from './model/store.js';
import { compileDocument } from './model/netlist-sync.js';
import { getShape } from './model/kinds.js';
import { INITIAL_VIEWPORT } from './model/store.js';
import { CircuitCanvas } from './ui/CircuitCanvas.js';
import { DiagnosticsPanel } from './ui/DiagnosticsPanel.js';
import { GlossaryPanel } from './ui/GlossaryPanel.js';
import { Inspector } from './ui/Inspector.js';
import { LessonsPanel } from './ui/LessonsPanel.js';
import { Palette } from './ui/Palette.js';
import { PersistenceBridge } from './ui/PersistenceBridge.js';
import { QuickopenModal } from './ui/QuickopenModal.js';
import { VerilogExportModal } from './ui/VerilogExportModal.js';
import { CloudModal } from './ui/CloudModal.js';
import { CloudSyncBridge } from './ui/CloudSyncBridge.js';
import { SuggestionBridge } from './ui/SuggestionBridge.js';
import { SuggestionTooltip } from './ui/SuggestionTooltip.js';
import { StatusBar } from './ui/StatusBar.js';
import { ActivityBar } from './ui/ActivityBar.js';
import { AssistantPanel } from './ui/AssistantPanel.js';
import { ContextMenu } from './ui/ContextMenu.js';
import { HistoryPanel } from './ui/HistoryPanel.js';
import { LlmSettingsModal } from './ui/LlmSettingsModal.js';
import { TabBar } from './ui/TabBar.js';
import { WaveformPanel } from './ui/WaveformPanel.js';
import { TemplatePicker } from './ui/TemplatePicker.js';
import { Toolbar } from './ui/Toolbar.js';
import { TourOverlay } from './ui/TourOverlay.js';
import { WelcomeModal } from './ui/WelcomeModal.js';
import { SimBridge } from './workers/SimBridge.js';

export function App(): JSX.Element {
  const loadDocument = useAppStore((s) => s.loadDocument);
  const setLocale = useAppStore((s) => s.setLocale);

  useEffect(() => {
    // Prefer restored state from localStorage; fall back to the full-adder
    // fixture so first-time users see something interesting.
    const stored = loadFromStorage();
    if (stored) {
      restoreProject(stored.library, stored.locale, stored.project);
      setActiveLocale(stored.locale);
    } else {
      loadDocument(fullAdderDocument);
    }
  }, [loadDocument, setLocale]);

  // Global keyboard shortcuts that aren't tied to the canvas focus:
  //   Cmd/Ctrl + /   restart the interactive tour.
  //   Cmd/Ctrl + F   zoom-to-fit (every placed component on screen).
  useEffect(() => {
    const onKey = (ev: KeyboardEvent): void => {
      const target = ev.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if ((ev.metaKey || ev.ctrlKey) && ev.key === '/') {
        ev.preventDefault();
        window.dispatchEvent(new Event('gatecraft:open-tour'));
      } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'f' || ev.key === 'F')) {
        ev.preventDefault();
        zoomToFit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <PersistenceBridge />
      <CloudSyncBridge />
      <SimBridge />
      <SuggestionBridge />
      <CircuitCanvas />
      <ActivityBar />
      <Toolbar />
      <TabBar />
      <Palette />
      <Inspector />
      <DiagnosticsPanel />
      <StatusBar />
      <TemplatePicker />
      <LessonsPanel />
      <GlossaryPanel />
      <AssistantPanel />
      <WaveformPanel />
      <ContextMenu />
      <QuickopenModal />
      <VerilogExportModal />
      <CloudModal />
      <SuggestionTooltip />
      <HistoryPanel />
      <LlmSettingsModal />
      <TourOverlay />
      <WelcomeModal />
    </div>
  );
}

/**
 * Replay a persisted project into the live store. The first tab becomes
 * the active doc; the rest land in `documents` as frozen tabs. Runtime
 * state (sim, history, viewport) is reset — only the document content
 * survives a session restart.
 */
export function restoreProject(
  library: ReturnType<typeof useAppStore.getState>['library'],
  locale: ReturnType<typeof useAppStore.getState>['locale'],
  project: NonNullable<ReturnType<typeof loadFromStorage>>['project'],
): void {
  const tabs = project.tabs.length > 0 ? project.tabs : [
    { id: 'doc_main', name: 'main', document: { components: [], wires: [] } },
  ];
  const activeIdRaw =
    tabs.find((t) => t.id === project.activeDocumentId)?.id ?? tabs[0]!.id;
  const activeId = asDocumentId(activeIdRaw);
  const activeTab = tabs.find((t) => t.id === activeIdRaw)!;

  const frozen = new Map<DocumentId, FrozenDoc>();
  for (const t of tabs) {
    if (t.id === activeIdRaw) continue;
    frozen.set(asDocumentId(t.id), {
      id: asDocumentId(t.id),
      name: t.name,
      document: t.document,
      history: [],
      redoStack: [],
      viewport: INITIAL_VIEWPORT,
      selection: { componentIds: new Set() },
      simSnapshot: undefined,
      simDiagnostics: [],
      simComponentStates: new Map(),
      running: false,
      tickRate: 4,
      dirty: false,
    });
  }

  useAppStore.setState({
    library,
    locale,
    document: activeTab.document,
    compiled: compileDocument(activeTab.document, library),
    history: [],
    redoStack: [],
    selection: { componentIds: new Set() },
    viewport: INITIAL_VIEWPORT,
    simSnapshot: undefined,
    simDiagnostics: [],
    simComponentStates: new Map(),
    running: false,
    documents: frozen,
    documentOrder: tabs.map((t) => asDocumentId(t.id)),
    activeDocumentId: activeId,
    activeDocumentName: activeTab.name,
    activeDocumentDirty: false,
    activeDocumentOrigin: undefined,
  });
}

/**
 * Compute the bbox union of every placed component and adjust the
 * viewport so the whole circuit fits in the visible area with a small
 * margin. No-op for empty canvases.
 */
function zoomToFit(): void {
  const state = useAppStore.getState();
  const components = state.document.components;
  const setViewport = state.setViewport;
  if (components.length === 0) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of components) {
    try {
      const shape = getShape(c.kind, c.params);
      const x0 = c.position.x;
      const y0 = c.position.y;
      const x1 = x0 + shape.bbox.w;
      const y1 = y0 + shape.bbox.h;
      if (x0 < minX) minX = x0;
      if (y0 < minY) minY = y0;
      if (x1 > maxX) maxX = x1;
      if (y1 > maxY) maxY = y1;
    } catch {
      /* unknown kind — skip */
    }
  }
  if (!Number.isFinite(minX)) return;
  const margin = 80;
  const w = maxX - minX + margin * 2;
  const h = maxY - minY + margin * 2;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const zoom = Math.max(0.2, Math.min(2, Math.min(screenW / w, screenH / h)));
  const panX = minX - margin - (screenW / zoom - w) / 2;
  const panY = minY - margin - (screenH / zoom - h) / 2;
  setViewport({ panX, panY, zoom });
}
