import { useEffect, useState } from 'react';
import { deleteSelected } from '../interaction/keyboard.js';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';

/**
 * Canvas right-click menu. The canvas controller pre-selects whatever
 * is under the cursor, then dispatches `nandbench:open-context-menu`
 * with the screen position. We listen + render a small popup, close on
 * outside-click or Esc.
 */

interface ContextEvent extends CustomEvent {
  detail: { screenX: number; screenY: number; target: 'component' | 'wire' };
}

export function ContextMenu(): JSX.Element | null {
  const [state, setState] = useState<
    | { open: false }
    | { open: true; x: number; y: number; target: 'component' | 'wire' }
  >({ open: false });
  const selection = useAppStore((s) => s.selection);

  useEffect(() => {
    const onOpen = (ev: Event): void => {
      const e = ev as ContextEvent;
      setState({
        open: true,
        x: e.detail.screenX,
        y: e.detail.screenY,
        target: e.detail.target,
      });
    };
    const onAway = (): void => setState({ open: false });
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') setState({ open: false });
    };
    window.addEventListener('nandbench:open-context-menu', onOpen);
    window.addEventListener('mousedown', onAway);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('nandbench:open-context-menu', onOpen);
      window.removeEventListener('mousedown', onAway);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!state.open) return null;

  const wireCount = selection.wireIds?.size ?? 0;
  const compCount = selection.componentIds.size;

  return (
    <div
      className="gc-fade-in"
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: state.y,
        left: state.x,
        minWidth: 160,
        background: '#0f1115',
        border: '1px solid #2a3548',
        borderRadius: 6,
        padding: 4,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <MenuItem
        label={
          state.target === 'wire'
            ? t('contextMenu.deleteWires', { n: Math.max(1, wireCount) })
            : t('contextMenu.deleteComponents', { n: Math.max(1, compCount) })
        }
        onClick={() => {
          deleteSelected();
          setState({ open: false });
        }}
        danger
      />
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger = false,
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
        color: danger ? '#fca5a5' : '#e6e6e6',
        border: 'none',
        textAlign: 'left',
        padding: '6px 10px',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12,
        borderRadius: 3,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1c2230')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );
}
