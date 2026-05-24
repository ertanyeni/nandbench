import { t } from '../i18n/index.js';

/**
 * Small absolutely-positioned `×` button for modal headers — keeps the
 * close affordance discoverable even when backdrop-click and Esc both
 * already work. Parent must have `position: relative`.
 */
export function ModalCloseButton({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button
      onClick={onClick}
      aria-label={t('assistant.close')}
      title={t('assistant.close')}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'transparent',
        border: '1px solid #2a3548',
        color: '#9aa4b2',
        borderRadius: 5,
        padding: '3px 8px',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 13,
        lineHeight: 1,
        zIndex: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#1c2230';
        e.currentTarget.style.color = '#e6e6e6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#9aa4b2';
      }}
    >
      ×
    </button>
  );
}
