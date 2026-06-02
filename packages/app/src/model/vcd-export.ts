/**
 * Value Change Dump (VCD) export. The format spec is from IEEE
 * 1364-2001 §18.2 and is the standard interchange consumed by
 * GTKWave, iverilog `$dumpvars`, and most third-party waveform
 * viewers.
 *
 * Input is a flat list of traces (each with a label, width, and a
 * series of (tick, value) samples). Output is one VCD string that
 * can be written as a `.vcd` file.
 *
 * Multi-bit values use VCD's `b…<id>` form. Unknown bits map to `x`,
 * hi-Z bits map to `z`. Width-1 signals use the compact single-char
 * form (`0<id>` / `1<id>` / `x<id>` / `z<id>`).
 */

export interface VcdTrace {
  /** Display name. Whitespace is replaced with `_` for VCD strictness. */
  label: string;
  width: number;
  samples: readonly { t: number; bits: bigint; x: bigint; z: bigint }[];
}

export function exportVCD(input: {
  traces: readonly VcdTrace[];
  timescale?: string; // default "1ns"
}): string {
  const ts = input.timescale ?? '1ns';
  const lines: string[] = [];
  lines.push(`$date\n  ${new Date().toISOString()}\n$end`);
  lines.push('$version\n  gatecraft VCD export 1\n$end');
  lines.push(`$timescale ${ts} $end`);
  lines.push('$scope module gatecraft $end');
  // VCD short-id alphabet is `!` (33) through `~` (126).
  const idFor = (i: number): string => {
    const base = 126 - 33 + 1;
    let s = '';
    let n = i;
    do {
      s = String.fromCharCode(33 + (n % base)) + s;
      n = Math.floor(n / base) - 1;
    } while (n >= 0);
    return s;
  };
  const ids = input.traces.map((_, i) => idFor(i));
  input.traces.forEach((tr, i) => {
    const safe = tr.label.replace(/\s+/g, '_');
    lines.push(`$var wire ${tr.width} ${ids[i]} ${safe} $end`);
  });
  lines.push('$upscope $end');
  lines.push('$enddefinitions $end');

  // Build a sorted event list: all (t, traceIdx, valueChange).
  // For each trace we emit its initial value at #0 and then a value
  // line for every sample whose value differs from the prior.
  if (input.traces.length === 0) return lines.join('\n');

  // Group samples by tick.
  const ticks = new Set<number>();
  for (const tr of input.traces) for (const s of tr.samples) ticks.add(s.t);
  const sortedTicks = [...ticks].sort((a, b) => a - b);

  // Track current and previous formatted value per trace.
  const prev: (string | null)[] = input.traces.map(() => null);

  lines.push('#0');
  // Initial values: every trace's first sample (or `x` if it has none).
  input.traces.forEach((tr, i) => {
    const s = tr.samples[0];
    const v = s ? formatValue(s.bits, s.x, s.z, tr.width, ids[i]!) : `x${ids[i]}`;
    lines.push(v);
    prev[i] = v;
  });

  for (const t of sortedTicks) {
    if (t === 0) continue;
    let header = false;
    input.traces.forEach((tr, i) => {
      const s = tr.samples.find((q) => q.t === t);
      if (!s) return;
      const v = formatValue(s.bits, s.x, s.z, tr.width, ids[i]!);
      if (v === prev[i]) return;
      if (!header) {
        lines.push(`#${t}`);
        header = true;
      }
      lines.push(v);
      prev[i] = v;
    });
  }

  return lines.join('\n');
}

function formatValue(
  bits: bigint,
  x: bigint,
  z: bigint,
  width: number,
  id: string,
): string {
  if (width === 1) {
    if (x !== 0n) return `x${id}`;
    if (z !== 0n) return `z${id}`;
    return `${bits & 1n}${id}`;
  }
  // Build binary string MSB → LSB, marking x/z bits per position.
  const chars: string[] = [];
  for (let i = width - 1; i >= 0; i--) {
    const m = 1n << BigInt(i);
    if (x & m) chars.push('x');
    else if (z & m) chars.push('z');
    else chars.push(bits & m ? '1' : '0');
  }
  return `b${chars.join('')} ${id}`;
}
