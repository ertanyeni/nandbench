/**
 * Static SVG infographic for each lesson. The mapping `LESSON_FIGURES`
 * routes a lesson id to one of the parameterised primitives below — so
 * we get 47 dedicated visuals out of ~20 reusable templates rather than
 * 47 hand-drawn files. Pure presentation: no interaction, no sim.
 *
 * Conventions:
 *   - 480 × 220 viewBox throughout, so figures slot into the lesson
 *     reader without per-figure size logic.
 *   - Colours mirror the editor: gate body `#1a2230`, signal `#7ea7d7`,
 *     active highlight `#facc15`, ground rail `#5b6573`.
 *   - All text is via i18n keys; no English strings inline.
 */

import { t } from '../i18n/index.js';

const W = 480;
const H = 220;
const COLOR = {
  body: '#1a2230',
  bodyStroke: '#2a3548',
  wire: '#7ea7d7',
  wireDim: '#3a4a63',
  text: '#dde4ef',
  textDim: '#9aa4b2',
  accent: '#facc15',
  hi: '#86efac',
  lo: '#fda4a4',
  rail: '#5b6573',
};

export function LessonFigure({ lessonId }: { lessonId: string }): JSX.Element | null {
  const fig = LESSON_FIGURES[lessonId];
  if (!fig) return null;
  return (
    <div
      style={{
        margin: '18px 0 4px',
        padding: '14px',
        background: '#0c1018',
        border: '1px solid #1f2632',
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'center',
      }}
      role="img"
      aria-label={t(`lesson.${lessonId}.title`)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: 560, height: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {fig()}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                     SVG primitive builders                          */
/* ------------------------------------------------------------------ */

function box(x: number, y: number, w: number, h: number, label: string, accent = false): JSX.Element {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={COLOR.body}
        stroke={accent ? COLOR.accent : COLOR.bodyStroke}
        strokeWidth={accent ? 2 : 1}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={COLOR.text}
        fontFamily="ui-sans-serif, system-ui"
      >
        {label}
      </text>
    </g>
  );
}

function wire(x1: number, y1: number, x2: number, y2: number, opts: { color?: string; arrow?: boolean; dashed?: boolean } = {}): JSX.Element {
  const c = opts.color ?? COLOR.wire;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={opts.dashed ? '4 4' : undefined}
      />
      {opts.arrow ? (
        <polygon
          points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
          fill={c}
        />
      ) : null}
    </g>
  );
}

function pinLabel(x: number, y: number, label: string, anchor: 'start' | 'end' | 'middle' = 'middle'): JSX.Element {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={11}
      fontWeight={600}
      fill={COLOR.textDim}
      fontFamily="ui-monospace, monospace"
    >
      {label}
    </text>
  );
}

function caption(y: number, key: string): JSX.Element {
  return (
    <text
      x={W / 2}
      y={y}
      textAnchor="middle"
      fontSize={12}
      fontStyle="italic"
      fill={COLOR.textDim}
      fontFamily="ui-sans-serif, system-ui"
    >
      {t(key)}
    </text>
  );
}

/* Gate body — IEEE-ish symbol. `kind` picks the shape. */
function gateShape(cx: number, cy: number, kind: GateKind, inverted = false): JSX.Element {
  const w = 48;
  const h = 40;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const bubbleR = 5;
  let path = '';
  if (kind === 'and' || kind === 'nand') {
    // D-shape
    path = `M${x} ${y} L${x + w * 0.55} ${y} A${h / 2} ${h / 2} 0 0 1 ${x + w * 0.55} ${y + h} L${x} ${y + h} Z`;
  } else if (kind === 'or' || kind === 'nor' || kind === 'xor' || kind === 'xnor') {
    // Curved back, pointed nose
    path = `M${x} ${y} Q${x + 14} ${cy} ${x} ${y + h} Q${x + 28} ${y + h} ${x + w} ${cy} Q${x + 28} ${y} ${x} ${y} Z`;
  } else if (kind === 'not' || kind === 'buffer') {
    // Triangle
    path = `M${x} ${y} L${x + w - 8} ${cy} L${x} ${y + h} Z`;
  }
  return (
    <g>
      <path d={path} fill={COLOR.body} stroke={COLOR.bodyStroke} strokeWidth={1.4} />
      {/* second curve for XOR family */}
      {(kind === 'xor' || kind === 'xnor') ? (
        <path d={`M${x - 6} ${y} Q${x + 8} ${cy} ${x - 6} ${y + h}`} fill="none" stroke={COLOR.bodyStroke} strokeWidth={1.4} />
      ) : null}
      {inverted ? (
        <circle cx={cx + w / 2 + bubbleR} cy={cy} r={bubbleR} fill={COLOR.body} stroke={COLOR.bodyStroke} strokeWidth={1.4} />
      ) : null}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={COLOR.text} fontFamily="ui-sans-serif, system-ui">
        {gateLabel(kind)}
      </text>
    </g>
  );
}

type GateKind = 'and' | 'or' | 'xor' | 'not' | 'nand' | 'nor' | 'xnor' | 'buffer';
function gateLabel(k: GateKind): string {
  return ({ and: 'AND', or: 'OR', xor: 'XOR', not: '¬', nand: 'NAND', nor: 'NOR', xnor: 'XNOR', buffer: '1' } as const)[k];
}

/* ------------------------------------------------------------------ */
/*                     Figure templates                                */
/* ------------------------------------------------------------------ */

/** Two inputs → gate → one output. */
function gateFigure(kind: GateKind, captionKey: string, inverted = false): () => JSX.Element {
  return () => (
    <>
      {pinLabel(50, 70, 'a', 'end')}
      {pinLabel(50, 156, 'b', 'end')}
      {wire(60, 70, 200, 70)}
      {wire(60, 156, 200, 156)}
      {wire(200, 70, 230, 100)}
      {wire(200, 156, 230, 124)}
      {gateShape(255, 112, kind, inverted)}
      {wire(290, 112, 420, 112, { arrow: true })}
      {pinLabel(430, 116, 'y', 'start')}
      {caption(200, captionKey)}
    </>
  );
}

/** Half adder. */
function halfAdderFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(20, 70, 'a', 'end')}
      {pinLabel(20, 150, 'b', 'end')}
      {wire(28, 70, 140, 70)}
      {wire(28, 150, 140, 150)}
      {wire(140, 70, 160, 90)}
      {wire(140, 150, 160, 110)}
      {gateShape(190, 100, 'xor')}
      {wire(225, 100, 360, 100, { arrow: true })}
      {pinLabel(370, 104, 'sum', 'start')}
      {wire(140, 70, 200, 70, { color: COLOR.wireDim })}
      {wire(140, 150, 200, 150, { color: COLOR.wireDim })}
      {wire(200, 70, 220, 165)}
      {wire(200, 150, 220, 185)}
      {gateShape(250, 175, 'and')}
      {wire(285, 175, 360, 175, { arrow: true })}
      {pinLabel(370, 179, 'carry', 'start')}
      {caption(40, 'fig.halfAdder.cap')}
    </>
  );
}

