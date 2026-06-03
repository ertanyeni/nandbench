/**
 * nandbench icon set — small monochrome stroke icons used in the
 * ActivityBar (and reusable elsewhere). Each icon is a self-contained
 * SVG component that paints with `currentColor`, so the parent button's
 * `color` style alone decides the rendered tone.
 *
 * Design notes:
 *   - 22×22 viewbox, 1.6 stroke, round line caps + joins — reads cleanly
 *     at the 22px ActivityBar size and remains crisp at 2× DPR.
 *   - Slight nandbench personality:
 *       Assistant → 4-point sparkle with twin accent dots (the rule-
 *                   based + LLM duality).
 *       Lessons   → open book with a bookmark ribbon.
 *       Glossary  → stacked books with a side label tab.
 *       History   → bent timeline arrow.
 *       Waveform  → digital-style square waveform (1010 pattern), nodding
 *                   to the actual signal shapes the engine renders.
 */

import type { CSSProperties } from 'react';

interface IconProps {
  readonly size?: number;
  readonly style?: CSSProperties;
  readonly className?: string;
}

const baseProps = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.6,
};

export function AssistantIcon({ size = 22, style, className }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      aria-hidden
      style={style}
      className={className}
      stroke="currentColor"
      {...baseProps}
    >
      {/* Four-point sparkle. */}
      <path d="M11 2.5 L12.5 9 L19 11 L12.5 13 L11 19.5 L9.5 13 L3 11 L9.5 9 Z" />
      {/* Twin accent dots — rule-based + LLM duality. */}
      <circle cx="17.5" cy="4.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LessonsIcon({ size = 22, style, className }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      aria-hidden
      style={style}
      className={className}
      stroke="currentColor"
      {...baseProps}
    >
      {/* Open book — twin pages meeting at center spine. */}
      <path d="M3 5.5 C5 5 8 5 11 6.5 C14 5 17 5 19 5.5 L19 17 C17 16.5 14 16.5 11 18 C8 16.5 5 16.5 3 17 Z" />
      {/* Center spine. */}
      <path d="M11 6.5 L11 18" />
      {/* Bookmark ribbon. */}
      <path d="M14.5 5.5 L14.5 10 L15.5 9 L16.5 10 L16.5 5.5" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  );
}

export function GlossaryIcon({ size = 22, style, className }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      aria-hidden
      style={style}
      className={className}
      stroke="currentColor"
      {...baseProps}
    >
      {/* Stacked books — 3 layers leaning slightly. */}
      <rect x="3.5" y="14" width="15" height="4" rx="0.6" />
      <rect x="4.5" y="9.5" width="14" height="4" rx="0.6" />
      <rect x="5" y="5" width="13" height="4" rx="0.6" />
      {/* Spine label tab on the top book. */}
      <path d="M7.5 5.5 L7.5 8.5" />
      <path d="M9 5.5 L9 8.5" />
    </svg>
  );
}

export function HistoryIcon({ size = 22, style, className }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      aria-hidden
      style={style}
      className={className}
      stroke="currentColor"
      {...baseProps}
    >
      {/* Bent timeline — three milestone dots with a rewind arrow. */}
      <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="11" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <path d="M5 6 L11 6 L17 6" opacity="0.4" />
      {/* Rewind curve from 17 down and back to 5. */}
      <path d="M17 8 Q 17 14 11 14 L 7 14" />
      <path d="M9 12 L7 14 L9 16" />
    </svg>
  );
}

export function WaveformIcon({ size = 22, style, className }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      aria-hidden
      style={style}
      className={className}
      stroke="currentColor"
      {...baseProps}
    >
      {/* Digital square wave — 1 0 1 0 pattern with clean transitions. */}
      <path d="M2 14 L5 14 L5 7 L9 7 L9 14 L13 14 L13 7 L17 7 L17 14 L20 14" />
    </svg>
  );
}
