import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';
import { ModalCloseButton } from './ModalCloseButton.js';

/**
 * First-run welcome screen. Shown once (localStorage flag) unless the user
 * dismisses via "Don't show again". Routes the user into:
 *   - the lessons modal (recommended for first-timers)
 *   - the templates picker (browse working circuits)
 *   - a blank canvas (advanced users)
 */
const FLAG_KEY = 'gatecraft:welcomed:v1';

export function WelcomeModal(): JSX.Element | null {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(FLAG_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const locale = useAppStore((s) => s.locale);
  void locale;
  const loadDocument = useAppStore((s) => s.loadDocument);
  const [skipNext, setSkipNext] = useState(false);

  // Manual re-open via Toolbar event (we add a "welcome" button later if
  // the user wants it back). For now Welcome is one-shot.
  useEffect(() => {
    const handler = (): void => setOpen(true);
    window.addEventListener('gatecraft:open-welcome', handler);
    return () => window.removeEventListener('gatecraft:open-welcome', handler);
  }, []);

  if (!open) return null;

  const dismiss = (): void => {
    if (skipNext) {
      try {
        localStorage.setItem(FLAG_KEY, '1');
      } catch {
        // ignore
      }
    }
    setOpen(false);
  };

  const startTour = (): void => {
    dismiss();
    setTimeout(() => window.dispatchEvent(new Event('gatecraft:open-tour')), 80);
  };
  const startLessons = (): void => {
    dismiss();
    setTimeout(() => window.dispatchEvent(new Event('gatecraft:open-lessons')), 80);
  };
  const openTemplates = (): void => {
    dismiss();
    setTimeout(() => window.dispatchEvent(new Event('gatecraft:open-template-picker')), 80);
  };
  const startEmpty = (): void => {
    loadDocument({ components: [], wires: [] });
    dismiss();
  };

  return (
    <div
      className="gc-fade-in"
      onClick={dismiss}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7, 9, 12, 0.78)',
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
          width: 'min(720px, 90vw)',
          background: '#0f1115',
          border: '1px solid #1f2632',
          borderRadius: 14,
          padding: 26,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}
      >
        <ModalCloseButton onClick={dismiss} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e6e6e6' }}>
            {t('welcome.title')}
          </div>
          <div style={{ fontSize: 13, color: '#9aa4b2', marginTop: 6, lineHeight: 1.55 }}>
            {t('welcome.subtitle')}
          </div>
        </div>
        <LayoutGuide />
        <ShortcutsStrip />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <Cta
            title={t('welcome.cta.tour')}
            sub={t('welcome.cta.tourSub')}
            onClick={startTour}
            accent
          />
          <Cta
            title={t('welcome.cta.learn')}
            sub={t('welcome.cta.learnSub')}
            onClick={startLessons}
          />
          <Cta
            title={t('welcome.cta.templates')}
            sub={t('welcome.cta.templatesSub')}
            onClick={openTemplates}
          />
          <Cta
            title={t('welcome.cta.empty')}
            sub={t('welcome.cta.emptySub')}
            onClick={startEmpty}
          />
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#7c8696',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={skipNext}
            onChange={(e) => setSkipNext(e.target.checked)}
            style={{ accentColor: '#60a5fa' }}
          />
          {t('welcome.skipNext')}
        </label>
      </div>
    </div>
  );
}

function LayoutGuide(): JSX.Element {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 1fr',
        rowGap: 8,
        columnGap: 12,
        padding: 12,
        background: '#0c1018',
        border: '1px solid #1c2230',
        borderRadius: 8,
        fontSize: 12,
        color: '#a8b4c7',
        lineHeight: 1.5,
      }}
    >
      <span style={{ textAlign: 'center', color: '#a78bfa' }}>◧</span>
      <span>{t('welcome.layout.activity')}</span>
      <span style={{ textAlign: 'center', color: '#60a5fa' }}>▦</span>
      <span>{t('welcome.layout.palette')}</span>
      <span style={{ textAlign: 'center', color: '#86efac' }}>▶</span>
      <span>{t('welcome.layout.editor')}</span>
      <span style={{ textAlign: 'center', color: '#f59e0b' }}>▤</span>
      <span>{t('welcome.layout.inspector')}</span>
    </div>
  );
}

function ShortcutsStrip(): JSX.Element {
  const items: Array<[string, string]> = [
    ['⌘P', t('welcome.shortcut.quickopen')],
    ['⌘S', t('welcome.shortcut.save')],
    ['⌘F', t('welcome.shortcut.fit')],
    ['⌘/', t('welcome.shortcut.tour')],
    ['R', t('welcome.shortcut.rotate')],
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map(([key, label]) => (
        <span
          key={key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: '#13161d',
            border: '1px solid #1c2230',
            borderRadius: 5,
            fontSize: 11,
            color: '#a8b4c7',
          }}
        >
          <kbd
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 10,
              color: '#dde4ef',
              background: '#0c1018',
              padding: '1px 5px',
              borderRadius: 3,
              border: '1px solid #2a3548',
            }}
          >
            {key}
          </kbd>
          {label}
        </span>
      ))}
    </div>
  );
}

function Cta({
  title,
  sub,
  onClick,
  accent = false,
}: {
  title: string;
  sub: string;
  onClick: () => void;
  accent?: boolean;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        textAlign: 'left',
        padding: '14px 14px 16px',
        background: accent ? '#13243f' : '#161b25',
        border: `1px solid ${accent ? '#3b6ec3' : '#1f2632'}`,
        borderRadius: 10,
        color: '#e6e6e6',
        cursor: 'pointer',
        font: 'inherit',
        transition: 'background 0.1s, border-color 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = accent ? '#1f3a66' : '#1c2230';
        e.currentTarget.style.borderColor = '#3b6ec3';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = accent ? '#13243f' : '#161b25';
        e.currentTarget.style.borderColor = accent ? '#3b6ec3' : '#1f2632';
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 11, color: '#9aa4b2', lineHeight: 1.5 }}>{sub}</span>
    </button>
  );
}