/** Full adder = 2 half adders + OR. */
function fullAdderFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(20, 60, 'a', 'end')}
      {pinLabel(20, 100, 'b', 'end')}
      {pinLabel(20, 180, 'cin', 'end')}
      {box(60, 50, 90, 60, 'HA1')}
      {box(180, 90, 90, 60, 'HA2')}
      {wire(28, 60, 60, 60)}
      {wire(28, 100, 60, 100)}
      {wire(28, 180, 250, 180)}
      {wire(150, 80, 180, 120)}
      {wire(150, 90, 180, 100)}
      {wire(270, 100, 350, 100, { arrow: true })}
      {pinLabel(360, 104, 'sum', 'start')}
      {/* carry OR */}
      {wire(150, 100, 170, 100, { color: COLOR.wireDim })}
      {wire(270, 130, 310, 50)}
      {wire(250, 180, 290, 70)}
      {gateShape(345, 60, 'or')}
      {wire(378, 60, 420, 60, { arrow: true })}
      {pinLabel(430, 64, 'cout', 'start')}
      {caption(30, 'fig.fullAdder.cap')}
    </>
  );
}

/** N stages chained — generic ripple. */
function rippleFigure(n: number, captionKey: string, label = 'FA'): () => JSX.Element {
  return () => {
    const stages: JSX.Element[] = [];
    const startX = 30;
    const stageW = 70;
    const gap = 18;
    const y = 90;
    for (let i = 0; i < n; i++) {
      const x = startX + i * (stageW + gap);
      stages.push(box(x, y, stageW, 60, `${label}${n - 1 - i}`));
      // carry chain
      if (i > 0) {
        stages.push(wire(x - gap, y + 30, x, y + 30, { arrow: true, color: COLOR.accent }));
      }
      // ai/bi inputs
      stages.push(pinLabel(x + 18, y - 6, 'a'));
      stages.push(pinLabel(x + stageW - 18, y - 6, 'b'));
      stages.push(wire(x + 18, y - 14, x + 18, y - 2, { color: COLOR.wireDim }));
      stages.push(wire(x + stageW - 18, y - 14, x + stageW - 18, y - 2, { color: COLOR.wireDim }));
      // sum
      stages.push(wire(x + stageW / 2, y + 60, x + stageW / 2, y + 80, { arrow: true }));
      stages.push(pinLabel(x + stageW / 2, y + 96, `s${n - 1 - i}`));
    }
    // cin / cout
    stages.push(pinLabel(startX - 8, y + 34, 'cin', 'end'));
    stages.push(wire(startX - 8, y + 30, startX, y + 30, { arrow: true }));
    const lastX = startX + (n - 1) * (stageW + gap) + stageW;
    stages.push(wire(lastX, y + 30, lastX + 30, y + 30, { arrow: true, color: COLOR.accent }));
    stages.push(pinLabel(lastX + 32, y + 34, 'cout', 'start'));
    return (
      <>
        {stages}
        {caption(20, captionKey)}
      </>
    );
  };
}

/** Subtractor — full adder with B inverted + carry-in 1. */
function subtractorFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(30, 60, 'a', 'end')}
      {pinLabel(30, 110, 'b', 'end')}
      {wire(38, 60, 260, 60)}
      {wire(38, 110, 100, 110)}
      {gateShape(125, 110, 'not', true)}
      {wire(160, 110, 260, 110)}
      {box(260, 40, 90, 110, 'ADDER', true)}
      {pinLabel(305, 168, 'cin = 1', 'middle')}
      {wire(305, 150, 305, 178)}
      {wire(350, 95, 410, 95, { arrow: true })}
      {pinLabel(420, 99, 'a − b', 'start')}
      {caption(30, 'fig.subtractor.cap')}
    </>
  );
}

/** Comparator: a vs b → 3 outputs. */
function comparatorFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 70, 'a', 'end')}
      {pinLabel(40, 150, 'b', 'end')}
      {wire(48, 70, 200, 70)}
      {wire(48, 150, 200, 150)}
      {box(200, 50, 100, 120, 'CMP', true)}
      {wire(300, 70, 400, 70, { arrow: true })}
      {wire(300, 110, 400, 110, { arrow: true })}
      {wire(300, 150, 400, 150, { arrow: true })}
      {pinLabel(410, 74, 'a > b', 'start')}
      {pinLabel(410, 114, 'a = b', 'start')}
      {pinLabel(410, 154, 'a < b', 'start')}
      {caption(30, 'fig.comparator.cap')}
    </>
  );
}

/** Decoder n→2ⁿ. */
function decoderFigure(): () => JSX.Element {
  return () => {
    const outputs = 4;
    const items: JSX.Element[] = [];
    for (let i = 0; i < outputs; i++) {
      const y = 50 + i * 36;
      items.push(wire(280, y, 380, y, { arrow: true, color: i === 1 ? COLOR.accent : COLOR.wireDim }));
      items.push(pinLabel(390, y + 4, `y${i}`, 'start'));
      items.push(
        <circle key={`o${i}`} cx={395} cy={y} r={5} fill={i === 1 ? COLOR.accent : COLOR.body} stroke={COLOR.bodyStroke} strokeWidth={1.2} />,
      );
    }
    return (
      <>
        {pinLabel(60, 90, 'a1', 'end')}
        {pinLabel(60, 130, 'a0', 'end')}
        {wire(68, 90, 180, 90)}
        {wire(68, 130, 180, 130)}
        {box(180, 40, 100, 140, '2→4', true)}
        {items}
        {caption(202, 'fig.decoder.cap')}
      </>
    );
  };
}

/** Encoder 4→2 (one-hot in, binary out). */
function encoderFigure(): () => JSX.Element {
  return () => {
    const items: JSX.Element[] = [];
    for (let i = 0; i < 4; i++) {
      const y = 50 + i * 36;
      items.push(pinLabel(40, y + 4, `x${i}`, 'end'));
      items.push(wire(48, y, 180, y, { color: i === 2 ? COLOR.accent : COLOR.wireDim }));
    }
    return (
      <>
        {items}
        {box(180, 40, 100, 140, '4→2', true)}
        {wire(280, 80, 400, 80, { arrow: true })}
        {wire(280, 140, 400, 140, { arrow: true })}
        {pinLabel(410, 84, 'b1', 'start')}
        {pinLabel(410, 144, 'b0', 'start')}
        {caption(202, 'fig.encoder.cap')}
      </>
    );
  };
}

