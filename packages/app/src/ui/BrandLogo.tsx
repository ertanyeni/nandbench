import type { CSSProperties } from 'react';

/**
 * nandbench brand mark — "nand" wordmark inside a split blue/white frame.
 *
 * Two raster variants ship in /public:
 *   - logo-mark.png        — white "nand" + blue/white frame (for DARK bg)
 *   - logo-mark-light.png  — black "nand" + blue/black frame (for LIGHT bg)
 *
 * Pick the right variant via `tone`. Default is "dark" since the editor
 * shell is dark-themed; switch to "light" on white surfaces (landing pages,
 * exported screenshots, social media cards).
 */
interface BrandLogoProps {
  readonly size?: number;
  readonly tone?: 'dark' | 'light';
  readonly style?: CSSProperties;
}

export function BrandLogo({ size = 22, tone = 'dark', style }: BrandLogoProps): JSX.Element {
  const src = tone === 'light' ? '/logo-mark-light.png' : '/logo-mark.png';
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ display: 'inline-block', objectFit: 'contain', ...style }}
    />
  );
}

interface BrandMarkProps {
  readonly logoSize?: number;
  readonly fontSize?: number;
  readonly gap?: number;
  readonly wordColor?: string;
  readonly accentColor?: string;
  readonly style?: CSSProperties;
}

/**
 * Full brand lockup: gradient 'n' mark + "nandbench" wordmark. "nand" is
 * tinted with the accent so the product hook reads at a glance; "bench"
 * stays in the body tone.
 */
export function BrandMark({
  logoSize = 22,
  fontSize = 15,
  gap = 8,
  wordColor = '#eef1f6',
  accentColor = '#60a5fa',
  style,
}: BrandMarkProps): JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        userSelect: 'none',
        ...style,
      }}
      aria-label="nandbench"
    >
      <BrandLogo size={logoSize} />
      <span
        style={{
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, sans-serif',
          lineHeight: 1,
          color: wordColor,
        }}
      >
        <span style={{ color: accentColor }}>nand</span>
        <span>bench</span>
      </span>
    </span>
  );
}
