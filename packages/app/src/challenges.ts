/**
 * Per-lesson challenge specs. The runner takes the user's current document,
 * compiles it, and drives the named inputs through every case; the outputs
 * must match. Input/output pins are matched by their `params.name`.
 *
 * Empty `cases` means "no challenge attached" — the UI hides the button.
 */

export interface ChallengeCase {
  /** Input values in the order of `inputs`. 0 or 1 for 1-bit pins. */
  readonly in: readonly number[];
  /** Expected output values in the order of `outputs`. */
  readonly out: readonly number[];
  /**
   * Number of clock-edge pulses to fire between `setInput` and reading
   * the outputs. Combinational circuits leave this 0 (default);
   * sequential ones (flip-flop, register, counter) use 1+ to advance
   * the state machine before checking.
   */
  readonly ticks?: number;
}

export interface Challenge {
  /** Pin names (the `name` param) the user must wire as inputs. */
  readonly inputs: readonly string[];
  /** Pin names the runner reads as outputs. */
  readonly outputs: readonly string[];
  readonly cases: readonly ChallengeCase[];
}

export const CHALLENGES: Readonly<Record<string, Challenge>> = {
  gates: {
    inputs: ['A', 'B'],
    outputs: ['Y'],
    cases: [
      { in: [0, 0], out: [0] },
      { in: [0, 1], out: [0] },
      { in: [1, 0], out: [0] },
      { in: [1, 1], out: [1] },
    ],
  },
  'half-adder': {
    inputs: ['A', 'B'],
    outputs: ['sum', 'cout'],
    cases: [
      { in: [0, 0], out: [0, 0] },
      { in: [0, 1], out: [1, 0] },
      { in: [1, 0], out: [1, 0] },
      { in: [1, 1], out: [0, 1] },
    ],
  },
  'full-adder': {
    inputs: ['a', 'b', 'cin'],
    outputs: ['sum', 'cout'],
    cases: [
      { in: [0, 0, 0], out: [0, 0] },
      { in: [0, 0, 1], out: [1, 0] },
      { in: [0, 1, 0], out: [1, 0] },
      { in: [0, 1, 1], out: [0, 1] },
      { in: [1, 0, 0], out: [1, 0] },
      { in: [1, 0, 1], out: [0, 1] },
      { in: [1, 1, 0], out: [0, 1] },
      { in: [1, 1, 1], out: [1, 1] },
    ],
  },
  // Sequential — uses the `ticks` field to pulse the clock once between
  // setInput and snapshot. Walks hold → set → hold → reset → toggle.
  'jk-flip-flop': {
    inputs: ['J', 'K'],
    outputs: ['Q'],
    cases: [
      { in: [0, 0], out: [0], ticks: 1 },
      { in: [1, 0], out: [1], ticks: 1 },
      { in: [0, 0], out: [1], ticks: 1 },
      { in: [0, 1], out: [0], ticks: 1 },
      { in: [1, 1], out: [1], ticks: 1 },
      { in: [1, 1], out: [0], ticks: 1 },
    ],
  },
};

export function challengeFor(lessonId: string): Challenge | null {
  return CHALLENGES[lessonId] ?? null;
}