/** MUX 2:1. */
function muxFigure(captionKey: string): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 70, 'a', 'end')}
      {pinLabel(40, 130, 'b', 'end')}
      {pinLabel(180, 200, 'sel', 'middle')}
      {wire(48, 70, 170, 70)}
      {wire(48, 130, 170, 130)}
      {wire(180, 196, 180, 165)}
      {/* trapezoid MUX */}
      <polygon
        points="170,50 230,80 230,120 170,150"
        fill={COLOR.body}
        stroke={COLOR.accent}
        strokeWidth={2}
      />
      <text x={200} y={104} textAnchor="middle" fontSize={11} fontWeight={700} fill={COLOR.text} fontFamily="ui-sans-serif, system-ui">
        MUX
      </text>
      {wire(230, 100, 380, 100, { arrow: true })}
      {pinLabel(390, 104, 'y', 'start')}
      {caption(30, captionKey)}
    </>
  );
}

/** DEMUX 1:2. */
function demuxFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 100, 'in', 'end')}
      {pinLabel(180, 200, 'sel', 'middle')}
      {wire(48, 100, 170, 100)}
      {wire(180, 196, 180, 165)}
      <polygon
        points="170,80 170,120 230,150 230,50"
        fill={COLOR.body}
        stroke={COLOR.accent}
        strokeWidth={2}
      />
      <text x={200} y={104} textAnchor="middle" fontSize={11} fontWeight={700} fill={COLOR.text} fontFamily="ui-sans-serif, system-ui">
        DMX
      </text>
      {wire(230, 65, 380, 65, { arrow: true })}
      {wire(230, 135, 380, 135, { arrow: true })}
      {pinLabel(390, 69, 'y0', 'start')}
      {pinLabel(390, 139, 'y1', 'start')}
      {caption(30, 'fig.demux.cap')}
    </>
  );
}

/** Flip-flop generic. */
function flipFlopFigure(label: string, ports: { left: string[]; right: string[] }, captionKey: string): () => JSX.Element {
  return () => {
    const items: JSX.Element[] = [];
    const top = 50;
    const bot = 170;
    const x = 180;
    const w = 120;
    items.push(box(x, top, w, bot - top, label, true));
    ports.left.forEach((p, i) => {
      const y = top + 24 + i * 36;
      items.push(pinLabel(x - 10, y + 4, p, 'end'));
      items.push(wire(x - 30, y, x, y));
    });
    ports.right.forEach((p, i) => {
      const y = top + 24 + i * 36;
      items.push(pinLabel(x + w + 10, y + 4, p, 'start'));
      items.push(wire(x + w, y, x + w + 30, y, { arrow: true }));
    });
    // clock symbol
    items.push(
      <path key="clk-tri" d={`M${x} ${bot - 28} L${x + 10} ${bot - 22} L${x} ${bot - 16}`} fill="none" stroke={COLOR.accent} strokeWidth={2} />,
    );
    items.push(<text key="clk-lbl" x={x - 8} y={bot - 18} textAnchor="end" fontSize={11} fill={COLOR.accent} fontWeight={700}>clk</text>);
    items.push(wire(x - 30, bot - 22, x, bot - 22, { color: COLOR.accent }));
    items.push(caption(30, captionKey));
    return <>{items}</>;
  };
}

/** SR latch — two cross-coupled NOR. */
function srLatchFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 80, 'S', 'end')}
      {pinLabel(40, 160, 'R', 'end')}
      {wire(48, 80, 160, 80)}
      {wire(48, 160, 160, 160)}
      {gateShape(190, 80, 'nor', true)}
      {gateShape(190, 160, 'nor', true)}
      {/* feedback */}
      {wire(225, 80, 250, 80)}
      {wire(250, 80, 250, 145)}
      {wire(250, 145, 158, 145, { color: COLOR.wireDim, dashed: true })}
      {wire(225, 160, 280, 160)}
      {wire(280, 160, 280, 95)}
      {wire(280, 95, 158, 95, { color: COLOR.wireDim, dashed: true })}
      {wire(250, 80, 400, 80, { arrow: true })}
      {wire(280, 160, 400, 160, { arrow: true })}
      {pinLabel(410, 84, 'Q', 'start')}
      {pinLabel(410, 164, '¬Q', 'start')}
      {caption(30, 'fig.srLatch.cap')}
    </>
  );
}

/** Clock waveform. */
function clockFigure(): () => JSX.Element {
  return () => {
    // square wave: 4 cycles
    const pts: string[] = ['40,150'];
    let x = 40;
    const period = 80;
    for (let i = 0; i < 4; i++) {
      pts.push(`${x},${150}`);
      pts.push(`${x},${80}`);
      pts.push(`${x + period / 2},${80}`);
      pts.push(`${x + period / 2},${150}`);
      x += period;
    }
    pts.push(`${x},${150}`);
    return (
      <>
        {/* axes */}
        <line x1={40} y1={150} x2={420} y2={150} stroke={COLOR.rail} strokeWidth={1} />
        <line x1={40} y1={60} x2={40} y2={170} stroke={COLOR.rail} strokeWidth={1} />
        <polyline points={pts.join(' ')} fill="none" stroke={COLOR.accent} strokeWidth={2} strokeLinejoin="miter" />
        {pinLabel(34, 84, '1', 'end')}
        {pinLabel(34, 154, '0', 'end')}
        {/* rising-edge markers */}
        {[80, 160, 240, 320].map((px) => (
          <g key={px}>
            <line x1={px} y1={50} x2={px} y2={170} stroke={COLOR.hi} strokeWidth={1} strokeDasharray="3 3" />
            <polygon points={`${px - 4},48 ${px + 4},48 ${px},42`} fill={COLOR.hi} />
          </g>
        ))}
        {caption(195, 'fig.clock.cap')}
      </>
    );
  };
}

