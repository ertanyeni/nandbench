/**
 * One-paragraph plain-language descriptions per component kind.
 *
 * Shown at the top of the Inspector when a single component is selected.
 * The goal is "what does this do, in concrete behavior terms" — not a
 * formal datasheet, just enough to unstick a student.
 *
 * Keep each entry under ~200 characters; long-form explanations belong in
 * a future docs site, not here.
 */

interface KindHelp {
  readonly title: string;
  readonly description: string;
  /** Optional short truth-table or behavior cheat sheet (lines). */
  readonly cheats?: readonly string[];
}

export const KIND_HELP: Readonly<Record<string, KindHelp>> = {
  /* Wiring */
  input: {
    title: 'Input pin',
    description:
      'A driven source — click it on the canvas to toggle between 0 and 1. Use it to feed external stimulus into your circuit.',
  },
  output: {
    title: 'Output probe',
    description:
      'A passive sink that lets you observe the value on the net. The renderer colors the connected wire by its current value.',
  },
  constant: {
    title: 'Constant',
    description:
      'Drives a fixed literal forever. Set the value as decimal (42) or hexadecimal (0xA). Useful for tying inputs high or low.',
  },
  clock: {
    title: 'Clock',
    description:
      'Free-running 1-bit oscillator — toggles on every tick. Connect to register/counter clock inputs to sequence them.',
  },
  splitter: {
    title: 'Splitter',
    description:
      'Slices a wide bus into N equal-width sub-buses. Reverse direction (combine) is on the roadmap.',
  },
  tunnel: {
    title: 'Tunnel',
    description:
      'Named virtual wire. Every tunnel with the same label (and width) is electrically the same net — useful for clean diagrams.',
  },

  /* Gates */
  and: {
    title: 'AND',
    description: 'Output is 1 only when every input is 1. Otherwise 0. An X bit anywhere taints the output to X.',
    cheats: ['0·0=0', '0·1=0', '1·1=1'],
  },
  or: {
    title: 'OR',
    description: 'Output is 1 if any input is 1. Otherwise 0. A 1 dominates X; 0 + X = X.',
    cheats: ['0+0=0', '0+1=1', '1+1=1'],
  },
  nand: {
    title: 'NAND',
    description: 'AND with the output inverted. Universal gate — every other logic function can be built from NANDs alone.',
  },
  nor: {
    title: 'NOR',
    description: 'OR with the output inverted. Also universal — combine with itself to build any logic.',
  },
  xor: {
    title: 'XOR',
    description: 'Output is 1 iff an odd number of inputs are 1. Carry-free addition of two bits.',
    cheats: ['0⊕0=0', '0⊕1=1', '1⊕1=0'],
  },
  xnor: {
    title: 'XNOR',
    description: 'XOR with the output inverted — equality detector.',
  },
  not: {
    title: 'NOT (inverter)',
    description: 'Flips each input bit. ~X = X (we cannot guess the inverse of an unknown).',
  },
  buffer: {
    title: 'Buffer',
    description: 'Identity gate. Same value, slightly delayed in real silicon — used for fan-out isolation.',
  },

  /* Plexers */
  mux: {
    title: 'Multiplexer',
    description: 'Selects one of N data inputs by the binary value of `sel`. If sel is X/Z, output is X.',
  },
  demux: {
    title: 'Demultiplexer',
    description: 'Routes the single `in` to one of N outputs by `sel`. Unselected outputs go high-impedance (Z).',
  },
  decoder: {
    title: 'Decoder',
    description: 'One-hot: only the output indexed by `sel` is 1; the rest are 0. Useful for address decoding.',
  },

  /* Arithmetic */
  adder: {
    title: 'Binary adder',
    description: 'Computes a + b + cin → s (sum, same width) + cout (carry-out, 1 bit). Wraps modulo 2^width.',
  },
  subtractor: {
    title: 'Binary subtractor',
    description: 'Computes a − b − bin → d (difference) + bout (borrow-out, set when the subtraction underflows).',
  },
  comparator: {
    title: 'Magnitude comparator',
    description: 'Sets exactly one of `lt`, `eq`, `gt` high based on a vs b. Toggle `signed` for two\'s-complement comparison.',
  },

  /* Memory */
  register: {
    title: 'Edge-triggered register',
    description: 'On each clock edge, if `en` is high, latch `d` into the stored value. Otherwise hold. `q` always reflects state.',
  },
  counter: {
    title: 'Up-counter',
    description: 'Increments on each clock edge when `en` is high; `rst` clears to 0. `co` (carry-out) goes high when q is at its max.',
  },
  'shift-register': {
    title: 'Shift register',
    description: 'Shifts in a serial bit on each enabled clock edge; reveals the contents in parallel on `q`.',
  },

  /* I/O */
  button: {
    title: 'Push button',
    description: 'Like an input pin but visually distinct. Click on the canvas to toggle. Default value is 0 (pulled low).',
  },
  led: {
    title: 'LED',
    description: 'A lamp that glows when its input is 1. Pure sink; the renderer reads the net value and lights up accordingly.',
  },
  '7seg': {
    title: '7-segment display',
    description: 'Eight individual 1-bit segment inputs (a..g + dp). Drive each one to light up that segment.',
  },
};

export function helpForKind(kind: string): KindHelp | undefined {
  return KIND_HELP[kind];
}
