import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import { useAppStore, type DocumentId } from '../model/store.js';
import { SURFACE } from './palette-tokens.js';

/**
 * Horizontal tab bar — one chip per open document. Click to switch, ×
 * closes (with confirm when the active tab is dirty). Double-click renames.
 *
 * Sits between the toolbar and the canvas; the canvas/inspector live below
 * unchanged because the tab bar overlays at the top of the viewport.
 */
export function TabBar(): JSX.Element {
  const documentOrder = useAppStore((s) => s.documentOrder);
  const activeId = useAppStore((s) => s.activeDocumentId);
  const activeName = useAppStore((s) => s.activeDocumentName);
  const activeDirty = useAppStore((s) => s.activeDocumentDirty);
  const documents = useAppStore((s) => s.documents);
  const switchDoc = useAppStore((s) => s.switchDocument);
  const closeDoc = useAppStore((s) => s.closeDocument);
  const newDoc = useAppStore((s) => s.newDocument);
  const renameDoc = useAppStore((s) => s.renameDocument);
  const setDocumentOrder = useAppStore((s) => s.setDocumentOrder);
  const paletteOpen = useAppStore((s) => s.paletteOpen);

  const [editingId, setEditingId] = useState<DocumentId | null>(null);

  // Cmd/Ctrl shortcuts: T new, W close, 1..9 jump.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent): void => {
      const mod = ev.metaKey || ev.ctrlKey;
      if (!mod) return;
      if (ev.key === 't') {
        ev.preventDefault();
        newDoc();
      } else if (ev.key === 'w') {
        ev.preventDefault();
        const s = useAppStore.getState();
        if (s.activeDocumentDirty && !window.confirm(t('tabs.closeConfirm'))) return;
        closeDoc(s.activeDocumentId);
      } else if (/^[1-9]$/.test(ev.key)) {
        const idx = Number(ev.key) - 1;
        const s = useAppStore.getState();
        const id = s.documentOrder[idx];
        if (id) {
          ev.preventDefault();
          switchDoc(id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newDoc, closeDoc, switchDoc]);

  return (
    <div
      className="gc-fade-in"
      role="tablist"
      aria-label="document tabs"
      style={{
        position: 'absolute',
        // VSCode-style tab strip: a flush row below the header. The
        // strip's surface sits one tier darker than the header so the
        // active tab (matching editor bg) reads as continuous with the
        // canvas behind it.
        top: 44,
        left: paletteOpen ? 292 : 44,
        right: 0,
        height: 34,
        display: 'flex',
        gap: 0,
        padding: '0 4px',
        background: SURFACE.sidebarBg,
        borderBottom: `1px solid ${SURFACE.borderColor}`,
        zIndex: 5,
        alignItems: 'center',
      }}
    >
      <ScrollableTabs
        ids={documentOrder}
        activeId={activeId}
        activeName={activeName}
        activeDirty={activeDirty}
        documents={documents}
        editingId={editingId}
        onSwitch={switchDoc}
        onClose={(id, dirty) => {
          // Always confirm — even a clean tab carries its own undo
          // history that disappears with the close. Library entries
          // remain in the palette either way; the *editing session*
          // is what's being thrown away.
          const docName =
            id === useAppStore.getState().activeDocumentId
              ? useAppStore.getState().activeDocumentName
              : useAppStore.getState().documents.get(id)?.name ?? '';
          const isLibrary = useAppStore
            .getState()
            .documents.get(id)?.origin?.kind === 'library' ||
            (id === useAppStore.getState().activeDocumentId &&
              useAppStore.getState().activeDocumentOrigin?.kind === 'library');
          const msg = dirty
            ? t('tabs.closeConfirmDirty', { name: docName })
            : isLibrary
              ? t('tabs.closeConfirmLibrary', { name: docName })
              : t('tabs.closeConfirm', { name: docName });
          if (!window.confirm(msg)) return;
          closeDoc(id);
        }}
        onPublish={() => {
          const id = useAppStore.getState().publishActiveTab();
          // Tiny status-bar style toast; replaces the previous alert()
          // path so the publish action stays in-app and non-modal.
          useAppStore.getState().setPublishedFlash({ id, name: activeName });
        }}
        onStartEdit={setEditingId}
        onCommitEdit={(id, next) => {
          setEditingId(null);
          if (next.trim()) renameDoc(id, next.trim());
        }}
        onReorder={(fromId, toIdx) => {
          const order = [...documentOrder];
          const fromIdx = order.indexOf(fromId);
          if (fromIdx < 0 || fromIdx === toIdx) return;
          order.splice(fromIdx, 1);
          // Adjust target index when removing earlier element shifts later ones up.
          const adjustedTo = toIdx > fromIdx ? toIdx - 1 : toIdx;
          order.splice(adjustedTo, 0, fromId);
          setDocumentOrder(order);
        }}
      />
      <button
        onClick={() => newDoc()}
        title={t('tabs.newTooltip')}
        aria-label={t('tabs.newTooltip')}
        style={{
          // Render the "+" as a phantom tab rather than a separate
          // toolbar button — it shares the height + chip shape of the
          // real tabs so it reads as "click here to add another".
          height: '100%',
          minWidth: 32,
          padding: '0 12px',
          background: 'transparent',
          border: 'none',
          borderBottom: '2px solid transparent',
          color: SURFACE.headerSubtext,
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1,
          flexShrink: 0,
          borderRadius: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginLeft: 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1c2230';
          e.currentTarget.style.color = '#dde4ef';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = SURFACE.headerSubtext;
        }}
      >
        <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>+</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{t('tabs.newShort')}</span>
      </button>
    </div>
  );
}

/**
 * The scrollable tab strip, plus an overflow `···` dropdown that pops up
 * the moment the inner list can't fit. The dropdown lists every tab name
 * + dirty marker and jumps to the chosen one on click.
 */
function ScrollableTabs({
  ids,
  activeId,
  activeName,
  activeDirty,
  documents,
  editingId,
  onSwitch,
  onClose,
  onPublish,
  onStartEdit,
  onCommitEdit,
  onReorder,
}: {
  ids: readonly DocumentId[];
  activeId: DocumentId;
  activeName: string;
  activeDirty: boolean;
  documents: ReadonlyMap<DocumentId, { name: string; dirty: boolean }>;
  editingId: DocumentId | null;
  onSwitch: (id: DocumentId) => void;
  onClose: (id: DocumentId, dirty: boolean) => void;
  onPublish: () => void;
  onStartEdit: (id: DocumentId) => void;
  onCommitEdit: (id: DocumentId, next: string) => void;
  onReorder: (fromId: DocumentId, toIdx: number) => void;
}): JSX.Element {
  const [draggingId, setDraggingId] = useState<DocumentId | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = (): void => setHasOverflow(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ids]);

  useEffect(() => {
    if (!dropOpen) return;
    const onDown = (ev: MouseEvent): void => {
      if (dropRef.current && !dropRef.current.contains(ev.target as Node)) setDropOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [dropOpen]);

  // Scroll the active tab into view whenever it changes.
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  return (
    <>
      <div
        ref={scrollRef}
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        {ids.map((id, i) => {
          const isActive = id === activeId;
          const name = isActive ? activeName : (documents.get(id)?.name ?? 'untitled');
          const dirty = isActive ? activeDirty : (documents.get(id)?.dirty ?? false);
          const showDropIndicator = dropIdx === i;
          return (
            <span
              key={id}
              style={{ display: 'inline-flex', alignItems: 'stretch' }}
              onDragOver={(ev) => {
                if (!draggingId) return;
                ev.preventDefault();
                const rect = ev.currentTarget.getBoundingClientRect();
                const before = ev.clientX < rect.left + rect.width / 2;
                setDropIdx(before ? i : i + 1);
              }}
              onDrop={(ev) => {
                if (!draggingId) return;
                ev.preventDefault();
                const target = dropIdx ?? i;
                onReorder(draggingId, target);
                setDraggingId(null);
                setDropIdx(null);
              }}
            >
              {showDropIndicator ? <DropIndicator /> : null}
              <Tab
                id={id}
                name={name}
                dirty={dirty}
                active={isActive}
                editing={editingId === id}
                draggable={editingId !== id}
                isDragging={draggingId === id}
                onClick={() => onSwitch(id)}
                onStartEdit={() => onStartEdit(id)}
                onCommitEdit={(next) => onCommitEdit(id, next)}
                onClose={() => onClose(id, dirty)}
                onPublish={isActive ? onPublish : undefined}
                canClose={ids.length > 1 || !isActive}
                onDragStart={() => setDraggingId(id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropIdx(null);
                }}
              />
            </span>
          );
        })}
        {/* Final drop slot (after the last tab). */}
        <span
          style={{ flex: '0 0 12px', alignSelf: 'stretch' }}
          onDragOver={(ev) => {
            if (!draggingId) return;
            ev.preventDefault();
            setDropIdx(ids.length);
          }}
          onDrop={(ev) => {
            if (!draggingId) return;
            ev.preventDefault();
            onReorder(draggingId, ids.length);
            setDraggingId(null);
            setDropIdx(null);
          }}
        >
          {dropIdx === ids.length ? <DropIndicator /> : null}
        </span>
      </div>
      {hasOverflow ? (
        <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setDropOpen((v) => !v)}
            title={t('tabs.overflowTooltip')}
            style={{
              padding: '4px 10px',
              background: dropOpen ? '#243054' : 'transparent',
              border: '1px solid #2a3548',
              color: SURFACE.itemText,
              borderRadius: 6,
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 13,
            }}
          >
            ···
          </button>
          {dropOpen ? (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: 200,
                maxHeight: 320,
                overflowY: 'auto',
                background: '#0f1115',
                border: '1px solid #2a3548',
                borderRadius: 8,
                padding: 4,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {ids.map((id) => {
                const isActive = id === activeId;
                const name = isActive ? activeName : (documents.get(id)?.name ?? 'untitled');
                const dirty = isActive ? activeDirty : (documents.get(id)?.dirty ?? false);
                return (
                  <button
                    key={id}
                    onClick={() => {
                      onSwitch(id);
                      setDropOpen(false);
                    }}
                    style={{
                      background: isActive ? '#243054' : 'transparent',
                      color: SURFACE.itemText,
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      font: 'inherit',
                      fontSize: 13,
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#1c2230';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {name}
                    <span
            style={{
              color: '#f59e0b',
              opacity: dirty ? 1 : 0,
              transition: 'opacity 200ms ease-out',
              display: 'inline-block',
              width: 8,
              textAlign: 'center',
            }}
          >
            •
          </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function DropIndicator(): JSX.Element {
  return (
    <span
      style={{
        flex: '0 0 3px',
        alignSelf: 'stretch',
        background: SURFACE.accent,
        borderRadius: 2,
        marginRight: 2,
      }}
    />
  );
}

function Tab({
  id,
  name,
  dirty,
  active,
  editing,
  onClick,
  onClose,
  onPublish,
  onStartEdit,
  onCommitEdit,
  canClose,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: {
  id: DocumentId;
  name: string;
  dirty: boolean;
  active: boolean;
  editing: boolean;
  onClick: () => void;
  onClose: () => void;
  /** When provided, an ↗ button appears on the active tab to publish it
   *  to the saved-circuits library. Only the active tab gets the button —
   *  publishing inactive tabs would require a deeper API. */
  onPublish?: () => void;
  onStartEdit: () => void;
  onCommitEdit: (next: string) => void;
  canClose: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}): JSX.Element {
  const [draft, setDraft] = useState(name);
  // Inline tab context menu — opens on right-click.
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (): void => setMenu(null);
    window.addEventListener('mousedown', close);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('blur', close);
    };
  }, [menu]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (editing) {
      setDraft(name);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, name]);

  return (
    <div
      data-tab-id={id}
      draggable={draggable}
      onDragStart={(ev) => {
        // Tells the browser this is a move op + minimal payload so Firefox
        // actually emits the drag events. We track the source via React state.
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/x-gatecraft-tab', id);
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={editing ? undefined : onClick}
      onDoubleClick={onStartEdit}
      onContextMenu={(ev) => {
        ev.preventDefault();
        setMenu({ x: ev.clientX, y: ev.clientY });
      }}
      style={{
        // Two/three-column grid: [name 1fr] [publish? auto] [close? 18px].
        // Publish has its own label so it gets an auto column; close is
        // always the same fixed 18px slot.
        display: 'inline-grid',
        gridTemplateColumns: [
          '1fr',
          onPublish && active ? 'auto' : '',
          canClose ? '18px' : '',
        ].filter(Boolean).join(' '),
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px 6px 12px',
        // Active tab inherits the editor bg so it reads as a continuous
        // surface flowing into the canvas below. Inactive tabs sink
        // into the strip with a muted color.
        background: active ? SURFACE.editorBg : 'transparent',
        borderTop: `1px solid ${active ? SURFACE.borderColor : 'transparent'}`,
        borderLeft: `1px solid ${active ? SURFACE.borderColor : 'transparent'}`,
        borderRight: `1px solid ${active ? SURFACE.borderColor : 'transparent'}`,
        borderBottom: `2px solid ${active ? SURFACE.accent : 'transparent'}`,
        color: active ? SURFACE.itemText : SURFACE.itemSubText,
        borderRadius: '4px 4px 0 0',
        cursor: editing ? 'text' : (draggable ? 'grab' : 'pointer'),
        opacity: isDragging ? 0.4 : 1,
        fontWeight: active ? 700 : 500,
        fontSize: 13,
        flexShrink: 0,
        maxWidth: 220,
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (!active && !editing) e.currentTarget.style.background = SURFACE.itemBgHover;
      }}
      onMouseLeave={(e) => {
        if (!active && !editing) e.currentTarget.style.background = 'transparent';
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onCommitEdit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCommitEdit(draft);
              (e.target as HTMLInputElement).blur();
            } else if (e.key === 'Escape') {
              onCommitEdit(name);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: SURFACE.itemText,
            font: 'inherit',
            fontWeight: 700,
            width: Math.max(60, draft.length * 8),
            padding: 0,
          }}
        />
      ) : (
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
          <span
            style={{
              color: '#f59e0b',
              opacity: dirty ? 1 : 0,
              transition: 'opacity 200ms ease-out',
              display: 'inline-block',
              width: 8,
              textAlign: 'center',
            }}
          >
            •
          </span>
        </span>
      )}
      {onPublish && active ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPublish();
          }}
          title={t('tabs.publishTooltip')}
          aria-label={t('tabs.publishTooltip')}
          style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#86efac',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            padding: '3px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(34, 197, 94, 0.22)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(34, 197, 94, 0.12)')}
        >
          ↗ {t('tabs.publishLabel')}
        </button>
      ) : null}
      {canClose ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title={t('tabs.closeTooltip')}
          style={{
            background: 'transparent',
            border: 'none',
            color: active ? SURFACE.itemSubText : '#5b6573',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 14,
            lineHeight: 1,
            padding: '2px 6px',
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#3a4150')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          ×
        </button>
      ) : null}
      {menu ? (
        <div
          className="gc-fade-in"
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menu.y,
            left: menu.x,
            minWidth: 180,
            background: '#0f1115',
            border: '1px solid #2a3548',
            borderRadius: 6,
            padding: 4,
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {onPublish ? (
            <TabMenuItem
              label={`↗ ${t('tabs.publishLabel')}`}
              onClick={() => {
                setMenu(null);
                onPublish();
              }}
            />
          ) : null}
          {canClose ? (
            <TabMenuItem
              label={`× ${t('tabs.closeTooltip')}`}
              onClick={() => {
                setMenu(null);
                onClose();
              }}
              danger
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TabMenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        color: danger ? '#fca5a5' : '#eef1f6',
        border: 'none',
        textAlign: 'left',
        padding: '6px 12px',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12,
        borderRadius: 4,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = danger ? '#3a1d1d' : '#1c2230')
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );
}