/** Karnaugh 2×2 / 4×4 grid. */
function karnaughFigure(): () => JSX.Element {
  return () => {
    const cells: { col: number; row: number; v: 0 | 1; group?: 'a' | 'b' }[] = [
      { col: 0, row: 0, v: 0 },
      { col: 1, row: 0, v: 1, group: 'a' },
      { col: 3, row: 0, v: 1, group: 'a' },
      { col: 2, row: 0, v: 0 },
      { col: 0, row: 1, v: 1, group: 'b' },
      { col: 1, row: 1, v: 1, group: 'a' },
      { col: 3, row: 1, v: 1, group: 'a' },
      { col: 2, row: 1, v: 0 },
      { col: 0, row: 2, v: 1, group: 'b' },
      { col: 1, row: 2, v: 0 },
      { col: 3, row: 2, v: 0 },
      { col: 2, row: 2, v: 0 },
      { col: 0, row: 3, v: 0 },
      { col: 1, row: 3, v: 0 },
      { col: 3, row: 3, v: 0 },
      { col: 2, row: 3, v: 0 },
    ];
    const x0 = 130;
    const y0 = 20;
    const s = 40;
    const items: JSX.Element[] = [];
    items.push(<text key="h" x={x0 + 2 * s} y={y0 - 4} textAnchor="middle" fontSize={11} fill={COLOR.textDim}>CD</text>);
    items.push(<text key="v" x={x0 - 18} y={y0 + 2 * s} textAnchor="middle" fontSize={11} fill={COLOR.textDim}>AB</text>);
    ['00', '01', '11', '10'].forEach((lbl, i) => {
      items.push(<text key={`hc${i}`} x={x0 + i * s + s / 2} y={y0 + 10} textAnchor="middle" fontSize={10} fill={COLOR.textDim}>{lbl}</text>);
      items.push(<text key={`vc${i}`} x={x0 - 4} y={y0 + i * s + s / 2 + 18} textAnchor="end" fontSize={10} fill={COLOR.textDim}>{lbl}</text>);
    });
    for (const c of cells) {
      items.push(
        <rect
          key={`r${c.col}-${c.row}`}
          x={x0 + c.col * s}
          y={y0 + 18 + c.row * s}
          width={s}
          height={s}
          fill={c.v === 1 ? '#162536' : COLOR.body}
          stroke={COLOR.bodyStroke}
          strokeWidth={1}
        />,
      );
      items.push(
        <text
          key={`t${c.col}-${c.row}`}
          x={x0 + c.col * s + s / 2}
          y={y0 + 18 + c.row * s + s / 2 + 5}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill={c.v === 1 ? COLOR.text : COLOR.wireDim}
        >
          {c.v}
        </text>,
      );
    }
    // group A — four 1s top-right region
    items.push(<rect x={x0 + s} y={y0 + 18} width={3 * s} height={2 * s} fill="none" stroke={COLOR.accent} strokeWidth={2} rx={6} />);
    // group B — two 1s left column
    items.push(<rect x={x0 - 2} y={y0 + 18 + s} width={s + 4} height={2 * s} fill="none" stroke={COLOR.hi} strokeWidth={2} rx={6} />);
    items.push(caption(205, 'fig.karnaugh.cap'));
    return <>{items}</>;
  };
}

/** Truth table 2x3 with header. */
function truthTableFigure(captionKey: string): () => JSX.Element {
  return () => {
    const rows: { a: 0 | 1; b: 0 | 1; y: 0 | 1 }[] = [
      { a: 0, b: 0, y: 0 },
      { a: 0, b: 1, y: 0 },
      { a: 1, b: 0, y: 0 },
      { a: 1, b: 1, y: 1 },
    ];
    const x0 = 140;
    const y0 = 20;
    const cw = 60;
    const rh = 32;
    const items: JSX.Element[] = [];
    const cols = ['a', 'b', 'y'];
    cols.forEach((c, i) => {
      items.push(
        <rect key={`h${i}`} x={x0 + i * cw} y={y0} width={cw} height={rh} fill="#162536" stroke={COLOR.bodyStroke} />,
      );
      items.push(
        <text key={`ht${i}`} x={x0 + i * cw + cw / 2} y={y0 + rh / 2 + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill={COLOR.accent}>{c}</text>,
      );
    });
    rows.forEach((r, ri) => {
      [r.a, r.b, r.y].forEach((v, ci) => {
        items.push(
          <rect key={`c${ri}-${ci}`} x={x0 + ci * cw} y={y0 + (ri + 1) * rh} width={cw} height={rh} fill={ri === 3 && ci === 2 ? '#1b2c20' : COLOR.body} stroke={COLOR.bodyStroke} />,
        );
        items.push(
          <text key={`v${ri}-${ci}`} x={x0 + ci * cw + cw / 2} y={y0 + (ri + 1) * rh + rh / 2 + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={v === 1 ? COLOR.hi : COLOR.textDim}>{v}</text>,
        );
      });
    });
    items.push(caption(205, captionKey));
    return <>{items}</>;
  };
}

/** Binary digits diagram. */
function bitsFigure(): () => JSX.Element {
  return () => {
    const bits = [1, 0, 1, 1, 0, 0, 1, 0];
    const x0 = 80;
    const items: JSX.Element[] = [];
    bits.forEach((b, i) => {
      const x = x0 + i * 42;
      items.push(
        <g key={i}>
          <rect x={x} y={70} width={36} height={50} rx={5} fill={b === 1 ? '#1f3a66' : COLOR.body} stroke={b === 1 ? COLOR.accent : COLOR.bodyStroke} strokeWidth={1.4} />
          <text x={x + 18} y={102} textAnchor="middle" fontSize={20} fontWeight={800} fill={b === 1 ? COLOR.accent : COLOR.textDim} fontFamily="ui-monospace, monospace">{b}</text>
          <text x={x + 18} y={140} textAnchor="middle" fontSize={11} fill={COLOR.textDim} fontFamily="ui-monospace, monospace">2{sup(7 - i)}</text>
        </g>,
      );
    });
    items.push(
      <text key="eq" x={W / 2} y={185} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLOR.text}>
        = 178₁₀ = 0xB2
      </text>,
    );
    items.push(caption(40, 'fig.bits.cap'));
    return <>{items}</>;
  };
}
function sup(n: number): string {
  const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷' };
  return String(n).split('').map((d) => map[d] ?? d).join('');
}

/** Number systems — three columns base 2/10/16. */
function numberSystemsFigure(): () => JSX.Element {
  return () => {
    const rows = [
      ['0010', '2', '2'],
      ['0101', '5', '5'],
      ['1010', '10', 'A'],
      ['1111', '15', 'F'],
    ];
    const items: JSX.Element[] = [];
    const headers = ['BIN', 'DEC', 'HEX'];
    const x0 = 140;
    const cw = 70;
    headers.forEach((h, i) => {
      items.push(<text key={`h${i}`} x={x0 + i * cw + cw / 2} y={50} textAnchor="middle" fontSize={11} fontWeight={800} fill={COLOR.accent}>{h}</text>);
    });
    rows.forEach((r, ri) => {
      r.forEach((v, ci) => {
        items.push(
          <rect key={`c${ri}-${ci}`} x={x0 + ci * cw} y={60 + ri * 30} width={cw} height={28} fill={COLOR.body} stroke={COLOR.bodyStroke} />,
        );
        items.push(
          <text key={`v${ri}-${ci}`} x={x0 + ci * cw + cw / 2} y={60 + ri * 30 + 19} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLOR.text} fontFamily="ui-monospace, monospace">{v}</text>,
        );
      });
    });
    items.push(caption(205, 'fig.numberSystems.cap'));
    return <>{items}</>;
  };
}

