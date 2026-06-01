import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import { importCirc } from '../model/circ-importer.js';
import {
  isFolderApiAvailable,
  loadProjectFromFolder,
  saveProjectToFolder,
} from '../model/folder-persistence.js';
import { compileDocument } from '../model/netlist-sync.js';
import { FORMAT_VERSION, fromJSON, toJSON } from '../model/persistence.js';
import { asDocumentId, INITIAL_VIEWPORT, useAppStore, type FrozenDoc, type DocumentId } from '../model/store.js';
import { SURFACE } from './palette-tokens.js';

export function Toolbar(): JSX.Element {
  const setViewport = useAppStore((s) => s.setViewport);
  const viewport = useAppStore((s) => s.viewport);
  const zoomAt = useAppStore((s) => s.zoomAt);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const historyLen = useAppStore((s) => s.history.length);
  const redoLen = useAppStore((s) => s.redoStack.length);
  const running = useAppStore((s) => s.running);
  const tickRate = useAppStore((s) => s.tickRate);
  const setRunning = useAppStore((s) => s.setRunning);
  const setTickRate = useAppStore((s) => s.setTickRate);
  const locale = useAppStore((s) => s.locale);
  // Diagnostic count drives the small red dot on the assistant button —
  // we lift the badge to the *toolbar* so the assistant panel itself can
  // stay non-intrusive (never auto-opens).
  const assistantDiagCount = useAppStore(
    (s) => s.compiled.diagnostics.length + s.simDiagnostics.length,
  );
  // Adaptive label width: wide screens get the long human-readable name,
  // narrow ones keep the short abbreviation so the toolbar still fits.
  const [wide, setWide] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true,
  );
  useEffect(() => {
    const onResize = (): void => setWide(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const setLocale = useAppStore((s) => s.setLocale);
  const paletteOpen = useAppStore((s) => s.paletteOpen);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);

  // Auto-collapse the palette on narrow viewports; let the user manually
  // re-open it via the toggle. Only fires when the breakpoint is *crossed*
  // — no fight with the user's manual preference inside a single layout.
  useEffect(() => {
    let lastNarrow = window.innerWidth < 1024;
    const onResize = (): void => {
      const narrow = window.innerWidth < 1024;
      if (narrow !== lastNarrow) {
        lastNarrow = narrow;
        useAppStore.getState().setPaletteOpen(!narrow);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fit = (): void => setViewport(INITIAL_VIEWPORT);
  const zoomIn = (): void => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.2);
  const zoomOut = (): void => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.2);

  const step = (): void => {
    (window as unknown as { __sim?: { tickClock: () => void } }).__sim?.tickClock();
  };
  const reset = (): void => {
    setRunning(false);
    (window as unknown as { __sim?: { load: (n: unknown) => void } }).__sim?.load(
      useAppStore.getState().compiled.netlist as unknown,
    );
  };

  const exportFile = (): void => {
    const s = useAppStore.getState();
    const tabs = s.documentOrder.map((id) =>
      id === s.activeDocumentId
        ? { id, name: s.activeDocumentName, document: s.document }
        : (() => {
            const f = s.documents.get(id);
            return f
              ? { id, name: f.name, document: f.document }
              : { id, name: 'untitled', document: { components: [], wires: [] } };
          })(),
    );
    const json = toJSON({
      version: FORMAT_VERSION,
      library: s.library,
      locale: s.locale,
      project: {
        name: 'Untitled',
        activeDocumentId: s.activeDocumentId,
        tabs,
      },
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `gatecraft-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importFile = (): void => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,.json,.circ,application/xml,text/xml';
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const isCirc = file.name.toLowerCase().endsWith('.circ') || text.trim().startsWith('<?xml');
        if (isCirc) {
          const { document: doc, diagnostics } = importCirc(text);
          useAppStore.getState().loadDocument(doc);
          if (diagnostics.length > 0) {
            const lines = diagnostics
              .slice(0, 10)
              .map((d) =>
                d.kind === 'unknown-component'
                  ? `• Unknown component: ${d.lib}:${d.name}`
                  : d.kind === 'unbound-wire-endpoint'
                    ? `• Loose wire endpoint at (${d.point.x}, ${d.point.y})`
                    : `• Unsupported attr: ${d.comp}.${d.attr}`,
              )
              .join('\n');
            const more = diagnostics.length > 10 ? `\n… +${diagnostics.length - 10} more` : '';
            // eslint-disable-next-line no-alert
            alert(
              `Imported ${doc.components.length} components, ${doc.wires.length} wires.\n\nNotes:\n${lines}${more}`,
            );
          }
        } else {
          const parsed = fromJSON(text);
          // Restore the first tab as active; bring library & locale along.
          const firstTab = parsed.project.tabs[0];
          if (!firstTab) {
            alert('Imported project has no documents.');
            return;
          }
          useAppStore.getState().loadAll(firstTab.document, parsed.library);
          useAppStore.getState().setLocale(parsed.locale);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // eslint-disable-next-line no-alert
        alert(`Import failed: ${msg}`);
      }
    };
    inp.click();
  };

  const saveAsComposite = (): void => {
    const name = window.prompt('Save current circuit as composite. Name:');
    if (!name) return;
    useAppStore.getState().saveCurrentAsComposite(name.trim());
  };

  const publishTab = (): void => {
    const id = useAppStore.getState().publishActiveTab();
    const name = useAppStore.getState().activeDocumentName;
    useAppStore.getState().setPublishedFlash({ id, name });
  };

  const openTemplatePicker = (): void => {
    window.dispatchEvent(new Event('gatecraft:open-template-picker'));
  };

  const openLessons = (): void => {
    window.dispatchEvent(new Event('gatecraft:open-lessons'));
  };
  const openGlossary = (): void => {
    window.dispatchEvent(new Event('gatecraft:open-glossary'));
  };
  const openAssistant = (): void => {
    window.dispatchEvent(new Event('gatecraft:open-assistant'));
  };

  const exportAsVerilog = (): void => {
    // Modal asks for module name + optional testbench from a lesson
    // challenge spec — replaces the old one-tap direct download.
    window.dispatchEvent(new Event('gatecraft:open-verilog-export'));
  };

  const openCloud = (): void => {
    window.dispatchEvent(new Event('gatecraft:open-cloud'));
  };

  const saveToFolder = async (): Promise<void> => {
    const s = useAppStore.getState();
    const tabs = s.documentOrder.map((id) => {
      if (id === s.activeDocumentId) {
        return { id, name: s.activeDocumentName, document: s.document };
      }
      const f = s.documents.get(id);
      return f
        ? { id, name: f.name, document: f.document }
        : { id, name: 'untitled', document: { components: [], wires: [] } };
    });
    // Safari / Firefox don't ship showDirectoryPicker — fall through to
    // the regular single-file JSON download in that case so the menu
    // entry stays functional everywhere.
    if (!isFolderApiAvailable()) {
      exportFile();
      return;
    }
    try {
      const { folderName } = await saveProjectToFolder({
        name: 'Untitled',
        locale: s.locale,
        activeDocumentId: s.activeDocumentId,
        library: s.library,
        tabs,
      });
      // eslint-disable-next-line no-alert
      alert(`Saved project to "${folderName}".`);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      // eslint-disable-next-line no-alert
      alert(`Folder save failed: ${(e as Error).message}`);
    }
  };

  const openFromFolder = async (): Promise<void> => {
    try {
      const project = await loadProjectFromFolder();
      const tabs = project.tabs.length > 0
        ? project.tabs
        : [{ id: 'doc_main', name: 'main', document: { components: [], wires: [] } }];
      const activeId = asDocumentId(
        tabs.find((t) => t.id === project.activeDocumentId)?.id ?? tabs[0]!.id,
      );
      const activeTab = tabs.find((t) => t.id === activeId)!;
      const frozen = new Map<DocumentId, FrozenDoc>();
      for (const tabEntry of tabs) {
        if (tabEntry.id === activeId) continue;
        frozen.set(asDocumentId(tabEntry.id), {
          id: asDocumentId(tabEntry.id),
          name: tabEntry.name,
          document: tabEntry.document,
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
        library: project.library,
        locale: project.locale,
        document: activeTab.document,
        compiled: compileDocument(activeTab.document, project.library),
        history: [],
        redoStack: [],
        selection: { componentIds: new Set() },
        viewport: INITIAL_VIEWPORT,
        simSnapshot: undefined,
        simDiagnostics: [],
        simComponentStates: new Map(),
        running: false,
        documents: frozen,
        documentOrder: tabs.map((tabEntry) => asDocumentId(tabEntry.id)),
        activeDocumentId: activeId,
        activeDocumentName: activeTab.name,
        activeDocumentDirty: false,
        activeDocumentOrigin: undefined,
      });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      // eslint-disable-next-line no-alert
      alert(`Folder open failed: ${(e as Error).message}`);
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="gatecraft toolbar"
      style={{
        position: 'absolute',
        top: 0,
        left: 44,
        right: 0,
        height: 44,
        zIndex: 10,
        display: 'flex',
        gap: 4,
        padding: '0 12px',
        background: SURFACE.chromeBg,
        borderBottom: `1px solid ${SURFACE.borderColor}`,
        alignItems: 'center',
      }}
    >
      <Btn onClick={undo} label="↶" title={t('toolbar.undo')} disabled={historyLen === 0} />
      <Btn onClick={redo} label="↷" title={t('toolbar.redo')} disabled={redoLen === 0} />
      <Divider />
      <Btn onClick={zoomOut} label="−" title={t('toolbar.zoomOut')} />
      <span style={zoomLabelStyle}>{Math.round(viewport.zoom * 100)}%</span>
      <Btn onClick={zoomIn} label="+" title={t('toolbar.zoomIn')} />
      <Btn
        onClick={fit}
        label={wide ? t('toolbar.resetLong') : t('toolbar.reset')}
        title={t('toolbar.resetView')}
      />
      <Divider />
      <Btn
        onClick={() => setRunning(!running)}
        label={running ? '❚❚' : '▶'}
        title={running ? t('toolbar.pause') : t('toolbar.play')}
        accent={running ? '#f59e0b' : '#22c55e'}
        dataTour="play"
      />
      <Btn onClick={step} label="▶|" title={t('toolbar.step')} />
      <Btn onClick={reset} label="⟲" title={t('toolbar.resetSim')} />
      <span style={zoomLabelStyle}>{tickRate.toFixed(1)} Hz</span>
      <input
        type="range"
        min={0.5}
        max={20}
        step={0.5}
        value={tickRate}
        onChange={(e) => setTickRate(Number(e.target.value))}
        title={t('toolbar.tickRate')}
        style={{ width: 100 }}
      />
      <Divider />
      <Btn
        onClick={openTemplatePicker}
        label={wide ? t('toolbar.newCircuitLong') : t('toolbar.newCircuit')}
        title={t('toolbar.newCircuitTooltip')}
      />
      <Btn
        onClick={() => setPaletteOpen(!paletteOpen)}
        label={`${paletteOpen ? '▶' : '◀'} ${wide ? t('toolbar.componentsLong') : t('toolbar.components')}`}
        title={t('toolbar.componentsTooltip')}
      />
      <OverflowMenu
        items={[
          { label: t('toolbar.glossary'), onClick: openGlossary },
          {
            label: t('toolbar.welcome'),
            onClick: () => window.dispatchEvent(new Event('gatecraft:open-welcome')),
          },
          { label: t('toolbar.publishTab'), onClick: publishTab },
          { label: t('toolbar.saveLabel'), onClick: saveAsComposite },
          { label: t('toolbar.export'), onClick: exportFile },
          { label: t('toolbar.import'), onClick: importFile },
          { label: t('toolbar.exportVerilog'), onClick: exportAsVerilog },
          { label: t('toolbar.cloud'), onClick: openCloud },
          {
            label: t('toolbar.waveform'),
            onClick: () => window.dispatchEvent(new Event('gatecraft:open-waveform')),
          },
          {
            label: t('toolbar.history'),
            onClick: () => window.dispatchEvent(new Event('gatecraft:open-history')),
          },
          {
            label: t('toolbar.llmSettings'),
            onClick: () => window.dispatchEvent(new Event('gatecraft:open-llm-settings')),
          },
          {
            label: t(useAppStore.getState().colorMode === 'deuteranopia'
              ? 'toolbar.colorModeDefault'
              : 'toolbar.colorModeDeuteranopia'),
            onClick: () => {
              const cur = useAppStore.getState().colorMode;
              useAppStore.getState().setColorMode(cur === 'deuteranopia' ? 'default' : 'deuteranopia');
            },
          },
          {
            label: t(useAppStore.getState().snapEnabled
              ? 'toolbar.snapDisable'
              : 'toolbar.snapEnable'),
            onClick: () => {
              const cur = useAppStore.getState().snapEnabled;
              useAppStore.getState().setSnapEnabled(!cur);
            },
          },
          // Folder save is always exposed; if the FileSystem Access API
          // isn't available it transparently falls back to a JSON download
          // so Safari/Firefox users still get a working menu entry.
          { label: t('toolbar.folderSave'), onClick: () => void saveToFolder() },
          ...(isFolderApiAvailable()
            ? [{ label: t('toolbar.folderOpen'), onClick: () => void openFromFolder() }]
            : []),
        ]}
      />
      <Divider />
      <LocaleToggle locale={locale} setLocale={setLocale} />
    </div>
  );
}

function OverflowMenu({
  items,
}: {
  items: readonly { label: string; onClick: () => void }[];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Filter items by search query (case-insensitive substring).
  const filtered = search.trim()
    ? items.filter((it) => it.label.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    inputRef.current?.focus();
    const onClick = (ev: MouseEvent): void => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') setOpen(false);
      else if (ev.key === 'Enter' && filtered.length > 0) {
        setOpen(false);
        filtered[0]!.onClick();
      }
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, filtered]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('toolbar.moreTooltip')}
        style={{
          background: open ? '#243054' : 'transparent',
          color: '#eef1f6',
          border: '1px solid transparent',
          borderRadius: 6,
          padding: '5px 10px',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 700,
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ☰
      </button>
      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 200,
            background: '#0f1115',
            border: '1px solid #2a3548',
            borderRadius: 8,
            padding: 4,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            maxHeight: '60vh',
            overflow: 'hidden',
          }}
        >
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('toolbar.menuSearchPlaceholder')}
            style={{
              margin: 4,
              padding: '5px 8px',
              background: '#0c1018',
              border: '1px solid #2a3548',
              borderRadius: 4,
              color: '#dde4ef',
              font: 'inherit',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '10px 12px',
                color: '#7c8696',
                fontSize: 12,
                fontStyle: 'italic',
              }}
            >
              {t('toolbar.menuNoMatch')}
            </div>
          ) : null}
          {filtered.map((it, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              style={{
                background: 'transparent',
                color: '#eef1f6',
                border: 'none',
                textAlign: 'left',
                padding: '8px 12px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 13,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#243054')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {it.label}
            </button>
          ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LocaleToggle({
  locale,
  setLocale,
}: {
  locale: 'en' | 'tr';
  setLocale: (l: 'en' | 'tr') => void;
}): JSX.Element {
  const cellStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px',
    background: active ? '#1f3a66' : 'transparent',
    color: active ? '#e6e6e6' : '#7c8696',
    border: `1px solid ${active ? '#3b6ec3' : 'transparent'}`,
    borderRadius: 4,
    cursor: 'pointer',
    font: 'inherit',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 0.4,
  });
  return (
    <div title={t('toolbar.localeTooltip')} style={{ display: 'flex', gap: 2 }}>
      <button onClick={() => setLocale('en')} style={cellStyle(locale === 'en')}>
        EN
      </button>
      <button onClick={() => setLocale('tr')} style={cellStyle(locale === 'tr')}>
        TR
      </button>
    </div>
  );
}

const zoomLabelStyle: React.CSSProperties = {
  alignSelf: 'center',
  fontSize: 12,
  color: '#9aa4b2',
  minWidth: 44,
  textAlign: 'center',
};

function Divider(): JSX.Element {
  return <div style={{ width: 1, alignSelf: 'stretch', background: '#2a3548', margin: '0 4px' }} />;
}

function Btn({
  onClick,
  label,
  title,
  disabled = false,
  accent,
  dataTour,
  badge,
}: {
  onClick: () => void;
  label: string;
  title: string;
  disabled?: boolean;
  accent?: string;
  dataTour?: string;
  /** When set, paints a small colored dot on the top-right of the button. */
  badge?: { color: string; pulse?: boolean };
}): JSX.Element {
  return (
    <button
      className="gc-hover-lift gc-focus-ring"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      data-tour={dataTour}
      style={{
        position: 'relative',
        background: 'transparent',
        color: disabled ? '#3a4150' : accent ?? '#eef1f6',
        border: '1px solid transparent',
        borderRadius: 6,
        padding: '5px 10px',
        cursor: disabled ? 'default' : 'pointer',
        font: 'inherit',
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = '#243054';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {label}
      {badge ? (
        <span
          aria-hidden
          className={badge.pulse ? 'gc-flash' : undefined}
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: badge.color,
            boxShadow: `0 0 0 1.5px rgba(15, 17, 21, 1)`,
          }}
        />
      ) : null}
    </button>
  );
}
