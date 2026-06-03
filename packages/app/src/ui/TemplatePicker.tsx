import { useEffect, useState } from 'react';
import { TEMPLATES, type Template } from '../fixtures/templates.js';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';
import { ModalCloseButton } from './ModalCloseButton.js';

/**
 * Modal that lets the user start a new circuit from one of the curated
 * templates. Opened via the Toolbar's "new" button (it dispatches a
 * window event we listen for here).
 */
export function TemplatePicker(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const locale = useAppStore((s) => s.locale);
  void locale;
  const loadDocument = useAppStore((s) => s.loadDocument);
  const hasDoc = useAppStore((s) => s.document.components.length > 0);

  useEffect(() => {
    const onOpen = (): void => setOpen(true);
    window.addEventListener('nandbench:open-template-picker', onOpen);
    const onKey = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('nandbench:open-template-picker', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  const choose = (tpl: Template): void => {
    if (hasDoc && !window.confirm(t('templates.confirmOverwrite'))) return;
    loadDocument(tpl.build());
    setOpen(false);
  };

  return (
    <div
      onClick={() => setOpen(false)}
      className="gc-fade-in"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7, 9, 12, 0.7)',
        backdropFilter: 'blur(2px)',
        zIndex: 100,
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
          width: 'min(900px, 90vw)',
          maxHeight: '80vh',
          background: '#0f1115',
          border: '1px solid #1f2632',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        <ModalCloseButton onClick={() => setOpen(false)} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e6e6e6' }}>
            {t('templates.pickTitle')}
          </div>
          <div style={{ fontSize: 12, color: '#9aa4b2', marginTop: 4 }}>
            {t('templates.pickSubtitle')}
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            overflowY: 'auto',
          }}
        >
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => choose(tpl)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                background: '#161b25',
                border: '1px solid #1f2632',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#e6e6e6',
                cursor: 'pointer',
                font: 'inherit',
                textAlign: 'left',
                minHeight: 86,
                transition: 'background 0.1s, border-color 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1c2230';
                e.currentTarget.style.borderColor = '#3b6ec3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#161b25';
                e.currentTarget.style.borderColor = '#1f2632';
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t(tpl.nameKey)}</span>
              <span style={{ fontSize: 11, color: '#9aa4b2', lineHeight: 1.4 }}>
                {t(tpl.descriptionKey)}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'transparent',
              border: '1px solid #1f2632',
              borderRadius: 6,
              color: '#9aa4b2',
              padding: '6px 14px',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            {t('templates.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