/** Two's complement: bit flip + add 1 diagram. */
function twosComplementFigure(): () => JSX.Element {
  return () => (
    <>
      <text x={W / 2} y={50} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLOR.text}>+5</text>
      <text x={W / 2} y={110} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLOR.accent}>flip → 1010</text>
      <text x={W / 2} y={140} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLOR.accent}>+1   → 1011</text>
      <text x={W / 2} y={75} textAnchor="middle" fontSize={20} fontWeight={800} fill={COLOR.hi} fontFamily="ui-monospace, monospace">0101</text>
      <text x={W / 2} y={185} textAnchor="middle" fontSize={20} fontWeight={800} fill={COLOR.lo} fontFamily="ui-monospace, monospace">−5 = 1011</text>
      {caption(205, 'fig.twosComplement.cap')}
    </>
  );
}

/** Boolean algebra identities. */
function booleanAlgebraFigure(): () => JSX.Element {
  return () => {
    const lines = [
      'A · 1 = A          A + 0 = A',
      'A · 0 = 0          A + 1 = 1',
      'A · A = A          A + A = A',
      'A · ¬A = 0       A + ¬A = 1',
      '¬(A · B) = ¬A + ¬B   (De Morgan)',
    ];
    return (
      <>
        {lines.map((l, i) => (
          <text key={i} x={W / 2} y={50 + i * 28} textAnchor="middle" fontSize={14} fontWeight={700} fill={i === 4 ? COLOR.accent : COLOR.text} fontFamily="ui-monospace, monospace">
            {l}
          </text>
        ))}
        {caption(205, 'fig.booleanAlgebra.cap')}
      </>
    );
  };
}

/** De Morgan visual: NAND = OR-of-inverters. */
function demorganFigure(): () => JSX.Element {
  return () => (
    <>
      {/* left: NAND */}
      {gateShape(120, 100, 'nand', true)}
      {wire(50, 80, 95, 80)}
      {wire(50, 120, 95, 120)}
      {wire(155, 100, 200, 100, { arrow: true })}
      {pinLabel(40, 84, 'a', 'end')}
      {pinLabel(40, 124, 'b', 'end')}
      {pinLabel(210, 104, '¬(a·b)', 'start')}
      <text x={120} y={170} textAnchor="middle" fontSize={11} fill={COLOR.textDim}>≡</text>
      {/* right: OR of NOTs */}
      {gateShape(310, 70, 'not', true)}
      {gateShape(310, 130, 'not', true)}
      {wire(280, 70, 290, 70)}
      {wire(280, 130, 290, 130)}
      {wire(340, 70, 380, 90)}
      {wire(340, 130, 380, 110)}
      {gateShape(405, 100, 'or')}
      {wire(440, 100, 460, 100, { arrow: true })}
      {caption(205, 'fig.demorgan.cap')}
    </>
  );
}

/** SOP / POS: stacked AND-OR. */
function sopPosFigure(): () => JSX.Element {
  return () => (
    <>
      <text x={W / 2} y={50} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLOR.accent}>SOP: y = ¬a·b + a·¬b</text>
      <text x={W / 2} y={140} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLOR.hi}>POS: y = (a + b)(¬a + ¬b)</text>
      <text x={W / 2} y={80} textAnchor="middle" fontSize={12} fill={COLOR.textDim} fontFamily="ui-monospace, monospace">AND, then OR</text>
      <text x={W / 2} y={170} textAnchor="middle" fontSize={12} fill={COLOR.textDim} fontFamily="ui-monospace, monospace">OR, then AND</text>
      {caption(205, 'fig.sopPos.cap')}
    </>
  );
}

/** Tri-state buffer (with enable). */
function triStateFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(50, 110, 'in', 'end')}
      {pinLabel(170, 200, 'en', 'middle')}
      {wire(58, 110, 160, 110)}
      {wire(170, 196, 170, 165)}
      <polygon points="160,80 160,140 220,110" fill={COLOR.body} stroke={COLOR.accent} strokeWidth={2} />
      {wire(220, 110, 380, 110, { arrow: true })}
      {pinLabel(390, 114, 'out (or Z)', 'start')}
      {caption(40, 'fig.triState.cap')}
    </>
  );
}

/** Register N-bit. */
function registerFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 110, 'D[7:0]', 'end')}
      {wire(48, 110, 180, 110)}
      {box(180, 60, 120, 100, 'REG 8', true)}
      <path d={`M180 145 L190 138 L180 131`} fill="none" stroke={COLOR.accent} strokeWidth={2} />
      <text x={170} y={144} textAnchor="end" fontSize={11} fill={COLOR.accent}>clk</text>
      {wire(170, 142, 180, 142, { color: COLOR.accent })}
      {wire(300, 110, 420, 110, { arrow: true })}
      {pinLabel(430, 114, 'Q[7:0]', 'start')}
      {caption(40, 'fig.register.cap')}
    </>
  );
}

/** Shift register 4-bit chain. */
function shiftRegisterFigure(): () => JSX.Element {
  return () => {
    const items: JSX.Element[] = [];
    const x0 = 70;
    const w = 70;
    const gap = 16;
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * (w + gap);
      items.push(box(x, 80, w, 60, `Q${i}`));
      if (i < 3) {
        items.push(wire(x + w, 110, x + w + gap, 110, { arrow: true }));
      }
    }
    items.push(pinLabel(60, 114, 'in', 'end'));
    items.push(wire(x0 - 12, 110, x0, 110, { arrow: true }));
    items.push(pinLabel(x0 + 4 * (w + gap) - 8, 114, 'out', 'start'));
    items.push(wire(x0 + 3 * (w + gap) + w, 110, x0 + 4 * (w + gap), 110, { arrow: true }));
    // common clk
    items.push(wire(x0, 170, x0 + 3 * (w + gap) + w, 170, { color: COLOR.accent }));
    items.push(<text key="clk" x={20} y={174} fontSize={11} fontWeight={700} fill={COLOR.accent}>clk</text>);
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * (w + gap) + w / 2;
      items.push(wire(x, 140, x, 170, { color: COLOR.accent }));
    }
    items.push(caption(40, 'fig.shiftRegister.cap'));
    return <>{items}</>;
  };
}

