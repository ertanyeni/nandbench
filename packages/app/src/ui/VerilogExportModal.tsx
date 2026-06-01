import { useEffect, useState } from 'react';
import { challengeFor } from '../challenges.js';
import { LESSONS } from '../lessons.js';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';
import { exportVerilog } from '../model/verilog-export.js';
import { exportTestbench } from '../model/verilog-testbench.js';
import { ModalCloseButton } from './ModalCloseButton.js';

/**
 * Verilog export workflow. Opens via `gatecraft:open-verilog-export`.
 * Lets the user pick a module name, optionally bundle a testbench
 * derived from any lesson's challenge spec, and download the result as
 * a single `.v` file (or `.zip` when a testbench is included).
 */
export function VerilogExportModal(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [withTb, setWithTb] = useState(false);
  const [lessonId, setLessonId] = useState<string>('');
  const locale = useAppStore((s) => s.locale);
  void locale;

  useEffect(() => {
    const onOpen = (): void => {
      const tabName = useAppStore.getState().activeDocumentName || 'top';
      setModuleName(tabName);
      setWithTb(false);
      setLessonId('');
      setOpen(true);
    };
    window.addEventListener('gatecraft:open-verilog-export', onOpen);
    const esc = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('gatecraft:open-verilog-export', onOpen);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!open) return null;

  // Lessons that ship with a challenge spec — those are the ones whose
  // testbench can be auto-generated from gatecraft truth-table cases.
  const lessonsWithChallenges = LESSONS.filter((l) => challengeFor(l.id) !== null);

  const download = (filename: string, content: string, mime = 'text/plain'): void => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (): void => {
    const s = useAppStore.getState();
    const v = exportVerilog(s.document, s.library, moduleName || 'top');
    const safeName = (moduleName || 'top').replace(/[^a-zA-Z0-9_]/g, '_');
    if (withTb && lessonId) {
      const ch = challengeFor(lessonId);
      if (!ch) {
        download(`${safeName}.v`, v);
      } else {
        const tb = exportTestbench(ch, { dutModuleName: moduleName || 'top', lessonId });
        // Multi-file: combine into one .v file as concatenated modules
        // (Icarus accepts this directly: iverilog -o run combined.v).
        const combined = `${v}\n\n${tb}\n`;
        download(`${safeName}_with_tb.v`, combined);
      }
    } else {
      download(`${safeName}.v`, v);
    }
    setOpen(false);
  };

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
          width: 'min(520px, 90vw)',
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
            {t('verilog.title')}
          </div>
          <div style={{ fontSize: 12, color: '#9aa4b2', marginTop: 6, lineHeight: 1.55 }}>
            {t('verilog.subtitle')}
          </div>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#9aa4b2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {t('verilog.moduleName')}
          </span>
          <input
            type="text"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            style={{
              background: '#0c1018',
              border: '1px solid #2a3548',
              borderRadius: 5,
              color: '#dde4ef',
              padding: '6px 10px',
              font: 'inherit',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1' }}>
          <input
            type="checkbox"
            checked={withTb}
            onChange={(e) => setWithTb(e.target.checked)}
            style={{ accentColor: '#60a5fa' }}
          />
          {t('verilog.includeTb')}
        </label>
        {withTb ? (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#9aa4b2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {t('verilog.tbLessonSource')}
            </span>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              style={{
                background: '#0c1018',
                border: '1px solid #2a3548',
                borderRadius: 5,
                color: '#dde4ef',
                padding: '6px 10px',
                font: 'inherit',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="">{t('verilog.tbPickLesson')}</option>
              {lessonsWithChallenges.map((l) => (
                <option key={l.id} value={l.id}>
                  {t(l.titleKey)}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: '#7c8696', marginTop: 4, lineHeight: 1.5 }}>
              {t('verilog.tbHint')}
            </span>
          </label>
        ) : null}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              padding: '7px 14px',
              background: 'transparent',
              border: '1px solid #2a3548',
              color: '#cbd5e1',
              borderRadius: 6,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            {t('verilog.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={withTb && !lessonId}
            style={{
              marginLeft: 'auto',
              padding: '7px 14px',
              background: '#1f3a66',
              border: '1px solid #3b6ec3',
              color: '#e6e6e6',
              borderRadius: 6,
              cursor: withTb && !lessonId ? 'default' : 'pointer',
              font: 'inherit',
              fontWeight: 700,
              opacity: withTb && !lessonId ? 0.5 : 1,
            }}
          >
            {t('verilog.download')}
          </button>
        </div>
      </div>
    </div>
  );
}
