import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { helpForKind } from '../model/kind-help.js';

interface TipState {
  readonly kind: string;
  readonly x: number;
  readonly y: number;
}

/**
 * DOM-side tooltip for suggestion-hint hover. The canvas-controller
 * emits `gatecraft:hover-suggestion` events whenever the pointer is
 * over a "+ kind" bubble; we paint a tiny chip with the kind's
 * one-line description from helpForKind.
 */
export function SuggestionTooltip(): JSX.Element | null {
  const [tip, setTip] = useState<TipState | null>(null);
  useEffect(() => {
    const onHover = (ev: Event): void => {
      const detail = (ev as CustomEvent<TipState | null>).detail;
      setTip(detail ?? null);
    };
    window.addEventListener('gatecraft:hover-suggestion', onHover);
    return () => window.removeEventListener('gatecraft:hover-suggestion', onHover);
  }, []);

  if (!tip) return null;
  const help = helpForKind(tip.kind);
  const title = help?.title ?? tip.kind;
  const desc = help?.description ?? t('palette.suggestion.tooltip');

  return (
    <div
      className="gc-fade-in"
      role="tooltip"
      style={{
        position: 'fixed',
        left: tip.x + 14,
        top: tip.y + 14,
        maxWidth: 240,
        padding: '6px 10px',
        background: 'rgba(20, 25, 36, 0.96)',
        border: '1px solid #3b6ec3',
        borderRadius: 5,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        color: '#dbeafe',
        fontSize: 11,
        lineHeight: 1.5,
        pointerEvents: 'none',
        zIndex: 220,
      }}
    >
      <div style={{ fontWeight: 700, color: '#eef1f6', marginBottom: 2 }}>{title}</div>
      <div style={{ color: '#a8b4c7' }}>{desc}</div>
    </div>
  );
}
