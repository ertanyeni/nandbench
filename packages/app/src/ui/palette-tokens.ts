/**
 * Unified design tokens — every shell surface (activity bar, sidebar,
 * editor, status bar, header, modals) picks from the same 3-tier
 * hierarchy so the UI reads as a single coherent IDE rather than a
 * collection of floating panels.
 *
 * Hierarchy (dark → light):
 *   editorBg     — innermost work area (canvas)
 *   sidebarBg    — left/right docked panels (palette, inspector)
 *   chromeBg     — header / tab strip / status bar / activity bar
 *
 * Borders are a single value across all surfaces — multiple border
 * tones is what made the previous layout feel busy.
 */
export const SURFACE = {
  /* Three-tier surfaces */
  editorBg: '#0d0f14',
  sidebarBg: '#13161d',
  chromeBg: '#181c25',

  /* Legacy alias — old call sites */
  canvasBg: '#0d0f14',

  /* Strokes — one tone, consistent throughout */
  borderColor: '#252a36',
  borderStrong: '#2e3441',
  divider: '#1c2230',

  /* Backwards-compatible alias (Toolbar still reads chromeBorder) */
  chromeBorder: '1px solid #252a36',
  chromeBlur: 'blur(12px)',

  /* Section header (palette category, inspector section title) */
  headerBg: 'transparent',
  headerBorder: '#252a36',
  headerText: '#dde4ef',
  headerSubtext: '#7c8696',

  /* Items */
  itemBg: 'transparent',
  itemBgHover: '#1f2532',
  itemBgActive: '#243054',
  itemBorderActive: '#3b6ec3',
  itemText: '#eef1f6',
  itemSubText: '#9aa4b2',

  /* Accent */
  accent: '#60a5fa',
  accentStrong: '#4b78c4',
  suggestionGlow: '0 0 0 1px #60a5fa, 0 0 12px rgba(96,165,250,0.40)',
  itemAccentBar: '#60a5fa',
} as const;

/* Backwards-compatible alias so existing call sites keep working. */
export const PALETTE = {
  bg: SURFACE.sidebarBg,
  border: `1px solid ${SURFACE.borderColor}`,
  borderRadius: 0,
  blur: SURFACE.chromeBlur,
  categoryBg: SURFACE.headerBg,
  categoryDivider: SURFACE.headerBorder,
  categoryColor: SURFACE.headerSubtext,
  categoryFontSize: 11,
  categoryLetterSpacing: '0.8px',
  itemBgHover: SURFACE.itemBgHover,
  itemBgActive: SURFACE.itemBgActive,
  itemBorderActive: SURFACE.itemBorderActive,
  itemColor: '#eaf0fb',
  itemSubColor: '#a3b0c5',
  itemFontSize: 13,
  itemAccentBar: SURFACE.itemAccentBar,
  suggestionGlow: SURFACE.suggestionGlow,
  suggestionBorder: SURFACE.accent,
  hintColor: '#9aa6bd',
  hintFontSize: 11,
} as const;
