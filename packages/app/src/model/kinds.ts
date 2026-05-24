/**
 * Per-kind visual metadata: bounding box, pin layout, and a draw function.
 *
 * The engine knows what a gate *does* (`ComponentDefinition.ports`); this
 * file knows what it *looks like* (where pins sit, what shape the body is).
 * Keeping them separate is what lets the engine stay framework-agnostic
 * (CLAUDE.md golden rule #5).
 *
 * Coordinates are in world units (1 unit = 1 pixel at zoom = 1). The shape's
 * own origin is its top-left bounding-box corner.
 */

import type { ComponentParams, PortDirection } from '@gatecraft/engine';
import type { Point } from './document.js';

export const GRID = 20;
const BODY_W = 100; // gate body width in world units
const PIN_SPACING = 40; // vertical spacing between pins for n-ary gates

export interface PinLayout {
  readonly name: string;
  readonly position: Point; // relative to component top-left
  readonly direction: PortDirection;
  readonly side: 'left' | 'right' | 'top' | 'bottom';
}

export interface ComponentShape {
  readonly bbox: { readonly w: number; readonly h: number };
  readonly pins: readonly PinLayout[];
  /** Draw the body in the component's LOCAL coordinate space (top-left = origin). */
  draw(ctx: CanvasRenderingContext2D, opts: ShapeDrawOpts): void;
}

export interface ShapeDrawOpts {
  readonly selected: boolean;
}

function naryGateBox(inputs: number): { w: number; h: number; pinYs: number[] } {
  const h = Math.max(80, inputs * PIN_SPACING);
  const span = (inputs - 1) * PIN_SPACING;
  const startY = (h - span) / 2;
  const pinYs: number[] = [];
  for (let i = 0; i < inputs; i++) pinYs.push(startY + i * PIN_SPACING);
  return { w: BODY_W, h, pinYs };
}