/** Counter feedback diagram. */
function counterFigure(captionKey: string): () => JSX.Element {
  return () => (
    <>
      {box(60, 80, 90, 70, '+1', true)}
      {box(220, 80, 110, 70, 'REG', true)}
      {wire(150, 115, 220, 115, { arrow: true })}
      {wire(330, 115, 370, 115, { arrow: true })}
      {wire(370, 115, 370, 50)}
      {wire(370, 50, 105, 50, { dashed: true })}
      {wire(105, 50, 105, 80, { arrow: true, dashed: true })}
      {pinLabel(385, 119, 'count', 'start')}
      <text x={275} y={170} textAnchor="middle" fontSize={11} fill={COLOR.accent}>clk ▲</text>
      {caption(40, captionKey)}
    </>
  );
}

/** Mod-N counter with comparator reset. */
function modNCounterFigure(): () => JSX.Element {
  return () => (
    <>
      {box(40, 80, 80, 70, 'REG', true)}
      {box(160, 80, 80, 70, '+1')}
      {box(280, 80, 80, 70, '=N?')}
      {wire(120, 115, 160, 115, { arrow: true })}
      {wire(240, 115, 280, 115, { arrow: true })}
      {wire(360, 115, 410, 115, { arrow: true })}
      {wire(410, 115, 410, 50)}
      {wire(410, 50, 80, 50, { dashed: true })}
      {wire(80, 50, 80, 80, { arrow: true, color: COLOR.lo, dashed: true })}
      <text x={245} y={55} textAnchor="middle" fontSize={11} fill={COLOR.lo}>reset on N</text>
      {pinLabel(420, 119, 'q', 'start')}
      {caption(40, 'fig.modNCounter.cap')}
    </>
  );
}

/** Ring counter — one-hot rotation. */
function ringCounterFigure(): () => JSX.Element {
  return () => {
    const items: JSX.Element[] = [];
    const cx = W / 2;
    const cy = 110;
    const r = 70;
    const ff = 4;
    for (let i = 0; i < ff; i++) {
      const a = -Math.PI / 2 + (i / ff) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const active = i === 0;
      items.push(
        <g key={i}>
          <circle cx={x} cy={y} r={18} fill={active ? '#1f3a66' : COLOR.body} stroke={active ? COLOR.accent : COLOR.bodyStroke} strokeWidth={1.6} />
          <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill={active ? COLOR.accent : COLOR.textDim} fontFamily="ui-monospace, monospace">
            {active ? 1 : 0}
          </text>
        </g>,
      );
      const a2 = -Math.PI / 2 + ((i + 1) / ff) * Math.PI * 2;
      const x2 = cx + Math.cos(a2) * r;
      const y2 = cy + Math.sin(a2) * r;
      const mx = cx + Math.cos((a + a2) / 2) * (r + 12);
      const my = cy + Math.sin((a + a2) / 2) * (r + 12);
      items.push(
        <path key={`p${i}`} d={`M${x} ${y} Q${mx} ${my} ${x2} ${y2}`} fill="none" stroke={COLOR.wire} strokeWidth={1.5} markerEnd="url(#arrowhead)" />,
      );
    }
    items.push(
      <defs key="defs">
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={COLOR.wire} />
        </marker>
      </defs>,
    );
    items.push(caption(205, 'fig.ringCounter.cap'));
    return <>{items}</>;
  };
}

/** ROM / RAM cell layout. */
function memoryFigure(captionKey: string, isRom: boolean): () => JSX.Element {
  return () => (
    <>
      {pinLabel(50, 90, 'addr', 'end')}
      {wire(58, 90, 170, 90)}
      {!isRom ? <>{pinLabel(50, 140, 'din', 'end')}{wire(58, 140, 170, 140)}</> : null}
      {!isRom ? <>{pinLabel(50, 180, 'we', 'end')}{wire(58, 180, 170, 180)}</> : null}
      {box(170, 50, 160, 160, isRom ? 'ROM 8×4' : 'RAM 8×4', true)}
      {wire(330, 130, 420, 130, { arrow: true })}
      {pinLabel(430, 134, 'dout', 'start')}
      {caption(30, captionKey)}
    </>
  );
}

/** Address decoding bus split. */
function addressDecodeFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 110, 'A[7:0]', 'end')}
      {wire(48, 110, 130, 110)}
      <polygon points="130,80 180,80 180,140 130,140" fill={COLOR.body} stroke={COLOR.accent} strokeWidth={2} />
      <text x={155} y={114} textAnchor="middle" fontSize={11} fontWeight={700} fill={COLOR.text}>SPLIT</text>
      {wire(180, 90, 250, 60)}
      {wire(180, 130, 250, 160)}
      {box(250, 40, 90, 50, 'A[7:6] DEC')}
      {box(250, 140, 90, 50, 'A[5:0] OFF')}
      {wire(340, 65, 420, 65, { arrow: true })}
      {wire(340, 165, 420, 165, { arrow: true })}
      {pinLabel(430, 69, 'chip sel', 'start')}
      {pinLabel(430, 169, 'addr in chip', 'start')}
      {caption(30, 'fig.addressDecode.cap')}
    </>
  );
}

/** FSM state graph. */
function fsmFigure(captionKey: string): () => JSX.Element {
  return () => (
    <>
      <defs>
        <marker id="fsmArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={COLOR.wire} />
        </marker>
      </defs>
      <circle cx={130} cy={110} r={32} fill={COLOR.body} stroke={COLOR.accent} strokeWidth={2} />
      <text x={130} y={114} textAnchor="middle" fontSize={13} fontWeight={800} fill={COLOR.accent}>S0</text>
      <circle cx={260} cy={70} r={32} fill={COLOR.body} stroke={COLOR.bodyStroke} strokeWidth={2} />
      <text x={260} y={74} textAnchor="middle" fontSize={13} fontWeight={800} fill={COLOR.text}>S1</text>
      <circle cx={260} cy={150} r={32} fill={COLOR.body} stroke={COLOR.bodyStroke} strokeWidth={2} />
      <text x={260} y={154} textAnchor="middle" fontSize={13} fontWeight={800} fill={COLOR.text}>S2</text>
      <path d="M158 96 Q200 60 230 70" fill="none" stroke={COLOR.wire} strokeWidth={1.6} markerEnd="url(#fsmArrow)" />
      <path d="M158 124 Q200 160 230 150" fill="none" stroke={COLOR.wire} strokeWidth={1.6} markerEnd="url(#fsmArrow)" />
      <path d="M290 92 Q330 110 290 130" fill="none" stroke={COLOR.wire} strokeWidth={1.6} markerEnd="url(#fsmArrow)" />
      <path d="M232 142 Q200 110 232 78" fill="none" stroke={COLOR.wire} strokeWidth={1.6} markerEnd="url(#fsmArrow)" />
      <text x={195} y={60} fontSize={10} fill={COLOR.textDim}>in=1</text>
      <text x={195} y={185} fontSize={10} fill={COLOR.textDim}>in=0</text>
      {caption(205, captionKey)}
    </>
  );
}

