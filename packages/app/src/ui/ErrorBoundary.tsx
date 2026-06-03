import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Top-level React error boundary. Catches render-time errors from any
 * descendant component so the editor falls back to a recovery modal
 * instead of a blank screen.
 *
 * Rescue options offered to the user:
 *   - Reload the page (most errors are recoverable).
 *   - Copy the error stack to the clipboard (so they can paste it
 *     into an issue).
 *   - Clear localStorage (rescue when corrupted persisted state is
 *     what's crashing the app on every reload).
 *
 * The boundary intentionally does NOT phone home — errors stay on the
 * user's machine. If we want telemetry later, this is the place to
 * add a single POST to the API.
 */
interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface to the console — useful when the user reports it.
    // eslint-disable-next-line no-console
    console.error('[nandbench] render error caught by ErrorBoundary', error, info);
    this.setState({ info });
  }

  private reload = (): void => {
    window.location.reload();
  };

  private copy = (): void => {
    const text = this.detail();
    void navigator.clipboard.writeText(text);
  };

  private clearStorage = (): void => {
    // Defensive: localStorage may itself throw (private mode).
    try {
      // Only wipe nandbench-prefixed keys so we don't clobber other apps
      // sharing the origin.
      const remove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('nandbench:')) remove.push(k);
      }
      for (const k of remove) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  private detail(): string {
    const { error, info } = this.state;
    return [
      `nandbench error report — ${new Date().toISOString()}`,
      '',
      `Message: ${error?.message ?? '(none)'}`,
      '',
      'Stack:',
      error?.stack ?? '(no stack)',
      '',
      'Component stack:',
      info?.componentStack ?? '(no component stack)',
      '',
      `URL: ${window.location.href}`,
      `UA: ${navigator.userAgent}`,
    ].join('\n');
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const subtle = '#9aa4b2';
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 9, 12, 0.92)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: 'min(520px, 92vw)',
            background: '#0f1115',
            border: '1px solid #4a2026',
            borderRadius: 12,
            padding: 22,
            color: '#e6e6e6',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fda4a4' }}>
            Something went wrong.
          </div>
          <div style={{ fontSize: 13, color: subtle, lineHeight: 1.55 }}>
            The editor hit an unexpected error and stopped rendering. Your work
            so far is still saved locally; reloading is usually enough. If the
            same error happens again right after a reload, try clearing the
            local state.
          </div>
          <pre
            style={{
              fontSize: 11,
              color: '#cbd5e1',
              background: '#0c1018',
              border: '1px solid #1f2632',
              borderRadius: 6,
              padding: 10,
              maxHeight: 160,
              overflow: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {this.state.error.message}
          </pre>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={this.reload} style={btn('primary')}>
              Reload
            </button>
            <button type="button" onClick={this.copy} style={btn('ghost')}>
              Copy error details
            </button>
            <button type="button" onClick={this.clearStorage} style={btn('danger')}>
              Reset local state &amp; reload
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#5b6573' }}>
            &quot;Reset local state&quot; wipes only nandbench keys from localStorage —
            other sites are untouched.
          </div>
        </div>
      </div>
    );
  }
}

function btn(variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties {
  const bg = variant === 'primary' ? '#3a82d6' : variant === 'danger' ? '#5a2026' : 'transparent';
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? '#fda4a4' : '#cbd5e1';
  const border =
    variant === 'primary' ? '#3a82d6' : variant === 'danger' ? '#7a3036' : '#2a3548';
  return {
    background: bg,
    color: fg,
    border: `1px solid ${border}`,
    borderRadius: 5,
    padding: '6px 12px',
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  };
}
