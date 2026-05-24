import { useEffect, useLayoutEffect, useState } from 'react';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';

/**
 * Interactive 5-step tour.
 *
 * Opens via a window event (`gatecraft:open-tour`). For each step we find
 * the target element by data-tour attribute, measure its bounding rect,
 * and overlay:
 *   - a "spotlight" hole (cut from a translucent backdrop using inset
 *     box-shadow — the classic single-div pattern)
 *   - a floating callout balloon with the step's title + body and
 *     skip/next/done controls.
 *
 * If a target is missing (because the user toggled off the panel), we just
 * center the balloon — no crash, no abort.
 */

interface TourStep {
  readonly selector: string;
  readonly titleKey: string;
  readonly bodyKey: string;
}

const STEPS: readonly TourStep[] = [
  { selector: '[data-tour="palette"]', titleKey: 'tour.step1.title', bodyKey: 'tour.step1.body' },
  { selector: '[data-tour="palette-and"]', titleKey: 'tour.step2.title', bodyKey: 'tour.step2.body' },
  { selector: '[data-tour="canvas"]', titleKey: 'tour.step3.title', bodyKey: 'tour.step3.body' },
  { selector: '[data-tour="play"]', titleKey: 'tour.step4.title', bodyKey: 'tour.step4.body' },
  { selector: '[data-tour="lessons"]', titleKey: 'tour.step5.title', bodyKey: 'tour.step5.body' },
];

export function TourOverlay(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const locale = useAppStore((s) => s.locale);
  void locale;

  useEffect(() => {
    const onOpen = (): void => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener('gatecraft:open-tour', onOpen);
    const onKey = (ev: KeyboardEvent): void => {
      if (!open) return;
      if (ev.key === 'Escape') setOpen(false);
      else if (ev.key === 'Enter') setStep((s) => Math.min(STEPS.length - 1, s + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('gatecraft:open-tour', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Re-measure whenever the active step (or window) changes.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = (): void => {
      const target = document.querySelector(STEPS[step]!.selector);
      setRect(target ? target.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    const id = window.setInterval(measure, 250); // catch layout shifts after re-renders
    return () => {
      window.removeEventListener('resize', measure);
      window.clearInterval(id);
    };
  }, [step, open]);

  if (!open) return null;

  const active = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  // Position the balloon: try to the right of the rect; fall back to below; else centered.
  const balloon = balloonPosition(rect);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, pointerEvents: 'auto' }}>
      {/* Spotlight: a positioned div whose box-shadow creates the dark mask. */}
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(7, 9, 12, 0.78), 0 0 0 3px #60a5fa inset',
            pointerEvents: 'none',
            transition: 'top 0.2s, left 0.2s, width 0.2s, height 0.2s',
          }}
        />
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 9, 12, 0.78)',
          }}
        />
      )}
      {/* Balloon */}
      <div
        style={{
          position: 'fixed',
          top: balloon.top,
          left: balloon.left,
          width: 320,
          background: '#0f1115',
          border: '1px solid #3b6ec3',
          borderRadius: 10,
          padding: 16,
          color: '#e6e6e6',
          boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700 }}>{t(active.titleKey)}</div>
        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.55 }}>{t(active.bodyKey)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#7c8696' }}>
            {step + 1} / {STEPS.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: '1px solid #1f2632',
                color: '#9aa4b2',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 12,
              }}
            >
              {t('tour.skip')}
            </button>
            <button
              onClick={() => {
                if (isLast) setOpen(false);
                else setStep(step + 1);
              }}
              style={{
                background: '#1f3a66',
                border: '1px solid #3b6ec3',
                color: '#e6e6e6',
                borderRadius: 6,
                padding: '5px 12px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {isLast ? t('tour.done') : t('tour.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function balloonPosition(rect: DOMRect | null): { top: number; left: number } {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const balloonW = 320;
  const balloonH = 160;
  const gap = 16;
  if (!rect) {
    return { top: H / 2 - balloonH / 2, left: W / 2 - balloonW / 2 };
  }
  // Prefer right side; if no room, fall back to below; then above; then center.
  if (rect.right + gap + balloonW < W - 12) {
    const top = Math.min(H - balloonH - 12, Math.max(12, rect.top));
    return { top, left: rect.right + gap };
  }
  if (rect.bottom + gap + balloonH < H - 12) {
    const left = Math.min(W - balloonW - 12, Math.max(12, rect.left));
    return { top: rect.bottom + gap, left };
  }
  if (rect.top - gap - balloonH > 12) {
    const left = Math.min(W - balloonW - 12, Math.max(12, rect.left));
    return { top: rect.top - gap - balloonH, left };
  }
  return { top: H / 2 - balloonH / 2, left: W / 2 - balloonW / 2 };
}