/** Moore vs Mealy diagram. */
function mooreMealyFigure(): () => JSX.Element {
  return () => (
    <>
      <text x={120} y={45} textAnchor="middle" fontSize={13} fontWeight={800} fill={COLOR.accent}>Moore</text>
      {box(50, 60, 140, 110, 'state → out')}
      <text x={120} y={195} textAnchor="middle" fontSize={11} fill={COLOR.textDim}>out depends on state</text>
      <text x={360} y={45} textAnchor="middle" fontSize={13} fontWeight={800} fill={COLOR.hi}>Mealy</text>
      {box(290, 60, 140, 110, 'state+in → out')}
      <text x={360} y={195} textAnchor="middle" fontSize={11} fill={COLOR.textDim}>out depends on state + input</text>
    </>
  );
}

/** ALU symbol with op + flags. */
function aluFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 70, 'a', 'end')}
      {pinLabel(40, 110, 'b', 'end')}
      {pinLabel(40, 160, 'op', 'end')}
      {wire(48, 70, 170, 70)}
      {wire(48, 110, 170, 110)}
      {wire(48, 160, 170, 160)}
      <polygon points="170,50 230,80 230,130 170,160 170,140 190,105 170,70" fill={COLOR.body} stroke={COLOR.accent} strokeWidth={2} />
      <text x={205} y={108} textAnchor="middle" fontSize={11} fontWeight={800} fill={COLOR.text}>ALU</text>
      {wire(230, 90, 360, 90, { arrow: true })}
      {wire(230, 120, 360, 120, { arrow: true })}
      {pinLabel(370, 94, 'result', 'start')}
      {pinLabel(370, 124, 'flags (C,Z,N,V)', 'start')}
      {caption(30, 'fig.alu.cap')}
    </>
  );
}

/** Register file: addr → mux → data. */
function registerFileFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(40, 60, 'rs1', 'end')}
      {pinLabel(40, 110, 'rs2', 'end')}
      {pinLabel(40, 160, 'rd', 'end')}
      {wire(48, 60, 150, 60)}
      {wire(48, 110, 150, 110)}
      {wire(48, 160, 150, 160)}
      {box(150, 40, 130, 150, 'REGFILE', true)}
      {wire(280, 70, 400, 70, { arrow: true })}
      {wire(280, 130, 400, 130, { arrow: true })}
      {pinLabel(410, 74, 'data1', 'start')}
      {pinLabel(410, 134, 'data2', 'start')}
      {caption(40, 'fig.registerFile.cap')}
    </>
  );
}

/** Datapath: regfile → ALU → register. */
function datapathFigure(): () => JSX.Element {
  return () => (
    <>
      {box(40, 70, 90, 80, 'REGS')}
      {box(180, 70, 90, 80, 'ALU', true)}
      {box(320, 70, 90, 80, 'REG-W')}
      {wire(130, 110, 180, 110, { arrow: true })}
      {wire(270, 110, 320, 110, { arrow: true })}
      {wire(410, 110, 430, 110)}
      {wire(430, 110, 430, 50)}
      {wire(430, 50, 85, 50, { dashed: true })}
      {wire(85, 50, 85, 70, { arrow: true, dashed: true })}
      {caption(190, 'fig.datapath.cap')}
    </>
  );
}

/** Control unit: opcode → control signals. */
function controlUnitFigure(): () => JSX.Element {
  return () => (
    <>
      {pinLabel(50, 110, 'opcode', 'end')}
      {wire(58, 110, 160, 110)}
      {box(160, 60, 140, 100, 'CONTROL', true)}
      {wire(300, 80, 400, 80, { arrow: true })}
      {wire(300, 110, 400, 110, { arrow: true })}
      {wire(300, 140, 400, 140, { arrow: true })}
      {pinLabel(410, 84, 'aluOp', 'start')}
      {pinLabel(410, 114, 'regWrite', 'start')}
      {pinLabel(410, 144, 'memEn', 'start')}
      {caption(40, 'fig.controlUnit.cap')}
    </>
  );
}

/** Hazard glitch waveform. */
function hazardFigure(): () => JSX.Element {
  return () => {
    const path = '40,140 100,140 110,90 130,90 140,140 160,140 200,140 220,90 280,90 290,140 380,140';
    return (
      <>
        <line x1={40} y1={140} x2={420} y2={140} stroke={COLOR.rail} strokeWidth={1} />
        <polyline points={path} fill="none" stroke={COLOR.accent} strokeWidth={2} />
        <text x={150} y={70} fontSize={11} fill={COLOR.lo}>static-1 hazard ↓</text>
        <line x1={150} y1={75} x2={150} y2={88} stroke={COLOR.lo} strokeWidth={1} />
        {caption(195, 'fig.hazards.cap')}
      </>
    );
  };
}

/** Pipeline stages. */
function pipelineFigure(): () => JSX.Element {
  return () => {
    const labels = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    const items: JSX.Element[] = [];
    const w = 70;
    const gap = 14;
    const x0 = 40;
    labels.forEach((l, i) => {
      items.push(box(x0 + i * (w + gap), 90, w, 50, l));
      if (i < labels.length - 1) {
        items.push(wire(x0 + i * (w + gap) + w, 115, x0 + (i + 1) * (w + gap), 115, { arrow: true }));
      }
    });
    items.push(caption(40, 'fig.pipeline.cap'));
    return <>{items}</>;
  };
}

/** Tooling: gatecraft layers diagram. */
function toolingFigure(): () => JSX.Element {
  return () => (
    <>
      {box(50, 60, 110, 40, 'Canvas')}
      {box(50, 110, 110, 40, 'Renderer')}
      {box(190, 60, 110, 40, 'Document')}
      {box(190, 110, 110, 40, 'Netlist')}
      {box(330, 60, 110, 40, 'Worker', true)}
      {box(330, 110, 110, 40, 'Engine', true)}
      {wire(160, 80, 190, 80, { arrow: true })}
      {wire(300, 80, 330, 80, { arrow: true })}
      {wire(385, 100, 385, 110, { arrow: true })}
      {wire(245, 100, 245, 110)}
      {caption(180, 'fig.tooling.cap')}
    </>
  );
}

