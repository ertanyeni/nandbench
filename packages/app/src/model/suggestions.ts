/**
 * Per-kind "what comes next" suggestion table.
 *
 * The map is curated based on common circuit patterns — placing an Input
 * pin almost always leads to a gate; placing a Counter usually needs a
 * Clock and a way to read the bits. Suggestions surface in two places:
 *   1. Palette: matching items glow soft blue.
 *   2. Canvas: clickable `+` hints near the most recently placed component.
 *
 * Keep the lists short (max 5 entries) — too many suggestions ≈ noise.
 */
export const SUGGESTIONS: Readonly<Record<string, readonly string[]>> = {
  input: ['and', 'or', 'not', 'xor', 'nand'],
  output: ['input', 'constant'],
  constant: ['adder', 'and', 'or', 'register'],
  clock: ['register', 'counter', 'shift-register'],
  splitter: ['led', '7seg', 'output'],
  and: ['or', 'not', 'output', 'led'],
  or: ['and', 'not', 'output', 'led'],
  nand: ['not', 'output'],
  nor: ['not', 'output'],
  xor: ['and', 'or', 'adder'],
  xnor: ['output', 'led'],
  not: ['register', 'output', 'led'],
  buffer: ['output', 'led'],
  register: ['clock', 'constant', 'adder', 'splitter'],
  counter: ['clock', 'splitter', 'led', '7seg', 'output'],
  'shift-register': ['clock', 'constant', 'splitter', 'output'],
  mux: ['input', 'constant'],
  demux: ['output', 'led'],
  decoder: ['led', '7seg'],
  adder: ['register', 'output', 'splitter'],
  subtractor: ['comparator', 'register', 'output'],
  comparator: ['led', 'output'],
  button: ['register', 'counter', 'led'],
  led: [],
  '7seg': ['decoder', 'constant'],
  tunnel: ['tunnel'],
};

/** Returns suggested next-step kinds for the given placed kind. */
export function suggestionsFor(kind: string): readonly string[] {
  // composite:* always suggests output/led (you'll want to observe its result).
  if (kind.startsWith('composite:')) return ['output', 'led', '7seg'];
  return SUGGESTIONS[kind] ?? [];
}

/** Every kind that appears as a key OR as a suggestion target. Used for tests. */
export function referencedKinds(): readonly string[] {
  const set = new Set<string>();
  for (const [k, vs] of Object.entries(SUGGESTIONS)) {
    set.add(k);
    for (const v of vs) set.add(v);
  }
  return [...set];
}
