import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import type { CircuitDocument } from '../model/document.js';
import { compositeShape, getShape, type ComponentShape } from '../model/kinds.js';
import { useAppStore } from '../model/store.js';

/**
 * Tiny static preview of a CircuitDocument — used inside the Lessons modal
 * so the user sees the template before clicking "Open". Computes a fit-to-box
 * transform from all components, then draws shapes + wires verbatim.
 *
 * Stateless: no interaction, no simulation, no quadtree. Pure visual sketch.
 */
export function LessonPreview({
  doc,
  width = 260,
  height = 120,
  onClick,
}: {
  doc: CircuitDocument;
  width?: number;
  height?: number;
  /** When provided, the preview becomes a button with a hover overlay. */
  onClick?: () => void;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const library = useAppStore((s) => s.library);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(0, 0, width, height);

    if (doc.components.length === 0) {
      ctx.fillStyle = '#7c8696';
      ctx.font = `12px ui-sans-serif, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('—', width / 2, height / 2);
      return;
    }

    // Resolve shapes + bbox so we can fit.
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
    // Pad slightly.
    const pad = 20;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const scale = Math.min(width / w, height / h);
    const tx = (width - w * scale) / 2 - (minX - pad) * scale;
    const ty = (height - h * scale) / 2 - (minY - pad) * scale;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tx, dpr * ty);

    // Wires first (so component bodies sit on top).
    ctx.strokeStyle = '#5b6573';
    ctx.lineWidth = 1.5 / scale;
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
    // Components.
    for (const { comp, shape } of shapes) {
      ctx.save();
      ctx.translate(comp.position.x, comp.position.y);
      shape.draw(ctx, { selected: false });
      ctx.fillStyle = '#cbd5e1';
      for (const pin of shape.pins) {
        ctx.beginPath();
        ctx.arc(pin.position.x, pin.position.y, 2.4 / scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }, [doc, library, width, height]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width,
        height,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width,
          height,
          display: 'block',
          background: '#0c1018',
          border: '1px solid #1f2632',
          borderRadius: 8,
        }}
      />
      {onClick && hover ? (
        <div
          className="gc-fade-in"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(31, 58, 102, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#eef1f6',
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
            border: '1px solid #3b6ec3',
          }}
        >
          ▶ {t('lessons.openTemplate')}
        </div>
      ) : null}
    </div>
  );
}

function shapeFor(
  comp: import('../model/document.js').VisualComponent,
  library: ReturnType<typeof useAppStore.getState>['library'],
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
