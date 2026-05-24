import type { ComponentDefinition, PortSpec } from '../types.js';

/**
 * Seven-segment display — 7 individual 1-bit inputs (segments a..g) plus
 * an optional decimal point (dp). Pure sink; the renderer reads the net
 * values to light up each segment.
 *
 * Logisim also offers a "hex digit" mode where a 4-bit input is decoded
 * to segments internally; that's a separate primitive ('hex-digit') we'll
 * add later as a thin wrapper around `decoder` + this display.
 */
export const sevenSegment: ComponentDefinition = {
  kind: '7seg',
  ports(): readonly PortSpec[] {
    return [
      { name: 'a', direction: 'in', width: 1 },
      { name: 'b', direction: 'in', width: 1 },
      { name: 'c', direction: 'in', width: 1 },
      { name: 'd', direction: 'in', width: 1 },
      { name: 'e', direction: 'in', width: 1 },
      { name: 'f', direction: 'in', width: 1 },
      { name: 'g', direction: 'in', width: 1 },
      { name: 'dp', direction: 'in', width: 1 },
    ];
  },
  evaluate(_ctx) {
    // No outputs; renderer draws segment state.
  },
};
