import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import {
  API_BASE_URL,
  claimCircuit,
  createCircuit,
  deleteCircuit,
  getCircuit,
  getEditToken,
  logout,
  me,
  myCircuits,
  patchCircuit,
  rememberEditToken,
  requestMagicLink,
  type CloudCircuitSummary,
} from '../model/cloud-client.js';
import { snapshotCloudDoc } from '../model/cloud-snapshot.js';
import { useAppStore } from '../model/store.js';
import { restoreProject } from '../App.js';
import { ModalCloseButton } from './ModalCloseButton.js';

/**
 * Single-purpose cloud modal. Three stacked sections:
 *   1. Account — signed-in badge or magic-link request form.
 *   2. This circuit — save / update / share / claim.
 *   3. My circuits — listing for signed-in users.
 *
 * Opens via the `nandbench:open-cloud` event (dispatched by the Toolbar).
 */
export function CloudModal(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  const [email, setEmail] = useState('');
  const [circuits, setCircuits] = useState<readonly CloudCircuitSummary[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const cloudCircuitId = useAppStore((s) => s.cloudCircuitId);
  const cloudEmail = useAppStore((s) => s.cloudEmail);
  const cloudLastSyncAt = useAppStore((s) => s.cloudLastSyncAt);
  const activeName = useAppStore((s) => s.activeDocumentName);

  // Hot-reload the user + library every time the modal opens.
  useEffect(() => {
    const onOpen = async (): Promise<void> => {
      setOpen(true);
      setErr(null);
      setLinkSent(false);
      setLinkCopied(false);
      try {
        const user = await me();
        useAppStore.getState().setCloudEmail(user?.email ?? null);
        if (user) {
          const list = await myCircuits();
          setCircuits(list);
        } else {
          setCircuits([]);
        }
      } catch {
        setErr(t('cloud.errorGeneric'));
      }
    };
    window.addEventListener('nandbench:open-cloud', onOpen);
    const esc = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('nandbench:open-cloud', onOpen);
      window.removeEventListener('keydown', esc);
    };
  }, []);

  if (!open) return null;

  const saveOrUpdate = async (): Promise<void> => {
    setBusy(true);
    setErr(null);
    try {
      const doc = snapshotCloudDoc();
      if (cloudCircuitId) {
        await patchCircuit(cloudCircuitId, { name: activeName, doc });
      } else {
        const out = await createCircuit({ name: activeName, doc });
        useAppStore.getState().setCloudBinding({ id: out.id });
        if (cloudEmail) {
          const list = await myCircuits();
          setCircuits(list);
        }
        return;
      }
      useAppStore.getState().setCloudBinding({ id: cloudCircuitId });
    } catch {
      setErr(t('cloud.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const sendMagicLink = async (): Promise<void> => {
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await requestMagicLink(email.trim());
      setLinkSent(true);
    } catch {
      setErr(t('cloud.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch {
      /* even if the server is unreachable we drop local state */
    }
    useAppStore.getState().setCloudEmail(null);
    setCircuits([]);
  };

  const openCircuit = async (id: string): Promise<void> => {
    setBusy(true);
    setErr(null);
    try {
      const c = await getCircuit(id);
      restoreProject(c.doc.library, c.doc.locale, c.doc.project);
      useAppStore.getState().setCloudBinding({ id: c.id });
      setOpen(false);
    } catch {
      setErr(t('cloud.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const removeCircuit = async (id: string): Promise<void> => {
    setBusy(true);
    setErr(null);
    try {
      await deleteCircuit(id);
      setCircuits((cs) => cs.filter((c) => c.id !== id));
      if (useAppStore.getState().cloudCircuitId === id) {
        useAppStore.getState().setCloudBinding({ id: null, lastSyncAt: null });
      }
    } catch {
      setErr(t('cloud.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const doClaim = async (): Promise<void> => {
    if (!cloudCircuitId) return;
    const token = getEditToken(cloudCircuitId);
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      await claimCircuit(cloudCircuitId, token);
      const list = await myCircuits();
      setCircuits(list);
    } catch {
      setErr(t('cloud.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const copyShareLink = async (): Promise<void> => {
    if (!cloudCircuitId) return;
    const url = `${window.location.origin}${window.location.pathname}?c=${cloudCircuitId}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  };

  const subtle = '#9aa4b2';
  const fmtWhen = (ts: number | null): string =>
    ts ? new Date(ts).toLocaleString() : '—';

  return (
    <div
      className="gc-fade-in"
      onClick={() => setOpen(false)}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7, 9, 12, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="gc-modal-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 'min(560px, 92vw)',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#0f1115',
          border: '1px solid #2a3548',
          borderRadius: 12,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        <ModalCloseButton onClick={() => setOpen(false)} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e6e6e6' }}>
            {t('cloud.title')}
          </div>
          <div style={{ fontSize: 12, color: subtle, marginTop: 6, lineHeight: 1.55 }}>
            {t('cloud.subtitle')}
          </div>
        </div>

        {/* Account section */}
        <Section
          title={cloudEmail ? t('cloud.signedInAs', { email: cloudEmail }) : t('cloud.anonymous')}
        >
          {cloudEmail ? (
            <button type="button" onClick={doLogout} style={btn('ghost')}>
              {t('cloud.signOut')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="email"
                  placeholder={t('cloud.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={input()}
                />
                <button
                  type="button"
                  onClick={sendMagicLink}
                  disabled={busy || !email.trim()}
                  style={btn('primary')}
                >
                  {t('cloud.sendLink')}
                </button>
              </div>
              {linkSent ? (
                <div style={{ fontSize: 12, color: '#9aedaa' }}>{t('cloud.linkSent')}</div>
              ) : null}
            </div>
          )}
        </Section>

        {/* This circuit section */}
        <Section title={`"${activeName || 'untitled'}"`}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={saveOrUpdate} disabled={busy} style={btn('primary')}>
              {cloudCircuitId ? t('cloud.saveAgain') : t('cloud.saveCurrent')}
            </button>
            {cloudCircuitId ? (
              <>
                <button type="button" onClick={copyShareLink} style={btn('ghost')}>
                  {linkCopied ? t('cloud.linkCopied') : t('cloud.copyLink')}
                </button>
                {cloudEmail && !circuits.some((c) => c.id === cloudCircuitId) ? (
                  <button type="button" onClick={doClaim} style={btn('ghost')}>
                    {t('cloud.claim')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => useAppStore.getState().setCloudBinding({ id: null, lastSyncAt: null })}
                  style={btn('ghost')}
                >
                  {t('cloud.unbind')}
                </button>
              </>
            ) : null}
          </div>
          {cloudCircuitId ? (
            <div style={{ fontSize: 11, color: subtle, marginTop: 6 }}>
              {t('cloud.lastSync', { when: fmtWhen(cloudLastSyncAt) })}
              {' · '}
              <code style={{ color: '#7ea7d7' }}>{cloudCircuitId.slice(0, 8)}…</code>
            </div>
          ) : null}
        </Section>

        {/* My circuits */}
        {cloudEmail ? (
          <Section title={t('cloud.myCircuits')}>
            {circuits.length === 0 ? (
              <div style={{ fontSize: 12, color: subtle }}>{t('cloud.noCircuits')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {circuits.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: '#10141c',
                      border: '1px solid #1d2532',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#dde4ef', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 10, color: subtle }}>
                        {new Date(c.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // remember edit token for owner so PATCH headers work
                        // even before the modal reopens
                        if (!getEditToken(c.id)) rememberEditToken(c.id, '');
                        void openCircuit(c.id);
                      }}
                      style={btn('ghost', { compact: true })}
                    >
                      {t('cloud.loadCircuit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCircuit(c.id)}
                      style={btn('ghost', { compact: true, danger: true })}
                      aria-label="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        ) : null}

        {err ? (
          <div
            style={{
              fontSize: 12,
              color: '#fda4a4',
              background: '#2a1418',
              border: '1px solid #4a2026',
              borderRadius: 6,
              padding: '6px 10px',
            }}
          >
            {err}
          </div>
        ) : null}

        <div style={{ fontSize: 10, color: '#5a6573' }}>
          API: <code style={{ color: '#7ea7d7' }}>{API_BASE_URL}</code>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        background: '#0c1018',
        border: '1px solid #2a3548',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 11, color: '#9aa4b2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function btn(
  variant: 'primary' | 'ghost',
  opts?: { compact?: boolean; danger?: boolean },
): React.CSSProperties {
  return {
    background: variant === 'primary' ? '#3a82d6' : 'transparent',
    color: opts?.danger ? '#fda4a4' : variant === 'primary' ? '#fff' : '#cbd5e1',
    border: variant === 'primary' ? '1px solid #3a82d6' : '1px solid #2a3548',
    borderRadius: 5,
    padding: opts?.compact ? '4px 10px' : '6px 12px',
    font: 'inherit',
    fontSize: opts?.compact ? 12 : 13,
    cursor: 'pointer',
  };
}

function input(): React.CSSProperties {
  return {
    flex: 1,
    background: '#0c1018',
    border: '1px solid #2a3548',
    borderRadius: 5,
    color: '#dde4ef',
    padding: '6px 10px',
    font: 'inherit',
    fontSize: 13,
    outline: 'none',
  };
}
