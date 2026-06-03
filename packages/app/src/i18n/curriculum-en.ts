/**
 * Lesson content (EN) — the long-form text for every lesson in
 * lessons.ts, plus the unit headers. Pulled out into its own module so
 * the bilingual files stay manageable.
 *
 * Style notes:
 *   - Step text is one sentence per step, ~15–30 words.
 *   - We avoid "you" / "I" except where it reads more naturally.
 *   - When a concept needs a concrete number example, prefer the
 *     smallest illustrative case (2-bit, not 8-bit).
 */
export const CURRICULUM_EN = {
  /* ----- Unit headers ----- */
  'unit.foundations.name': 'Foundations',
  'unit.foundations.summary': 'Bits, number systems, and the boolean algebra you reason with.',
  'unit.gates.name': 'Logic gates',
  'unit.gates.summary': 'Primitive building blocks and how to minimize them with truth tables + K-maps.',
  'unit.combinational.name': 'Combinational circuits',
  'unit.combinational.summary': 'Adders, subtractors, decoders, multiplexers — stateless logic blocks.',
  'unit.sequential.name': 'Sequential elements',
  'unit.sequential.summary': 'Latches, flip-flops, and the timing that turns logic into memory.',
  'unit.registers.name': 'Registers & counters',
  'unit.registers.summary': 'Stacked flip-flops: parallel registers, shift registers, counters.',
  'unit.memory.name': 'Memory',
  'unit.memory.summary': 'ROM, RAM, and how addresses map to storage cells.',
  'unit.fsm.name': 'Finite state machines',
  'unit.fsm.summary': 'Moore vs Mealy, state diagrams, and the recipe to design one from a spec.',
  'unit.datapath.name': 'Datapath & control',
  'unit.datapath.summary': 'ALU, register file, and the wiring that makes a tiny CPU work.',
  'unit.beyond.name': 'Beyond the basics',
  'unit.beyond.summary': 'Hazards, pipelining intuition, and how this app connects to real tooling.',

  /* ===== Unit 1: Foundations ===== */
  'lesson.numberSystems.title': '1.2 Number systems',
  'lesson.numberSystems.summary': 'Binary, octal, hex — why hardware likes powers of two.',
  'lesson.numberSystems.step1':
    'A positional number system writes a value as a sum of digits × base^position. Decimal uses base 10 because we count on ten fingers.',
  'lesson.numberSystems.step2':
    'Digital hardware uses base 2 because a transistor is reliably either on or off. Bits map cleanly to true/false.',
  'lesson.numberSystems.step3':
    'Octal (base 8) and hex (base 16) are shorthand for binary: each octal digit packs 3 bits, each hex digit packs 4 bits.',
  'lesson.numberSystems.step4':
    'Convert 11010110 to hex: split into nibbles → 1101 0110 → D6. To go back: D=1101, 6=0110 → 11010110.',
  'lesson.numberSystems.step5':
    'Open a Constant primitive in the Inspector and try entering 0xD6, 0b11010110, and 214. All three encode the same byte.',

  'lesson.binaryArith.title': '1.3 Binary arithmetic',
  'lesson.binaryArith.summary': 'Adding and subtracting in base 2 — the moves your hardware will mimic.',
  'lesson.binaryArith.step1':
    'Binary addition uses the same rules as decimal: align columns, add digits, carry when the column overflows the base.',
  'lesson.binaryArith.step2':
    'Truth table for one bit: 0+0=0c0, 0+1=1c0, 1+0=1c0, 1+1=0c1. The "c1" is a carry into the next column.',
  'lesson.binaryArith.step3':
    'Multi-bit addition repeats this column by column, propagating the carry. That is exactly what a ripple-carry adder does in silicon.',
  'lesson.binaryArith.step4':
    'Subtraction borrows instead of carries — but hardware avoids two circuits by doing A − B = A + (−B), where −B is the two\'s complement of B.',
  'lesson.binaryArith.step5':
    'Place two 4-bit Constants and an Add component. Set 0b0101 + 0b0011, simulate, and read 0b1000 on the output bus.',

  'lesson.twosComplement.title': "1.4 Two's complement",
  'lesson.twosComplement.summary': 'The signed encoding that lets one adder handle subtraction.',
  'lesson.twosComplement.step1':
    'Two\'s complement represents −N (in N-bit width W) as 2^W − N. Inverting all bits and adding 1 produces the same value.',
  'lesson.twosComplement.step2':
    'The top bit doubles as a sign indicator: 0 means non-negative, 1 means negative. The remaining bits encode magnitude.',
  'lesson.twosComplement.step3':
    'Addition just works: 0101 + 1100 = 0001 (5 + −4 = 1) with the carry-out discarded. Overflow happens when signs disagree with the result.',
  'lesson.twosComplement.step4':
    '4-bit range is −8…+7. For W bits the range is −2^(W−1) to 2^(W−1) − 1 — asymmetric because zero takes one of the non-negative slots.',
  'lesson.twosComplement.step5':
    'Build a 4-bit adder, drive A=0010 (+2) and B=1110 (−2), observe sum=0000 with carry-out=1 (discarded).',

  'lesson.booleanAlgebra.title': '1.5 Boolean algebra',
  'lesson.booleanAlgebra.summary': 'The algebra you use to simplify gate networks.',
  'lesson.booleanAlgebra.step1':
    'Two values, three operators: AND (·), OR (+), NOT (¬). Identities: x·1=x, x+0=x, x·x=x, x+x=x, x·0=0, x+1=1.',
  'lesson.booleanAlgebra.step2':
    'Complement laws: x·¬x=0, x+¬x=1. Double negation: ¬¬x=x. These let you cancel inverter pairs in a circuit.',
  'lesson.booleanAlgebra.step3':
    'Distributivity: x·(y+z) = x·y + x·z. Absorption: x·(x+y)=x. Both shrink expressions before you draw the schematic.',
  'lesson.booleanAlgebra.step4':
    'Example: simplify x + ¬x·y. Distribute: (x + ¬x)·(x + y) = 1·(x + y) = x + y. One fewer gate.',
  'lesson.booleanAlgebra.step5':
    'Write any function as a SOP (sum-of-products) using only the rules above and you have a recipe for building it from AND/OR/NOT alone.',

  'lesson.demorgan.title': "1.6 De Morgan's laws",
  'lesson.demorgan.summary': 'Push negations through AND/OR — the bubble-swap trick.',
  'lesson.demorgan.step1':
    "¬(x·y) = ¬x + ¬y and ¬(x+y) = ¬x·¬y. Negation flips the operator and distributes over the inputs.",
  'lesson.demorgan.step2':
    'Visually: a NAND is the same as an OR with bubbles on the inputs. A NOR is the same as an AND with bubbles on the inputs.',
  'lesson.demorgan.step3':
    'Useful for matching gate availability: if you only have NAND chips, every AND/OR/NOT can be rebuilt by chaining NAND gates.',
  'lesson.demorgan.step4':
    'Try it on the canvas: build x·y with one AND, then rebuild with two NOTs and one NOR. Compare the truth tables.',

  /* ===== Unit 2: Gates ===== */
  'lesson.universalGates.title': '2.2 Universal gates',
  'lesson.universalGates.summary': 'NAND alone (or NOR alone) can build any circuit.',
  'lesson.universalGates.step1':
    'A universal gate is one from which every Boolean function can be implemented. NAND and NOR are both universal.',
  'lesson.universalGates.step2':
    'NOT from NAND: tie both inputs together — NAND(x, x) = ¬(x·x) = ¬x.',
  'lesson.universalGates.step3':
    'AND from NAND: NAND followed by NOT (which is another NAND with tied inputs).',
  'lesson.universalGates.step4':
    'OR from NAND: ¬(¬x·¬y) = x + y. Invert each input with a NAND, then NAND them.',
  'lesson.universalGates.step5':
    'Why does this matter? Fabs can mass-produce a single NAND cell type and still build entire CPUs. Universality is what makes that economical.',

  'lesson.truthTable.title': '2.3 Truth tables',
  'lesson.truthTable.summary': 'The complete specification of a combinational circuit.',
  'lesson.truthTable.step1':
    'A truth table lists every possible input pattern in one column and the matching output in another. For N inputs you get 2^N rows.',
  'lesson.truthTable.step2':
    'Read top-to-bottom: each row is "if inputs are X, output should be Y". The circuit\'s job is to make that mapping happen physically.',
  'lesson.truthTable.step3':
    'Two circuits with identical truth tables are functionally equivalent — they may differ in gate count, but at the IO boundary they behave the same.',
  'lesson.truthTable.step4':
    'Drop an unfamiliar gate on the canvas, toggle every input combination, and write down its truth table. That is reverse engineering 101.',

  'lesson.sopPos.title': '2.4 Sum of products & product of sums',
  'lesson.sopPos.summary': 'Two canonical ways to spell out a Boolean function.',
  'lesson.sopPos.step1':
    'Sum of Products (SOP): OR together AND-terms, one per row of the truth table where the output is 1. Each AND-term is a "minterm".',
  'lesson.sopPos.step2':
    'Product of Sums (POS): AND together OR-terms, one per row where the output is 0. Each OR-term is a "maxterm".',
  'lesson.sopPos.step3':
    'Example: F(a,b) = a XOR b. Output is 1 for (0,1) and (1,0). SOP: ¬a·b + a·¬b. POS: (a+b)·(¬a+¬b).',
  'lesson.sopPos.step4':
    'SOP maps to a 2-level AND-OR network; POS maps to a 2-level OR-AND network. Both are correct; which is smaller depends on the function.',
  'lesson.sopPos.step5':
    'Take any truth table and write the SOP and POS forms. You now have two ready-to-build implementations of the same logic.',

  'lesson.karnaugh.title': '2.5 Karnaugh maps',
  'lesson.karnaugh.summary': 'A visual shortcut for minimizing 2–5 variable functions.',
  'lesson.karnaugh.step1':
    'A K-map is a truth table re-arranged so adjacent cells differ in exactly one variable (Gray code order on the axes).',
  'lesson.karnaugh.step2':
    'Group 1s into rectangles of size 1, 2, 4, 8 cells. Bigger groups eliminate more variables.',
  'lesson.karnaugh.step3':
    'Each group becomes one AND-term in the simplified SOP. The terms are OR\'ed together.',
  'lesson.karnaugh.step4':
    'Don\'t-cares (X in the truth table) can be grouped as 1s if it helps make a bigger rectangle, or left out otherwise.',
  'lesson.karnaugh.step5':
    'Example: F(a,b,c) where F=1 for minterms 1,3,5,7. The K-map shows a single column of four 1s → F = c, one input copy.',
  'lesson.karnaugh.step6':
    'Beyond 4 variables the maps stop being practical — Quine–McCluskey or a synthesizer (Yosys, ABC) takes over.',

  /* ===== Unit 3: Combinational ===== */
  'lesson.rippleAdder.title': '3.3 Ripple-carry adder',
  'lesson.rippleAdder.summary': 'Chain N full-adders to add N-bit numbers.',
  'lesson.rippleAdder.step1':
    'A 4-bit adder is just four full-adders with the carry-out of bit i feeding the carry-in of bit i+1.',
  'lesson.rippleAdder.step2':
    'The lowest full-adder usually gets Cin=0 (unless you want to add 1, as in two\'s complement subtract).',
  'lesson.rippleAdder.step3':
    'Worst-case delay is N × t(full-adder) — the carry has to ripple through every stage. That\'s why carry-lookahead adders exist.',
  'lesson.rippleAdder.step4':
    'In nandbench you can build a 4-bit ripple adder by placing 4 full-adders or by using the Adder primitive with width=4.',
  'lesson.rippleAdder.step5':
    'Drive A=0011 and B=0001 (3+1), simulate, watch the sum settle to 0100 (4) and carry-out=0.',

  'lesson.subtractor.title': '3.4 Subtractor',
  'lesson.subtractor.summary': 'Reuse the adder by inverting B and forcing Cin=1.',
  'lesson.subtractor.step1':
    'A − B = A + (−B) = A + (¬B + 1). The "+1" is supplied by injecting Cin=1 at the lowest bit.',
  'lesson.subtractor.step2':
    'Putting an XOR between each B-input and a control line "sub" lets one block do both: sub=0 → adder, sub=1 → subtractor.',
  'lesson.subtractor.step3':
    'Carry-out interpretation differs: in subtract mode, Cout=0 means "borrow happened" and the result is negative.',
  'lesson.subtractor.step4':
    'Build it: a 4-bit adder, four XORs on the B inputs, sub control wired to all XORs and to Cin. Drive A=0100, B=0001, sub=1 → result 0011 (3).',

  'lesson.comparator.title': '3.5 Comparator',
  'lesson.comparator.summary': 'Detect equal / less / greater between two numbers.',
  'lesson.comparator.step1':
    'Equality: bit-wise XNOR, then AND all the XNOR outputs. If any bit differs the AND drops to 0.',
  'lesson.comparator.step2':
    'Magnitude: subtract A−B (or use a dedicated cell). The sign of the result tells you A<B (negative) or A≥B (non-negative).',
  'lesson.comparator.step3':
    'Cascading: small N-bit comparators chain into larger ones by passing equal/greater/less signals between stages.',
  'lesson.comparator.step4':
    'Use the Comparator primitive: drive A=0110 (6) and B=1001 (9), inspect the lt/eq/gt outputs.',

  'lesson.decoder.title': '3.6 Decoder',
  'lesson.decoder.summary': 'Turn an N-bit address into a 1-of-2^N select line.',
  'lesson.decoder.step1':
    'A 2-to-4 decoder has 2 input bits and 4 output bits. For each input value 0..3 exactly one output goes high.',
  'lesson.decoder.step2':
    'Internally: AND the negated/asserted forms of each input bit. Each output picks a unique minterm.',
  'lesson.decoder.step3':
    'Enable line (E) gates every output — when E=0 all outputs are 0 regardless of inputs.',
  'lesson.decoder.step4':
    'Decoders are everywhere: instruction decode in a CPU, address decode in memory, one-hot encoding in FSMs.',
  'lesson.decoder.step5':
    'Place a Decoder, set N=2, drive inputs through 00→01→10→11 and watch a single output bit chase the input value.',

  'lesson.encoder.title': '3.7 Encoder & priority encoder',
  'lesson.encoder.summary': 'Inverse of a decoder — collapse one-hot into a binary index.',
  'lesson.encoder.step1':
    'A 4-to-2 encoder takes 4 input lines (assumed one-hot) and outputs a 2-bit number identifying which line is high.',
  'lesson.encoder.step2':
    'If more than one input can be 1, you need a priority encoder: it returns the index of the highest-priority active input.',
  'lesson.encoder.step3':
    'A "valid" output is usually added to distinguish "no input is high" from "input 0 is high" — both would otherwise read as 00.',
  'lesson.encoder.step4':
    'Priority encoders are the heart of an interrupt controller: pick the highest-priority pending interrupt to service first.',

  'lesson.mux.title': '3.8 Multiplexer (MUX)',
  'lesson.mux.summary': "An N-to-1 data selector — the circuit's if/else.",
  'lesson.mux.step1':
    'A 2-to-1 MUX has data inputs A, B and select bit S. When S=0 the output is A; when S=1 the output is B.',
  'lesson.mux.step2':
    'Equation: out = ¬S·A + S·B. Build it from one NOT, two ANDs, one OR — or use the MUX primitive.',
  'lesson.mux.step3':
    'A 4-to-1 MUX uses 2 select bits to pick one of 4 data lines. The select width is log₂(N).',
  'lesson.mux.step4':
    'Wide MUXes are how a register file picks which register to read out, and how an ALU picks between add/sub/and/or results.',
  'lesson.mux.step5':
    'Open the MUX 2-to-1 template, toggle S to flip between A and B at the output.',

  'lesson.demux.title': '3.9 Demultiplexer (DEMUX)',
  'lesson.demux.summary': "A 1-to-N data router — the circuit's switch statement.",
  'lesson.demux.step1':
    'A DEMUX takes one data input and routes it to one of N outputs, chosen by the select bits.',
  'lesson.demux.step2':
    'All unselected outputs are 0. This makes a DEMUX look a lot like a decoder with the data line ANDed onto each output.',
  'lesson.demux.step3':
    'Use cases: writing to one of many registers, steering a serial stream into parallel channels.',
  'lesson.demux.step4':
    'A decoder + a 1-bit data input + N ANDs = a DEMUX. Or use the DEMUX primitive directly.',

  'lesson.triState.title': '3.10 Tri-state buffers',
  'lesson.triState.summary': 'A third value — Z — lets many drivers share one wire.',
  'lesson.triState.step1':
    'A tri-state buffer has data, enable, and output. When enable=1 it passes data through; when enable=0 the output is Z (high impedance).',
  'lesson.triState.step2':
    'Z is "not driving" — the wire is electrically free. Another driver can take over without a conflict.',
  'lesson.triState.step3':
    'Two non-Z drivers on the same net produce X (unknown / conflict) — exactly the multi-driver diagnostic the assistant flags.',
  'lesson.triState.step4':
    'Tri-state buffers are how a CPU\'s data bus gets shared: memory drives the bus during reads, the CPU drives it during writes, the rest of the time it sits at Z.',

  /* ===== Unit 4: Sequential ===== */
  'lesson.srLatch.title': '4.1 SR latch',
  'lesson.srLatch.summary': 'The simplest memory cell — two cross-coupled NOR gates.',
  'lesson.srLatch.step1':
    'Two NOR gates feeding back into each other form an SR latch. Inputs are S (set) and R (reset); outputs are Q and ¬Q.',
  'lesson.srLatch.step2':
    'S=1, R=0 → Q latches to 1. S=0, R=1 → Q latches to 0. S=0, R=0 → Q holds its previous value. That is memory.',
  'lesson.srLatch.step3':
    'S=R=1 is the forbidden state — both outputs go to 0, breaking the Q/¬Q invariant. Real designs avoid it.',
  'lesson.srLatch.step4':
    'The SR latch is the foundation: every flip-flop and register on a chip ultimately reduces to feedback loops like this.',
  'lesson.srLatch.step5':
    'Open the SR-latch template. Pulse S=1 → Q=1. Pulse R=1 → Q=0. Notice how the value persists when both inputs go back to 0.',

  'lesson.dLatch.title': '4.2 D latch',
  'lesson.dLatch.summary': 'A clocked SR latch that copies D while enabled.',
  'lesson.dLatch.step1':
    'Add a clock input C and gate S=D·C, R=¬D·C onto an SR latch. Now while C=1 the latch tracks D; while C=0 it holds.',
  'lesson.dLatch.step2':
    'This eliminates the SR forbidden state — you only ever drive one of S or R at a time.',
  'lesson.dLatch.step3':
    'A D latch is "level-sensitive": it copies D throughout the time C is high, not just on a clock edge.',
  'lesson.dLatch.step4':
    'Most designs prefer edge-triggered D flip-flops instead — they capture once per clock cycle, which makes timing analysis tractable.',

  'lesson.dFlipFlop.title': '4.3 D flip-flop',
  'lesson.dFlipFlop.summary': 'Edge-triggered storage — the workhorse of synchronous design.',
  'lesson.dFlipFlop.step1':
    'A D flip-flop samples D at the rising edge of the clock and holds that value until the next rising edge.',
  'lesson.dFlipFlop.step2':
    'Internally: two D latches in series (master-slave), one transparent on C=0 and one on C=1. The result is "edge-triggered".',
  'lesson.dFlipFlop.step3':
    'Setup time: D must be stable before the clock edge. Hold time: D must remain stable a moment after. Violating these gives metastable outputs.',
  'lesson.dFlipFlop.step4':
    'A register of width W is just W D flip-flops sharing one clock.',
  'lesson.dFlipFlop.step5':
    'Place a D-flip-flop, wire D to an input, CLK to the Clock primitive, Q to an LED. Watch Q only change at clock edges.',

  'lesson.jkFlipFlop.title': '4.4 JK flip-flop',
  'lesson.jkFlipFlop.summary': 'Like SR but with the forbidden state replaced by toggle.',
  'lesson.jkFlipFlop.step1':
    'J behaves like S, K like R. The twist: J=K=1 toggles the output on every clock edge (no forbidden state).',
  'lesson.jkFlipFlop.step2':
    'Truth table at clock edge: J=0 K=0 hold; J=0 K=1 reset to 0; J=1 K=0 set to 1; J=1 K=1 toggle.',
  'lesson.jkFlipFlop.step3':
    'JK is convenient for counters — tie J=K=1 and you get a free toggle per clock.',
  'lesson.jkFlipFlop.step4':
    'Modern FPGA libraries usually expose D flip-flops only; JK is easy to build from a D plus a small mux.',

  'lesson.tFlipFlop.title': '4.5 T flip-flop',
  'lesson.tFlipFlop.summary': 'Toggle on every clock edge when T=1, hold when T=0.',
  'lesson.tFlipFlop.step1':
    'Single input T plus a clock. T=1 → Q flips on the edge; T=0 → Q holds.',
  'lesson.tFlipFlop.step2':
    'A T flip-flop is the most natural building block for a ripple counter: chain them with each Q feeding the next clock.',
  'lesson.tFlipFlop.step3':
    'Equivalent circuits: a D flip-flop with D = Q XOR T, or a JK flip-flop with J=K=T.',
  'lesson.tFlipFlop.step4':
    'Try building a 2-bit ripple counter from two T flip-flops, each with T=1, the first clocked by the system clock and the second by the first\'s Q.',

  'lesson.timing.title': '4.7 Timing — setup, hold, and clock period',
  'lesson.timing.summary': 'The numerical contract between flip-flops and combinational logic.',
  'lesson.timing.step1':
    'Setup (t_su): D must be stable t_su before the clock edge. Hold (t_h): D must stay stable t_h after the edge.',
  'lesson.timing.step2':
    'Clock-to-Q (t_cq): how long after the edge before Q reflects the new value.',
  'lesson.timing.step3':
    'A combinational path between two flops must finish faster than (T_clock − t_cq − t_su). Violating it makes the design fail at speed.',
  'lesson.timing.step4':
    'Real chips have an STA (static timing analysis) tool that walks every path and reports the slack. Below zero slack = the clock is too fast.',
  'lesson.timing.step5':
    "nandbench's engine is event-driven, not delay-accurate — so it won't show real timing violations. But the conceptual model still applies.",

  /* ===== Unit 5: Registers / counters ===== */
  'lesson.register.title': '5.1 Parallel-load register',
  'lesson.register.summary': 'W D flip-flops behind one shared clock + enable.',
  'lesson.register.step1':
    'A register stores a W-bit word. On each rising clock edge, if the enable line is high, it latches the input bus into the stored value.',
  'lesson.register.step2':
    'Q outputs are always live. The register holds its value until the next enabled edge.',
  'lesson.register.step3':
    'Reset (synchronous or asynchronous) clears the register on demand — important for predictable startup.',
  'lesson.register.step4':
    'Drop the Register primitive, set width=4, wire a 4-bit Constant to D and the Clock to CLK. Toggle enable and watch Q follow D one clock later.',

  'lesson.shiftRegister.title': '5.2 Shift register',
  'lesson.shiftRegister.summary': 'A register that moves bits sideways every clock.',
  'lesson.shiftRegister.step1':
    'Chain N D flip-flops with each Q feeding the next D. Now data shifts one position per clock.',
  'lesson.shiftRegister.step2':
    'Four variants by IO style: SISO, SIPO, PISO, PIPO (serial/parallel × in/out).',
  'lesson.shiftRegister.step3':
    'Use cases: serializing a parallel word for transmission (PISO), recovering a serial stream into parallel form (SIPO).',
  'lesson.shiftRegister.step4':
    'A shift register can also implement multiplying / dividing by 2 — left shift × 2, right shift ÷ 2 (for unsigned).',
  'lesson.shiftRegister.step5':
    'Place the Shift-register primitive, drive serial-in=1010 over four clocks, observe each Q lighting up as the bit walks down the chain.',

  'lesson.modNCounter.title': '5.4 Modulo-N counter',
  'lesson.modNCounter.summary': 'A counter that wraps at an arbitrary N.',
  'lesson.modNCounter.step1':
    'Plain binary counters wrap at 2^W. A mod-N counter wraps at N instead — useful for clock dividers, BCD digits, lap counters.',
  'lesson.modNCounter.step2':
    'Pattern: compare the counter output to N−1; when equal, force a synchronous reset on the next clock instead of incrementing.',
  'lesson.modNCounter.step3':
    'Example mod-10: a 4-bit counter with a comparator detecting 1001 (9); on the next edge, reset to 0 instead of going to 1010.',
  'lesson.modNCounter.step4':
    'Build it on the canvas: Counter primitive (width 4), Comparator wired to the constant 9, the comparator\'s equal output AND-ed with the next-clock signal to clear the counter.',

  'lesson.ringCounter.title': '5.5 Ring & Johnson counters',
  'lesson.ringCounter.summary': 'Shift registers wired into a loop — one-hot or twisted.',
  'lesson.ringCounter.step1':
    'Ring counter: an N-bit shift register where the last Q feeds back into the first D. The pattern walks around forever.',
  'lesson.ringCounter.step2':
    'Initialized with a single 1 (one-hot), it cycles through N states. Great for sequencing N events without needing a decoder.',
  'lesson.ringCounter.step3':
    'Johnson counter: same idea but the feedback is inverted (¬Q of last → D of first). Gives 2N states from N flip-flops.',
  'lesson.ringCounter.step4':
    'Trade-off: ring counters waste states (N vs 2^N), but each state already comes with one-hot outputs — no decoder needed.',

  /* ===== Unit 6: Memory ===== */
  'lesson.rom.title': '6.1 ROM',
  'lesson.rom.summary': 'Combinational storage — address in, data out.',
  'lesson.rom.step1':
    'A ROM with A address bits and D data bits has 2^A storage rows, each D bits wide. Reads are combinational: change the address, the data follows.',
  'lesson.rom.step2':
    'Internally: a decoder picks one row based on the address; an array of fixed connections (the "program") drives the data outputs.',
  'lesson.rom.step3':
    'ROM is great for lookup tables: trig values, character glyphs, microcode for a CPU\'s control unit, firmware boot code.',
  'lesson.rom.step4':
    'In nandbench, the ROM primitive exposes a data parameter — a hex string that fills the table. Open the ROM-toy template to see one in action.',
  'lesson.rom.step5':
    'Drive the address with a counter and connect the data output to a 7-segment display — instant character ROM demo.',

  'lesson.ram.title': '6.2 RAM',
  'lesson.ram.summary': 'Storage you can also write to — clock-driven.',
  'lesson.ram.step1':
    'RAM has A address bits, D data bits, plus a write-enable (WE) and a clock. Reads are combinational; writes happen on the clock edge.',
  'lesson.ram.step2':
    'Each storage cell is essentially a tiny D flip-flop. Decoders pick the cell, multiplexers route reads, demultiplexers route writes.',
  'lesson.ram.step3':
    'SRAM holds data as long as power is on; DRAM uses a capacitor and needs refresh. The interface is the same for the digital designer.',
  'lesson.ram.step4':
    'On the canvas, the RAM primitive lets you write a value, change the address, write again, then read either back.',
  'lesson.ram.step5':
    'Try it: address 0, data=0xA, WE=1, clock. Then address=1, data=0xB, WE=1, clock. WE=0 and toggle address — read 0xA then 0xB.',

  'lesson.addressDecoding.title': '6.3 Address decoding',
  'lesson.addressDecoding.summary': 'How a single address space maps to many memory + IO chips.',
  'lesson.addressDecoding.step1':
    'A CPU\'s address bus is wide (16/32/64 bits); each peripheral handles a small range. Address decoders pick which chip responds.',
  'lesson.addressDecoding.step2':
    'Pattern: compare the high address bits to a fixed pattern; the chip\'s chip-select line goes high only for matching addresses.',
  'lesson.addressDecoding.step3':
    'When chip-select is low, the device\'s data output is tri-stated (Z) so the bus stays free for other devices.',
  'lesson.addressDecoding.step4':
    'Modern systems-on-chip do this with a full interconnect (AXI, Wishbone), but the underlying idea is still "decode high bits → enable target".',

  /* ===== Unit 7: FSM ===== */
  'lesson.fsmIntro.title': '7.1 Finite state machines',
  'lesson.fsmIntro.summary': 'Sequencers, controllers, protocols — all FSMs underneath.',
  'lesson.fsmIntro.step1':
    'An FSM has finite states, transitions between them triggered by inputs, and outputs that depend on the state (and maybe the inputs).',
  'lesson.fsmIntro.step2':
    'Hardware-wise: a register stores the current state, combinational logic computes (next-state, output) from (state, inputs).',
  'lesson.fsmIntro.step3':
    'Drawn as a directed graph: nodes are states, edges are transitions labeled with the input condition.',
  'lesson.fsmIntro.step4':
    'Almost every controller in digital design is an FSM: traffic lights, vending machines, UART receivers, CPU control units.',
  'lesson.fsmIntro.step5':
    'Open the FSM-toy template. It shows a 3-state machine with one input, one output, and a state register.',

  'lesson.mooreMealy.title': '7.2 Moore vs Mealy',
  'lesson.mooreMealy.summary': 'Two ways to wire outputs into a state machine.',
  'lesson.mooreMealy.step1':
    'Moore: outputs depend only on the current state. Simple, glitch-free, one extra clock cycle of latency.',
  'lesson.mooreMealy.step2':
    'Mealy: outputs depend on the current state AND the current inputs. Fewer states, but outputs may glitch with input changes.',
  'lesson.mooreMealy.step3':
    'Drawn differently: Moore labels outputs on states, Mealy labels outputs on transition arcs.',
  'lesson.mooreMealy.step4':
    'In practice you often hybridize — a Moore base for predictability, with a Mealy override for one specific pipeline-saving transition.',
  'lesson.mooreMealy.step5':
    'Sketch both for a sequence-detector finding "101". Moore needs an extra state; Mealy fires the output during the final transition.',

  'lesson.fsmDesign.title': '7.3 Designing an FSM from a spec',
  'lesson.fsmDesign.summary': 'A repeatable recipe — spec → states → wires.',
  'lesson.fsmDesign.step1':
    '1. List the observable behaviors (sequences of inputs and the matching outputs).',
  'lesson.fsmDesign.step2':
    '2. Identify states — each "situation the system can be in" is one state. Name them, draw the diagram, label transitions.',
  'lesson.fsmDesign.step3':
    '3. Build the state table: rows are (state, input), columns are (next state, output).',
  'lesson.fsmDesign.step4':
    '4. Encode states as bit patterns (binary, gray, one-hot — pick based on size and timing needs).',
  'lesson.fsmDesign.step5':
    '5. Derive next-state and output logic from the encoded table — use K-maps for small tables or a synthesizer for larger ones.',
  'lesson.fsmDesign.step6':
    '6. Build: a state register + the combinational blocks from step 5. Always include a reset path to a known starting state.',

  'lesson.stateEncoding.title': '7.4 State encoding',
  'lesson.stateEncoding.summary': 'Pick the bit pattern your states wear into the silicon.',
  'lesson.stateEncoding.step1':
    'Binary encoding: log₂(N) bits for N states. Most compact, but next-state logic can be tangled.',
  'lesson.stateEncoding.step2':
    'One-hot encoding: N bits for N states, exactly one always high. More flops, but next-state and output equations get dramatically simpler.',
  'lesson.stateEncoding.step3':
    'Gray code: adjacent states differ in one bit. Reduces glitching when the state register is read by asynchronous logic.',
  'lesson.stateEncoding.step4':
    'FPGAs are flip-flop-rich, so one-hot is often the default for moderate state counts (≤32). ASICs lean toward dense binary to save area.',

  /* ===== Unit 8: Datapath ===== */
  'lesson.alu.title': '8.1 ALU — arithmetic logic unit',
  'lesson.alu.summary': 'The MUX-fronted block that does add / sub / and / or / xor on demand.',
  'lesson.alu.step1':
    'An ALU has two data inputs (A, B), one operation select (ALUop), and one result output plus flags (zero, carry, overflow).',
  'lesson.alu.step2':
    'Internally: every operation computes in parallel (adder, AND, OR, …). A multiplexer picks the right one based on ALUop.',
  'lesson.alu.step3':
    'Add/subtract uses the trick from lesson 3.4: an XOR on B inverts it conditionally; the adder\'s Cin is forced to 1 to add the +1.',
  'lesson.alu.step4':
    'Modern ALUs also have shifters (logical, arithmetic, rotate). All of these are picked by extra ALUop bits.',
  'lesson.alu.step5':
    'Open the ALU-skeleton template. Drive A and B, sweep ALUop through its values, and read the result + flags.',

  'lesson.registerFile.title': '8.2 Register file',
  'lesson.registerFile.summary': 'An array of registers with two read ports and one write port.',
  'lesson.registerFile.step1':
    'A register file lets you address one of N registers (typically 8, 16, or 32 in a small CPU) by index.',
  'lesson.registerFile.step2':
    'Read ports are combinational: a MUX selects which register\'s Q drives the read bus. CPUs usually expose two reads for "read a + read b in parallel".',
  'lesson.registerFile.step3':
    'Write port is clocked: address picks the destination, write-enable plus a clock edge stores the input data into that register.',
  'lesson.registerFile.step4':
    'Convention: register 0 hard-wired to zero. Frees the encoding for a "subtract from zero" trick without a real flop.',
  'lesson.registerFile.step5':
    'Open the Register-file template, write a value to address 3, then read it back via either read port.',

  'lesson.datapathIntro.title': '8.3 Single-cycle datapath',
  'lesson.datapathIntro.summary': 'PC → memory → register file → ALU → register file, in one clock.',
  'lesson.datapathIntro.step1':
    'The datapath wires together: program counter (PC), instruction memory, register file, ALU, data memory, and write-back MUX.',
  'lesson.datapathIntro.step2':
    'Each clock cycle: fetch the instruction from address PC, decode it, read source registers, execute via the ALU, optionally read/write data memory, write back to the register file.',
  'lesson.datapathIntro.step3':
    'PC update: usually PC+4 for sequential, or PC+offset for taken branches. A MUX picks based on the branch result.',
  'lesson.datapathIntro.step4':
    "Single-cycle is conceptually simple but slow — the clock period is set by the longest path through every stage in series. That's why pipelining was invented.",
  'lesson.datapathIntro.step5':
    'Sketch the datapath on paper before you wire it up; label every MUX\'s control signal. The control unit (next lesson) supplies those signals.',

  'lesson.controlUnit.title': '8.4 Control unit',
  'lesson.controlUnit.summary': 'Decode the instruction, produce every control signal the datapath needs.',
  'lesson.controlUnit.step1':
    'The control unit takes the instruction opcode (and sometimes function bits) and outputs a vector of signals: ALUop, RegWrite, MemRead, MemWrite, Branch, …',
  'lesson.controlUnit.step2':
    'Hardwired control: a ROM/PLA encodes opcode → signal vector. Fast but rigid; changing the ISA means rebuilding the table.',
  'lesson.controlUnit.step3':
    'Microcoded control: the opcode indexes into a microprogram ROM that issues a sequence of micro-instructions. Slower but easier to evolve.',
  'lesson.controlUnit.step4':
    'Both can be implemented in nandbench using ROM + a small FSM for sequencing. The ROM holds the control word table.',
  'lesson.controlUnit.step5':
    'Connect this to the datapath from the previous lesson — opcode in, control signals out, and you have a tiny working CPU.',

  /* ===== Unit 9: Beyond ===== */
  'lesson.hazards.title': '9.1 Static & dynamic hazards',
  'lesson.hazards.summary': 'Why combinational outputs can flicker on input change.',
  'lesson.hazards.step1':
    'A static hazard: when an input change causes the output to glitch (briefly take the wrong value) even though the output should be stable.',
  'lesson.hazards.step2':
    'Caused by uneven gate delays — two paths to the output settle at different times, and the gap is the glitch.',
  'lesson.hazards.step3':
    'Fix: add a "consensus" / redundant term that keeps the output stable across the transition. K-maps make these jump out as overlapping groups.',
  'lesson.hazards.step4':
    'Synchronous design sidesteps hazards mostly by sampling outputs only at clock edges — by then any glitches have settled.',

  'lesson.pipeline.title': '9.2 Pipelining basics',
  'lesson.pipeline.summary': 'Overlap instructions to raise throughput without raising the clock.',
  'lesson.pipeline.step1':
    'Slice the single-cycle datapath into stages (IF, ID, EX, MEM, WB) separated by registers. Each cycle each stage works on a different instruction.',
  'lesson.pipeline.step2':
    'Per-instruction latency is the same, but throughput rises ~5× because five instructions are in flight at once.',
  'lesson.pipeline.step3':
    'New problems: data hazards (later instruction reads a register the earlier one hasn\'t written yet), control hazards (branch direction unknown at fetch).',
  'lesson.pipeline.step4':
    'Solutions: forwarding paths, branch prediction, pipeline stalls. Beyond this course\'s scope, but the FSM/datapath foundation here is exactly what you build on.',

  'lesson.tooling.title': '9.3 Where to go from here',
  'lesson.tooling.summary': 'Yosys, Icarus, FPGAs — nandbench as a stepping stone.',
  'lesson.tooling.step1':
    'nandbench can export a structural Verilog netlist plus a self-checking testbench (Toolbar → menu → Export). Open it with any Verilog simulator.',
  'lesson.tooling.step2':
    'Icarus Verilog (iverilog) compiles and runs the testbench from the command line. Yosys synthesizes the same Verilog into an FPGA-ready netlist.',
  'lesson.tooling.step3':
    'For a real FPGA flow try the Lattice iCE40 + the open-source Yosys → nextpnr → icestorm toolchain. Free, end-to-end.',
  'lesson.tooling.step4':
    'Bigger picture: digital logic is the foundation under microarchitecture, then under operating systems, then under everything you use daily. This was the bedrock.',
} as const;
