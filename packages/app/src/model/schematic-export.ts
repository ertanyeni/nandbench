/**
 * Schematic export — render the current circuit as a PNG or SVG file
 * without touching the live editor canvas. Both paths share the same
 * fit-to-box transform that LessonPreview uses.
 */

import type { CircuitDocument, VisualComponent } from './document.js';
import { compositeShape, getShape, type ComponentShape } from './kinds.js';
import type { SavedCircuit } from './library.js';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FitTransform {
  scale: number;
  tx: number;
  ty: number;
  width: number;
  height: number;
}

function shapeFor(
  comp: VisualComponent,
  library: readonly SavedCircuit[],
): ComponentShape {
  if (comp.kind.startsWith('composite:')) {
    const refId = String(comp.params['refId'] ?? '');
    const saved = library.find((sc) => sc.id === refId);
    if (saved) {
      return compositeShape({
        label: saved.name || 'COMPOSITE',
        inputs: saved.inputs.map((p) => ({ name: p.name, width: p.width })),
        outputs: saved.outputs.map((p) => ({ name: p.name, width: p.width })),
      });
    }
  }
  return getShape(comp.kind, comp.params);
}

function computeFit(doc: CircuitDocument, library: readonly SavedCircuit[], width: number, height: number, pad: number): { fit: FitTransform; shapes: { comp: VisualComponent; shape: ComponentShape }[]; bbox: Box } | null {
  if (doc.components.length === 0) return null;
  const shapes = doc.components.map((c) => ({ comp: c, shape: shapeFor(c, library) }));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { comp, shape } of shapes) {
    minX = Math.min(minX, comp.position.x);
    minY = Math.min(minY, comp.position.y);
    maxX = Math.max(maxX, comp.position.x + shape.bbox.w);
    maxY = Math.max(maxY, comp.position.y + shape.bbox.h);
  }
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const scale = Math.min(width / w, height / h);
  const tx = (width - w * scale) / 2 - (minX - pad) * scale;
  const ty = (height - h * scale) / 2 - (minY - pad) * scale;
  return {
    fit: { scale, tx, ty, width, height },
    shapes,
    bbox: { x: minX - pad, y: minY - pad, w, h },
  };
}

/* ------------------------------ PNG ------------------------------ */

export async function exportSchematicPNG(
  doc: CircuitDocument,
  library: readonly SavedCircuit[],
  options: { width?: number; height?: number; pad?: number } = {},
): Promise<Blob> {
  const width = options.width ?? 1200;
  const height = options.height ?? 800;
  const pad = options.pad ?? 30;
  const dpr = 2; // export at 2× so prints/screenshots stay crisp
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0c1018';
  ctx.fillRect(0, 0, width, height);

  const fitted = computeFit(doc, library, width, height, pad);
  if (!fitted) {
    ctx.fillStyle = '#7c8696';
    ctx.font = '18px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Empty circuit', width / 2, height / 2);
  } else {
    const { fit, shapes } = fitted;
    ctx.setTransform(dpr * fit.scale, 0, 0, dpr * fit.scale, dpr * fit.tx, dpr * fit.ty);
    // wires
    ctx.strokeStyle = '#7ea7d7';
    ctx.lineWidth = 2 / fit.scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const wire of doc.wires) {
      if (wire.path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(wire.path[0]!.x, wire.path[0]!.y);
      for (let i = 1; i < wire.path.length; i++) {
        ctx.lineTo(wire.path[i]!.x, wire.path[i]!.y);
      }
      ctx.stroke();
    }
    // components
    for (const { comp, shape } of shapes) {
      ctx.save();
      ctx.translate(comp.position.x, comp.position.y);
      shape.draw(ctx, { selected: false });
      ctx.fillStyle = '#cbd5e1';
      for (const pin of shape.pins) {
        ctx.beginPath();
        ctx.arc(pin.position.x, pin.position.y, 3 / fit.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

/* ------------------------------ SVG ------------------------------ */

/**
 * SVG export. Components are drawn through an offscreen Canvas2D
 * captured into a foreignObject — no, actually we re-derive a minimal
 * SVG primitive set from the bbox + pins. Less faithful than PNG but
 * scales infinitely, embeds in PDFs cleanly, and is the right format
 * for the Markdown report.
 *
 * For each component we draw:
 *   - the bbox rounded rectangle (component body)
 *   - the kind label centered
 *   - port dots + port labels
 * Wires are simple polylines.
 *
 * No simulation values are drawn — schematic-only.
 */
export function exportSchematicSVG(
  doc: CircuitDocument,
  library: readonly SavedCircuit[],
  options: { width?: number; height?: number; pad?: number } = {},
): string {
  const width = options.width ?? 1200;
  const height = options.height ?? 800;
  const pad = options.pad ?? 30;
  const fitted = computeFit(doc, library, width, height, pad);
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
  );
  parts.push(`<rect width="${width}" height="${height}" fill="#0c1018"/>`);
  if (!fitted) {
    parts.push(
      `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="18" fill="#7c8696">Empty circuit</text>`,
    );
    parts.push('</svg>');
    return parts.join('');
  }
  const { fit, shapes } = fitted;
  parts.push(`<g transform="translate(${fit.tx} ${fit.ty}) scale(${fit.scale})">`);
  // wires
  for (const wire of doc.wires) {
    if (wire.path.length < 2) continue;
    const pts = wire.path.map((p) => `${p.x},${p.y}`).join(' ');
    parts.push(
      `<polyline points="${pts}" fill="none" stroke="#7ea7d7" stroke-width="${(2 / fit.scale).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  }
  for (const { comp, shape } of shapes) {
    const x = comp.position.x;
    const y = comp.position.y;
    const w = shape.bbox.w;
    const h = shape.bbox.h;
    const label = labelFor(comp);
    parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="#1a2230" stroke="#2a3548" stroke-width="${(1.4 / fit.scale).toFixed(3)}"/>`,
    );
    parts.push(
      `<text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="${(12 / fit.scale).toFixed(3)}" fill="#dde4ef" font-weight="700">${escapeXml(label)}</text>`,
    );
    for (const pin of shape.pins) {
      parts.push(
        `<circle cx="${x + pin.position.x}" cy="${y + pin.position.y}" r="${(3 / fit.scale).toFixed(3)}" fill="#cbd5e1"/>`,
      );
    }
  }
  parts.push('</g></svg>');
  return parts.join('');
}

function labelFor(c: VisualComponent): string {
  if (c.kind.startsWith('composite:')) {
    const refId = String(c.params['refId'] ?? '');
    return `Comp ${refId.slice(0, 6)}`;
  }
  const name = c.params['name'];
  if (typeof name === 'string' && name) return name;
  return c.kind.toUpperCase();
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] ?? c,
  );
}
