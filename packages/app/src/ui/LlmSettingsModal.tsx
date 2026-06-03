import { useEffect, useState } from 'react';
import { readLlmConfig, writeLlmConfig, type LlmConfig } from '../assistant/llm-bridge.js';
import { t } from '../i18n/index.js';
import { ModalCloseButton } from './ModalCloseButton.js';

/**
 * LLM settings modal — collects the endpoint / token / model for the
 * optional self-hosted (or BYO) LLM. Everything stays in localStorage;
 * the nandbench.app servers never see these values.
 *
 * Opens via window event `nandbench:open-llm-settings`.
 */
export function LlmSettingsModal(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LlmConfig>({ endpoint: '', token: '', model: '' });

  useEffect(() => {
    const handler = (): void => {
      const cfg = readLlmConfig();
      setDraft(cfg ?? { endpoint: '', token: '', model: 'qwen2.5:3b-instruct' });
      setOpen(true);
    };
    window.addEventListener('nandbench:open-llm-settings', handler);
    const onKey = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('nandbench:open-llm-settings', handler);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  const save = (): void => {
    if (!draft.endpoint || !draft.token || !draft.model) {
      writeLlmConfig(null);
    } else {
      writeLlmConfig(draft);
    }
    setOpen(false);
  };

  const disable = (): void => {
    writeLlmConfig(null);
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
            {t('llm.title')}
          </div>
          <div style={{ fontSize: 12, color: '#9aa4b2', marginTop: 6, lineHeight: 1.55 }}>
            {t('llm.subtitle')}
          </div>
        </div>
        <Field
          label={t('llm.endpoint')}
          placeholder="https://ai.example.com"
          value={draft.endpoint}
          onChange={(v) => setDraft((d) => ({ ...d, endpoint: v }))}
        />
        <Field
          label={t('llm.token')}
          placeholder="long-random-string"
          value={draft.token}
          onChange={(v) => setDraft((d) => ({ ...d, token: v }))}
          type="password"
        />
        <Field
          label={t('llm.model')}
          placeholder="qwen2.5:3b-instruct"
          value={draft.model}
          onChange={(v) => setDraft((d) => ({ ...d, model: v }))}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button onClick={disable} style={btnSecondary}>
            {t('llm.disable')}
          </button>
          <button onClick={() => setOpen(false)} style={btnSecondary}>
            {t('llm.cancel')}
          </button>
          <button onClick={save} style={btnPrimary}>
            {t('llm.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
}): JSX.Element {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: '#9aa4b2' }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#0c1018',
          color: '#e6e6e6',
          border: '1px solid #2a3548',
          borderRadius: 6,
          padding: '6px 10px',
          font: 'inherit',
          fontSize: 12,
          outline: 'none',
        }}
      />
    </label>
  );
}

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  color: '#9aa4b2',
  border: '1px solid #2a3548',
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 12,
};

const btnPrimary: React.CSSProperties = {
  background: '#1f3a66',
  color: '#e6e6e6',
  border: '1px solid #3b6ec3',
  borderRadius: 6,
  padding: '6px 14px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 12,
  fontWeight: 700,
};