function bodyStyle(ctx: CanvasRenderingContext2D, selected: boolean): void {
  ctx.fillStyle = '#1c2230';
  ctx.strokeStyle = selected ? '#60a5fa' : '#9aa4b2';
  ctx.lineWidth = selected ? 2.5 : 1.5;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  size = 13,
): void {
  ctx.fillStyle = '#e6e6e6';
  ctx.font = `600 ${size}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

/* ---------------------------- AND ------------------------------- */
function andShape(params: ComponentParams): ComponentShape {
  const inputs = Number(params['inputs'] ?? 2);
  const { w, h, pinYs } = naryGateBox(inputs);
  const pins: PinLayout[] = pinYs.map((y, i) => ({
    name: `in${i}`,
    position: { x: 0, y },
    direction: 'in' as const,
    side: 'left' as const,
  }));
  pins.push({ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' });
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      // D-shape: rect on left + semicircle on right
      ctx.beginPath();
      const r = h / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(w - r, 0);
      ctx.arc(w - r, h / 2, r, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'AND', w / 2 - 4, h / 2);
    },
  };
}

/* ---------------------------- OR -------------------------------- */
function orShape(params: ComponentParams): ComponentShape {
  const inputs = Number(params['inputs'] ?? 2);
  const { w, h, pinYs } = naryGateBox(inputs);
  const pins: PinLayout[] = pinYs.map((y, i) => ({
    name: `in${i}`,
    position: { x: 0, y },
    direction: 'in' as const,
    side: 'left' as const,
  }));
  pins.push({ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' });
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.beginPath();
      // Shield: curved left edge, two arcs meeting at right point
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(w * 0.3, 0, w * 0.55, h / 2);
      ctx.quadraticCurveTo(w * 0.3, h, 0, h);
      ctx.quadraticCurveTo(w * 0.2, h / 2, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Right pointed cap from (w*0.3, 0) → (w, h/2) → (w*0.3, h)
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 0);
      ctx.quadraticCurveTo(w * 0.85, 0, w, h / 2);
      ctx.quadraticCurveTo(w * 0.85, h, w * 0.3, h);
      ctx.stroke();
      drawLabel(ctx, 'OR', w / 2, h / 2);
    },
  };
}

/* ---------------------------- NOT ------------------------------- */
function notShape(): ComponentShape {
  const w = BODY_W;
  const h = 60;
  const bubbleR = 5;
  return {
    bbox: { w, h },
    pins: [
      { name: 'in', position: { x: 0, y: h / 2 }, direction: 'in', side: 'left' },
      { name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' },
    ],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      // Triangle pointing right + bubble
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w - bubbleR * 2, h / 2);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w - bubbleR, h / 2, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = '#1c2230';
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'NOT', w / 2 - 16, h / 2 - 1, 11);
    },
  };
}

/* ---------------------------- XOR ------------------------------- */
function xorShape(params: ComponentParams): ComponentShape {
  const inputs = Number(params['inputs'] ?? 2);
  const { w, h, pinYs } = naryGateBox(inputs);
  const pins: PinLayout[] = pinYs.map((y, i) => ({
    name: `in${i}`,
    position: { x: 0, y },
    direction: 'in' as const,
    side: 'left' as const,
  }));
  pins.push({ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' });
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      // OR-ish body
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(w * 0.3, 0, w * 0.55, h / 2);
      ctx.quadraticCurveTo(w * 0.3, h, 0, h);
      ctx.quadraticCurveTo(w * 0.2, h / 2, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 0);
      ctx.quadraticCurveTo(w * 0.85, 0, w, h / 2);
      ctx.quadraticCurveTo(w * 0.85, h, w * 0.3, h);
      ctx.stroke();
      // Extra XOR curve on the far left
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.quadraticCurveTo(w * 0.12, h / 2, -8, h);
      ctx.stroke();
      drawLabel(ctx, 'XOR', w / 2, h / 2);
    },
  };
}

/* ---------------------------- MUX ------------------------------- */
function muxShape(params: ComponentParams): ComponentShape {
  const inputs = Number(params['inputs'] ?? 2);
  const w = BODY_W;
  const h = Math.max(80, inputs * PIN_SPACING);
  const selWidth = Math.max(1, Math.ceil(Math.log2(Math.max(2, inputs))));
  void selWidth;
  const pins: PinLayout[] = [];
  // Data inputs evenly spaced top of trapezoid
  const span = (inputs - 1) * PIN_SPACING;
  const startY = (h - span) / 2;
  for (let i = 0; i < inputs; i++) {
    pins.push({
      name: `in${i}`,
      position: { x: 0, y: startY + i * PIN_SPACING },
      direction: 'in' as const,
      side: 'left' as const,
    });
  }
  // sel pin on bottom
  pins.push({ name: 'sel', position: { x: w / 2, y: h }, direction: 'in', side: 'bottom' });
  // out pin on right
  pins.push({ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' });
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      const inset = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, inset);
      ctx.lineTo(w, h - inset);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'MUX', w / 2, h / 2);
    },
  };
}

/* ---------------------------- Register -------------------------- */
function registerShape(params: ComponentParams): ComponentShape {
  const width = Number(params['width'] ?? 1);
  const w = BODY_W;
  const h = 80;
  return {
    bbox: { w, h },
    pins: [
      { name: 'd', position: { x: 0, y: 20 }, direction: 'in', side: 'left' },
      { name: 'en', position: { x: 0, y: 60 }, direction: 'in', side: 'left' },
      { name: 'q', position: { x: w, y: 40 }, direction: 'out', side: 'right' },
    ],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      drawLabel(ctx, 'REG', w / 2, h / 2 - 8, 14);
      drawLabel(ctx, `${width}b`, w / 2, h / 2 + 12, 10);
    },
  };
}

/* ---------------------------- Input pin ------------------------- */
function inputShape(): ComponentShape {
  const w = 60;
  const h = 30;
  return {
    bbox: { w, h },
    pins: [{ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' }],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w - 10, 0);
      ctx.lineTo(w, h / 2);
      ctx.lineTo(w - 10, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'IN', w / 2 - 3, h / 2, 11);
    },
  };
}

/* ---------------------------- Output pin ------------------------ */
function outputShape(): ComponentShape {
  const w = 60;
  const h = 30;
  return {
    bbox: { w, h },
    pins: [{ name: 'in', position: { x: 0, y: h / 2 }, direction: 'in', side: 'left' }],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(10, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(10, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'OUT', w / 2 + 4, h / 2, 11);
    },
  };
}

/* ---------------------------- NAND / NOR / XNOR ---------------- */

function nandShape(params: ComponentParams): ComponentShape {
  const base = andShape(params);
  return wrapInverted(base, 'NAND');
}
function norShape(params: ComponentParams): ComponentShape {
  const base = orShape(params);
  return wrapInverted(base, 'NOR');
}
function xnorShape(params: ComponentParams): ComponentShape {
  const base = xorShape(params);
  return wrapInverted(base, 'XNOR');
}

/**
 * Take any gate shape and append an output-bubble + relabel. The bubble
 * sits outside the original bbox; we extend `w` by 8 to accommodate it
 * AND shift the output pin to land on the bubble's far edge.
 */
function wrapInverted(base: ComponentShape, label: string): ComponentShape {
  const bubbleR = 5;
  const extraW = bubbleR * 2;
  const w = base.bbox.w + extraW;
  const h = base.bbox.h;
  const pins: PinLayout[] = base.pins.map((p) => {
    if (p.name === 'out') {
      return { ...p, position: { x: w, y: p.position.y } };
    }
    return p;
  });
  return {
    bbox: { w, h },
    pins,
    draw(ctx, opts) {
      // Draw the underlying gate body at its original origin.
      base.draw(ctx, opts);
      // Re-cover the label area to write the new label cleanly.
      ctx.fillStyle = '#1c2230';
      ctx.fillRect(base.bbox.w / 2 - 22, h / 2 - 8, 44, 16);
      ctx.strokeStyle = opts.selected ? '#60a5fa' : '#9aa4b2';
      ctx.lineWidth = opts.selected ? 2.5 : 1.5;
      drawLabel(ctx, label, base.bbox.w / 2 - 4, h / 2);
      // Bubble between base.bbox.w and w.
      const cx = base.bbox.w + bubbleR;
      const cy = h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = '#1c2230';
      ctx.fill();
      ctx.stroke();
    },
  };
}

/* ---------------------------- Buffer ---------------------------- */

function bufferShape(params: ComponentParams): ComponentShape {
  const width = Number(params['width'] ?? 1);
  void width;
  const w = BODY_W;
  const h = 60;
  return {
    bbox: { w, h },
    pins: [
      { name: 'in', position: { x: 0, y: h / 2 }, direction: 'in', side: 'left' },
      { name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' },
    ],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h / 2);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'BUF', w / 2 - 18, h / 2, 11);
    },
  };
}

/* ---------------------------- Constant -------------------------- */

function constantShape(params: ComponentParams): ComponentShape {
  const width = Number(params['width'] ?? 1);
  const w = 60;
  const h = 30;
  return {
    bbox: { w, h },
    pins: [{ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' }],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      const value = String(params['value'] ?? '0');
      drawLabel(ctx, value, w / 2, h / 2 - 4, 11);
      drawLabel(ctx, `${width}b`, w / 2, h / 2 + 8, 9);
    },
  };
}

/* ---------------------------- Clock ----------------------------- */

function clockShape(): ComponentShape {
  const w = 60;
  const h = 40;
  return {
    bbox: { w, h },
    pins: [{ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' }],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      // Square-wave glyph
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const m = 8;
      ctx.moveTo(m, h - m);
      ctx.lineTo(m, m);
      ctx.lineTo(w / 2, m);
      ctx.lineTo(w / 2, h - m);
      ctx.lineTo(w - m, h - m);
      ctx.lineTo(w - m, m);
      ctx.stroke();
    },
  };
}

/* ---------------------------- Adder / Subtractor / Comparator -- */

function boxedArithShape(label: string, ports: readonly { name: string; side: 'left' | 'right' | 'bottom'; y: number; width: number }[], width = 100, height = 80): ComponentShape {
  const pins: PinLayout[] = ports.map((p) => ({
    name: p.name,
    position: { x: p.side === 'left' ? 0 : p.side === 'right' ? width : width / 2, y: p.y },
    direction: (p.side === 'right' ? 'out' : 'in') as PinLayout['direction'],
    side: p.side,
  }));
  return {
    bbox: { w: width, h: height },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, width, height);
      ctx.strokeRect(0, 0, width, height);
      drawLabel(ctx, label, width / 2, height / 2, 14);
    },
  };
}

function adderShape(params: ComponentParams): ComponentShape {
  const w = 100;
  const h = 100;
  return boxedArithShape(
    'A+B',
    [
      { name: 'a', side: 'left', y: 20, width: Number(params['width'] ?? 1) },
      { name: 'b', side: 'left', y: 60, width: Number(params['width'] ?? 1) },
      { name: 'cin', side: 'bottom', y: h, width: 1 },
      { name: 's', side: 'right', y: 40, width: Number(params['width'] ?? 1) },
      { name: 'cout', side: 'right', y: 80, width: 1 },
    ],
    w,
    h,
  );
}

function subtractorShape(params: ComponentParams): ComponentShape {
  const w = 100;
  const h = 100;
  return boxedArithShape(
    'A−B',
    [
      { name: 'a', side: 'left', y: 20, width: Number(params['width'] ?? 1) },
      { name: 'b', side: 'left', y: 60, width: Number(params['width'] ?? 1) },
      { name: 'bin', side: 'bottom', y: h, width: 1 },
      { name: 'd', side: 'right', y: 40, width: Number(params['width'] ?? 1) },
      { name: 'bout', side: 'right', y: 80, width: 1 },
    ],
    w,
    h,
  );
}

function comparatorShape(params: ComponentParams): ComponentShape {
  void params;
  const w = 100;
  const h = 100;
  return boxedArithShape(
    'A?B',
    [
      { name: 'a', side: 'left', y: 25, width: 1 },
      { name: 'b', side: 'left', y: 75, width: 1 },
      { name: 'lt', side: 'right', y: 20, width: 1 },
      { name: 'eq', side: 'right', y: 50, width: 1 },
      { name: 'gt', side: 'right', y: 80, width: 1 },
    ],
    w,
    h,
  );
}

/* ---------------------------- Demux / Decoder ------------------- */

function demuxShape(params: ComponentParams): ComponentShape {
  const outputs = Number(params['outputs'] ?? 2);
  const w = BODY_W;
  const h = Math.max(80, outputs * PIN_SPACING);
  const span = (outputs - 1) * PIN_SPACING;
  const startY = (h - span) / 2;
  const pins: PinLayout[] = [
    { name: 'in', position: { x: 0, y: h / 2 }, direction: 'in', side: 'left' },
    { name: 'sel', position: { x: w / 2, y: h }, direction: 'in', side: 'bottom' },
  ];
  for (let i = 0; i < outputs; i++) {
    pins.push({
      name: `out${i}`,
      position: { x: w, y: startY + i * PIN_SPACING },
      direction: 'out',
      side: 'right',
    });
  }
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      const inset = 10;
      // Reversed trapezoid (narrow on left, wide on right).
      ctx.beginPath();
      ctx.moveTo(0, inset);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h - inset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'DEMUX', w / 2, h / 2, 11);
    },
  };
}

function decoderShape(params: ComponentParams): ComponentShape {
  const inputs = Number(params['inputs'] ?? 2);
  const outputs = 1 << inputs;
  const w = BODY_W;
  const h = Math.max(80, outputs * PIN_SPACING);
  const span = (outputs - 1) * PIN_SPACING;
  const startY = (h - span) / 2;
  const pins: PinLayout[] = [
    { name: 'sel', position: { x: 0, y: h / 2 }, direction: 'in', side: 'left' },
  ];
  for (let i = 0; i < outputs; i++) {
    pins.push({
      name: `out${i}`,
      position: { x: w, y: startY + i * PIN_SPACING },
      direction: 'out',
      side: 'right',
    });
  }
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      drawLabel(ctx, 'DEC', w / 2, h / 2, 12);
    },
  };
}

/* ---------------------------- Counter / Shift Register --------- */

function counterShape(params: ComponentParams): ComponentShape {
  const width = Number(params['width'] ?? 4);
  const w = BODY_W;
  const h = 80;
  return {
    bbox: { w, h },
    pins: [
      { name: 'en', position: { x: 0, y: 20 }, direction: 'in', side: 'left' },
      { name: 'rst', position: { x: 0, y: 60 }, direction: 'in', side: 'left' },
      { name: 'q', position: { x: w, y: 30 }, direction: 'out', side: 'right' },
      { name: 'co', position: { x: w, y: 60 }, direction: 'out', side: 'right' },
    ],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      drawLabel(ctx, 'CNT', w / 2, h / 2 - 8, 13);
      drawLabel(ctx, `${width}b`, w / 2, h / 2 + 12, 10);
    },
  };
}

function shiftRegisterShape(params: ComponentParams): ComponentShape {
  const width = Number(params['width'] ?? 4);
  const w = BODY_W;
  const h = 60;
  return {
    bbox: { w, h },
    pins: [
      { name: 'd', position: { x: 0, y: 20 }, direction: 'in', side: 'left' },
      { name: 'en', position: { x: 0, y: 40 }, direction: 'in', side: 'left' },
      { name: 'q', position: { x: w, y: 30 }, direction: 'out', side: 'right' },
    ],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      drawLabel(ctx, 'SHIFT', w / 2, h / 2 - 6, 11);
      drawLabel(ctx, `${width}b`, w / 2, h / 2 + 8, 9);
    },
  };
}

/* ---------------------------- Splitter / Tunnel ---------------- */

function splitterShape(params: ComponentParams): ComponentShape {
  const width = Number(params['width'] ?? 8);
  const fanout = Number(params['fanout'] ?? width);
  const w = 60;
  const h = Math.max(60, fanout * 20);
  const span = (fanout - 1) * 20;
  const startY = (h - span) / 2;
  const pins: PinLayout[] = [
    { name: 'in', position: { x: 0, y: h / 2 }, direction: 'in', side: 'left' },
  ];
  for (let i = 0; i < fanout; i++) {
    pins.push({
      name: `out${i}`,
      position: { x: w, y: startY + i * 20 },
      direction: 'out',
      side: 'right',
    });
  }
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      // Trunk + ribs
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2, startY - 4);
      ctx.lineTo(w / 2, startY + span + 4);
      ctx.stroke();
      for (let i = 0; i < fanout; i++) {
        const y = startY + i * 20;
        ctx.beginPath();
        ctx.moveTo(w / 2, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  };
}

function tunnelShape(params: ComponentParams): ComponentShape {
  const label = String(params['label'] ?? '');
  const w = 70;
  const h = 28;
  return {
    bbox: { w, h },
    pins: [{ name: 'port', position: { x: 0, y: h / 2 }, direction: 'inout', side: 'left' }],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(12, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(12, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, label || '·', (w + 12) / 2, h / 2, 11);
    },
  };
}

/* ---------------------------- LED / Button / 7-Seg ------------- */

function ledShape(): ComponentShape {
  const w = 30;
  const h = 30;
  return {
    bbox: { w, h },
    pins: [{ name: 'in', position: { x: 0, y: h / 2 }, direction: 'in', side: 'left' }],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.beginPath();
      ctx.arc(w / 2 + 4, h / 2, h / 2 - 3, 0, Math.PI * 2);
      // Filled by render-time signal in Faz 3+; for now show off color.
      ctx.fillStyle = '#3a4150';
      ctx.fill();
      ctx.strokeStyle = selected ? '#60a5fa' : '#9aa4b2';
      ctx.stroke();
    },
  };
}

function buttonShape(): ComponentShape {
  const w = 50;
  const h = 30;
  return {
    bbox: { w, h },
    pins: [{ name: 'out', position: { x: w, y: h / 2 }, direction: 'out', side: 'right' }],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillStyle = '#1c2230';
      // Rounded rect button
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, 'BTN', w / 2 - 4, h / 2, 11);
    },
  };
}

function sevenSegmentShape(): ComponentShape {
  const w = 60;
  const h = 90;
  const segments: { name: string; y: number }[] = [
    { name: 'a', y: 14 },
    { name: 'b', y: 24 },
    { name: 'c', y: 34 },
    { name: 'd', y: 44 },
    { name: 'e', y: 54 },
    { name: 'f', y: 64 },
    { name: 'g', y: 74 },
    { name: 'dp', y: 84 },
  ];
  const pins: PinLayout[] = segments.map((s) => ({
    name: s.name,
    position: { x: 0, y: s.y },
    direction: 'in',
    side: 'left',
  }));
  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      // Drawn-off "8" — Faz 3 will light actual segments based on snapshot.
      drawLabel(ctx, '8.', w / 2, h / 2, 30);
    },
  };
}

/* ---------------------------- Composite ------------------------- */

/**
 * Build a generic composite shape. The interface (input/output pin count
 * and widths) is passed in by the renderer at draw time — the renderer
 * looks up the SavedCircuit from the library via params.refId. If the
 * library isn't available here (this module is library-unaware), the
 * shape falls back to a small placeholder; the renderer must call
 * `setCompositeInterface` to provide details.
 */
export interface CompositeInterface {
  readonly label: string;
  readonly inputs: readonly { name: string; width: number }[];
  readonly outputs: readonly { name: string; width: number }[];
}

export function compositeShape(iface: CompositeInterface): ComponentShape {
  const pinSpacing = 32;
  const portCount = Math.max(iface.inputs.length, iface.outputs.length);
  const h = Math.max(60, (portCount + 1) * pinSpacing);
  const labelWidth = Math.max(80, iface.label.length * 8);
  const w = labelWidth + 40;
  const pins: PinLayout[] = [];
  const layoutCol = (
    list: readonly { name: string; width: number }[],
    x: number,
    dir: 'in' | 'out',
    side: 'left' | 'right',
  ): void => {
    const span = (list.length - 1) * pinSpacing;
    const startY = (h - span) / 2;
    list.forEach((p, i) => {
      pins.push({
        name: p.name,
        position: { x, y: startY + i * pinSpacing },
        direction: dir,
        side,
      });
    });
  };
  layoutCol(iface.inputs, 0, 'in', 'left');
  layoutCol(iface.outputs, w, 'out', 'right');

  return {
    bbox: { w, h },
    pins,
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      drawLabel(ctx, iface.label, w / 2, h / 2, 13);
      // Pin name labels (small, just inside the box).
      ctx.fillStyle = '#7c8696';
      ctx.font = `9px ui-sans-serif, system-ui`;
      ctx.textBaseline = 'middle';
      for (const p of pins) {
        if (p.side === 'left') {
          ctx.textAlign = 'left';
          ctx.fillText(p.name, 6, p.position.y);
        } else if (p.side === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(p.name, w - 6, p.position.y);
        }
      }
    },
  };
}

/* ---------------------------- Logisim-parity primitives ---------- */

/** Tiny one-pin source/sink: power, ground, probe. */
function tinyPinShape(label: string, dir: 'in' | 'out', accent: string): ComponentShape {
  const w = 60;
  const h = 30;
  const pin: PinLayout = {
    name: dir === 'in' ? 'in' : 'out',
    position: { x: dir === 'in' ? 0 : w, y: h / 2 },
    direction: dir,
    side: dir === 'in' ? 'left' : 'right',
  };
  return {
    bbox: { w, h },
    pins: [pin],
    draw(ctx, { selected }) {
      bodyStyle(ctx, selected);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeRect(0, 0, w, h);
      const prev = ctx.fillStyle;
      ctx.fillStyle = accent;
      ctx.fillRect(dir === 'out' ? 0 : w - 4, 0, 4, h);
      ctx.fillStyle = prev;
      drawLabel(ctx, label, w / 2, h / 2, 11);
    },
  };
}

function powerShape(): ComponentShape {
  return tinyPinShape('PWR', 'out', '#22c55e');
}
function pullResistorShape(): ComponentShape {
  return tinyPinShape('PULL', 'out', '#a78bfa');
}
function porShape(): ComponentShape {
  return tinyPinShape('POR', 'out', '#f59e0b');
}
function groundShape(): ComponentShape {
  return tinyPinShape('GND', 'out', '#475569');
}
function probeShape(): ComponentShape {
  return tinyPinShape('PROBE', 'in', '#60a5fa');
}

/** Two-pin pass-through with custom label (Bit Extender, Negator, Absolute…). */
function passLabeledShape(label: string): ComponentShape {
  return compositeShape({
    label,
    inputs: [{ name: 'in', width: 1 }],
    outputs: [{ name: 'out', width: 1 }],
  });
}

/** N-input parity gate — reuses the composite label box. */
function naryShape(label: string, params: ComponentParams): ComponentShape {
  const inputs = Math.max(2, Number(params['inputs'] ?? 2));
  return compositeShape({
    label,
    inputs: Array.from({ length: inputs }, (_, i) => ({ name: `in${i}`, width: 1 })),
    outputs: [{ name: 'out', width: 1 }],
  });
}

/** Tri-state controlled buffer/inverter: in, en (bottom), out. */
function controlledShape(label: string): ComponentShape {
  return compositeShape({
    label,
    inputs: [
      { name: 'in', width: 1 },
      { name: 'en', width: 1 },
    ],
    outputs: [{ name: 'out', width: 1 }],
  });
}

function priorityEncoderShape(params: ComponentParams): ComponentShape {
  const select = Math.max(1, Number(params['select'] ?? 2));
  const fanout = 1 << select;
  return compositeShape({
    label: 'PRI',
    inputs: Array.from({ length: fanout }, (_, i) => ({ name: `in${i}`, width: 1 })),
    outputs: [
      { name: 'out', width: select },
      { name: 'valid', width: 1 },
    ],
  });
}

function bitSelectorShape(): ComponentShape {
  return compositeShape({
    label: 'BSEL',
    inputs: [
      { name: 'in', width: 1 },
      { name: 'sel', width: 1 },
    ],
    outputs: [{ name: 'out', width: 1 }],
  });
}

function multiplierShape(): ComponentShape {
  return compositeShape({
    label: '×',
    inputs: [
      { name: 'a', width: 1 },
      { name: 'b', width: 1 },
    ],
    outputs: [
      { name: 'lo', width: 1 },
      { name: 'hi', width: 1 },
    ],
  });
}

function dividerShape(): ComponentShape {
  return compositeShape({
    label: '÷',
    inputs: [
      { name: 'a', width: 1 },
      { name: 'b', width: 1 },
    ],
    outputs: [
      { name: 'q', width: 1 },
      { name: 'r', width: 1 },
    ],
  });
}

function minMaxShape(): ComponentShape {
  return compositeShape({
    label: 'MIN/MAX',
    inputs: [
      { name: 'a', width: 1 },
      { name: 'b', width: 1 },
    ],
    outputs: [
      { name: 'min', width: 1 },
      { name: 'max', width: 1 },
    ],
  });
}

function shifterShape(): ComponentShape {
  return compositeShape({
    label: 'SHIFT',
    inputs: [
      { name: 'in', width: 1 },
      { name: 'shamt', width: 1 },
    ],
    outputs: [{ name: 'out', width: 1 }],
  });
}

function bitAdderShape(): ComponentShape {
  return compositeShape({
    label: 'POPCNT',
    inputs: [{ name: 'in', width: 1 }],
    outputs: [{ name: 'out', width: 1 }],
  });
}

function bitFinderShape(): ComponentShape {
  return compositeShape({
    label: 'BFIND',
    inputs: [{ name: 'in', width: 1 }],
    outputs: [
      { name: 'idx', width: 1 },
      { name: 'found', width: 1 },
    ],
  });
}

/* ---------------------------- Registry -------------------------- */

const builders: Record<string, (params: ComponentParams) => ComponentShape> = {
  // Gates
  and: andShape,
  or: orShape,
  not: () => notShape(),
  xor: xorShape,
  nand: nandShape,
  nor: norShape,
  xnor: xnorShape,
  buffer: bufferShape,
  'odd-parity': (p) => naryShape('2k+1', p),
  'even-parity': (p) => naryShape('2k', p),
  'controlled-buffer': () => controlledShape('CB'),
  'controlled-inverter': () => controlledShape('CI'),
  // Plexers
  mux: muxShape,
  demux: demuxShape,
  decoder: decoderShape,
  'priority-encoder': priorityEncoderShape,
  'bit-selector': () => bitSelectorShape(),
  // Arithmetic
  adder: adderShape,
  subtractor: subtractorShape,
  comparator: comparatorShape,
  multiplier: () => multiplierShape(),
  divider: () => dividerShape(),
  negator: () => passLabeledShape('NEG'),
  absolute: () => passLabeledShape('ABS'),
  'min-max': () => minMaxShape(),
  shifter: () => shifterShape(),
  'bit-adder': () => bitAdderShape(),
  'bit-finder': () => bitFinderShape(),
  exponentiator: () =>
    compositeShape({
      label: 'EXP',
      inputs: [
        { name: 'a', width: 1 },
        { name: 'b', width: 1 },
      ],
      outputs: [{ name: 'out', width: 1 }],
    }),
  'square-root': () => passLabeledShape('√'),
  ram: () =>
    compositeShape({
      label: 'RAM',
      inputs: [
        { name: 'addr', width: 1 },
        { name: 'data', width: 1 },
        { name: 'we', width: 1 },
        { name: 'oe', width: 1 },
      ],
      outputs: [{ name: 'out', width: 1 }],
    }),
  rom: () =>
    compositeShape({
      label: 'ROM',
      inputs: [
        { name: 'addr', width: 1 },
        { name: 'oe', width: 1 },
      ],
      outputs: [{ name: 'out', width: 1 }],
    }),
  'd-flipflop': () =>
    compositeShape({
      label: 'D-FF',
      inputs: [{ name: 'd', width: 1 }],
      outputs: [
        { name: 'q', width: 1 },
        { name: 'qn', width: 1 },
      ],
    }),
  't-flipflop': () =>
    compositeShape({
      label: 'T-FF',
      inputs: [{ name: 't', width: 1 }],
      outputs: [
        { name: 'q', width: 1 },
        { name: 'qn', width: 1 },
      ],
    }),
  'jk-flipflop': () =>
    compositeShape({
      label: 'JK-FF',
      inputs: [
        { name: 'j', width: 1 },
        { name: 'k', width: 1 },
      ],
      outputs: [
        { name: 'q', width: 1 },
        { name: 'qn', width: 1 },
      ],
    }),
  'sr-flipflop': () =>
    compositeShape({
      label: 'SR-FF',
      inputs: [
        { name: 's', width: 1 },
        { name: 'r', width: 1 },
      ],
      outputs: [
        { name: 'q', width: 1 },
        { name: 'qn', width: 1 },
      ],
    }),
  // Memory
  register: registerShape,
  counter: counterShape,
  'shift-register': shiftRegisterShape,
  // Wiring
  input: () => inputShape(),
  output: () => outputShape(),
  constant: constantShape,
  clock: () => clockShape(),
  splitter: splitterShape,
  tunnel: tunnelShape,
  power: () => powerShape(),
  ground: () => groundShape(),
  probe: () => probeShape(),
  'bit-extender': () => passLabeledShape('EXT'),
  'pull-resistor': () => pullResistorShape(),
  por: () => porShape(),
  // I/O peripherals
  led: () => ledShape(),
  button: () => buttonShape(),
  '7seg': () => sevenSegmentShape(),
};

export function getShape(kind: string, params: ComponentParams): ComponentShape {
  const fn = builders[kind];
  if (!fn) throw new Error(`No visual shape registered for kind "${kind}"`);
  return fn(params);
}

/** World-space bounding box of a placed component. */
export function componentWorldBox(
  position: Point,
  shape: ComponentShape,
): { x: number; y: number; w: number; h: number } {
  return { x: position.x, y: position.y, w: shape.bbox.w, h: shape.bbox.h };
}

/** Absolute world position of a named pin on a placed component. */
export function pinWorldPosition(
  position: Point,
  shape: ComponentShape,
  pinName: string,
): Point {
  const pin = shape.pins.find((p) => p.name === pinName);
  if (!pin) throw new Error(`No pin "${pinName}" on shape`);
  return { x: position.x + pin.position.x, y: position.y + pin.position.y };
}

/* ------------------------------ Rotation ---------------------------------- */

/**
 * Return a rotated wrapper around a base shape: bbox swaps w/h on 90/270,
 * pin positions and sides are transformed, and the draw function applies
 * the matching canvas transform so the body renders inside the new bbox.
 *
 * Rotations are clockwise (canvas convention with y-down).
 */
export function rotateShape(
  shape: ComponentShape,
  rotation: 0 | 90 | 180 | 270,
): ComponentShape {
  if (rotation === 0) return shape;
  const { w, h } = shape.bbox;
  const newBbox = rotation === 180 ? { w, h } : { w: h, h: w };
  const newPins: PinLayout[] = shape.pins.map((pin) => ({
    name: pin.name,
    direction: pin.direction,
    side: rotateSide(pin.side, rotation),
    position: rotatePoint(pin.position, w, h, rotation),
  }));
  return {
    bbox: newBbox,
    pins: newPins,
    draw(ctx, opts) {
      ctx.save();
      switch (rotation) {
        case 90:
          ctx.translate(h, 0);
          break;
        case 180:
          ctx.translate(w, h);
          break;
        case 270:
          ctx.translate(0, w);
          break;
      }
      ctx.rotate((rotation * Math.PI) / 180);
      shape.draw(ctx, opts);
      ctx.restore();
    },
  };
}

function rotatePoint(p: Point, w: number, h: number, r: 90 | 180 | 270): Point {
  switch (r) {
    case 90:
      return { x: h - p.y, y: p.x };
    case 180:
      return { x: w - p.x, y: h - p.y };
    case 270:
      return { x: p.y, y: w - p.x };
  }
}

function rotateSide(
  side: PinLayout['side'],
  r: 90 | 180 | 270,
): PinLayout['side'] {
  const order: PinLayout['side'][] = ['left', 'top', 'right', 'bottom'];
  const i = order.indexOf(side);
  if (i === -1) return side;
  const steps = (r / 90) % 4;
  return order[(i + steps) % 4]!;
}