/** Timing setup/hold window. */
function timingFigure(): () => JSX.Element {
  return () => (
    <>
      <line x1={40} y1={150} x2={420} y2={150} stroke={COLOR.rail} strokeWidth={1} />
      <line x1={230} y1={50} x2={230} y2={170} stroke={COLOR.accent} strokeWidth={2} strokeDasharray="3 3" />
      <text x={230} y={45} textAnchor="middle" fontSize={11} fontWeight={700} fill={COLOR.accent}>clk ▲</text>
      <rect x={180} y={70} width={50} height={50} fill="rgba(250,204,21,0.18)" stroke={COLOR.accent} strokeDasharray="3 3" />
      <rect x={230} y={70} width={40} height={50} fill="rgba(134,239,172,0.18)" stroke={COLOR.hi} strokeDasharray="3 3" />
      <text x={205} y={66} textAnchor="middle" fontSize={11} fill={COLOR.accent}>t_su</text>
      <text x={250} y={66} textAnchor="middle" fontSize={11} fill={COLOR.hi}>t_h</text>
      <polyline points="50,110 160,110 175,90 320,90 335,110 400,110" fill="none" stroke={COLOR.wire} strokeWidth={2} />
      <text x={50} y={138} fontSize={11} fill={COLOR.textDim}>data</text>
      {caption(200, 'fig.timing.cap')}
    </>
  );
}

/** State encoding: binary vs one-hot vs gray. */
function stateEncodingFigure(): () => JSX.Element {
  return () => {
    const rows = [
      ['S0', '00', '0001', '00'],
      ['S1', '01', '0010', '01'],
      ['S2', '10', '0100', '11'],
      ['S3', '11', '1000', '10'],
    ];
    const headers = ['state', 'binary', 'one-hot', 'gray'];
    const x0 = 80;
    const cw = 80;
    const y0 = 50;
    const items: JSX.Element[] = [];
    headers.forEach((h, i) => {
      items.push(<text key={`h${i}`} x={x0 + i * cw + cw / 2} y={y0} textAnchor="middle" fontSize={11} fontWeight={800} fill={COLOR.accent}>{h}</text>);
    });
    rows.forEach((r, ri) => {
      r.forEach((v, ci) => {
        items.push(<rect key={`c${ri}-${ci}`} x={x0 + ci * cw} y={y0 + 10 + ri * 28} width={cw} height={26} fill={COLOR.body} stroke={COLOR.bodyStroke} />);
        items.push(<text key={`v${ri}-${ci}`} x={x0 + ci * cw + cw / 2} y={y0 + 10 + ri * 28 + 17} textAnchor="middle" fontSize={12} fontWeight={700} fill={COLOR.text} fontFamily="ui-monospace, monospace">{v}</text>);
      });
    });
    items.push(caption(205, 'fig.stateEncoding.cap'));
    return <>{items}</>;
  };
}

/* ------------------------------------------------------------------ */
/*                     Lesson ID → figure mapping                      */
/* ------------------------------------------------------------------ */

const LESSON_FIGURES: Readonly<Record<string, () => JSX.Element>> = {
  /* foundations */
  'bits': bitsFigure(),
  'number-systems': numberSystemsFigure(),
  'binary-arith': bitsFigure(),
  'twos-complement': twosComplementFigure(),
  'boolean-algebra': booleanAlgebraFigure(),
  'demorgan': demorganFigure(),

  /* gates */
  'gates': gateFigure('and', 'fig.gates.cap'),
  'universal-gates': gateFigure('nand', 'fig.universalGates.cap'),
  'truth-table': truthTableFigure('fig.truthTable.cap'),
  'sop-pos': sopPosFigure(),
  'karnaugh': karnaughFigure(),

  /* combinational */
  'half-adder': halfAdderFigure(),
  'full-adder': fullAdderFigure(),
  'ripple-adder': rippleFigure(4, 'fig.rippleAdder.cap'),
  'subtractor': subtractorFigure(),
  'comparator': comparatorFigure(),
  'decoder': decoderFigure(),
  'encoder': encoderFigure(),
  'mux': muxFigure('fig.mux.cap'),
  'demux': demuxFigure(),
  'tri-state': triStateFigure(),

  /* sequential */
  'sr-latch': srLatchFigure(),
  'd-latch': flipFlopFigure('D-LATCH', { left: ['D', 'en'], right: ['Q'] }, 'fig.dLatch.cap'),
  'd-flip-flop': flipFlopFigure('D-FF', { left: ['D'], right: ['Q', '¬Q'] }, 'fig.dFlipFlop.cap'),
  'jk-flip-flop': flipFlopFigure('JK-FF', { left: ['J', 'K'], right: ['Q', '¬Q'] }, 'fig.jkFlipFlop.cap'),
  't-flip-flop': flipFlopFigure('T-FF', { left: ['T'], right: ['Q'] }, 'fig.tFlipFlop.cap'),
  'clock': clockFigure(),
  'timing': timingFigure(),

  /* registers */
  'register': registerFigure(),
  'shift-register': shiftRegisterFigure(),
  'counter': counterFigure('fig.counter.cap'),
  'mod-n-counter': modNCounterFigure(),
  'ring-counter': ringCounterFigure(),

  /* memory */
  'rom': memoryFigure('fig.rom.cap', true),
  'ram': memoryFigure('fig.ram.cap', false),
  'address-decoding': addressDecodeFigure(),

  /* fsm */
  'fsm-intro': fsmFigure('fig.fsmIntro.cap'),
  'moore-vs-mealy': mooreMealyFigure(),
  'fsm-design': fsmFigure('fig.fsmDesign.cap'),
  'state-encoding': stateEncodingFigure(),

  /* datapath */
  'alu': aluFigure(),
  'register-file': registerFileFigure(),
  'datapath-intro': datapathFigure(),
  'control-unit': controlUnitFigure(),

  /* beyond */
  'hazards': hazardFigure(),
  'pipeline': pipelineFigure(),
  'tooling': toolingFigure(),
};

/** Whether the panel should render a figure block for this lesson. */
export function hasLessonFigure(lessonId: string): boolean {
  return Object.prototype.hasOwnProperty.call(LESSON_FIGURES, lessonId);
}
