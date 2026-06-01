/**
 * English (default) translations. Keys are dot-paths grouped by surface.
 * Keep entries flat and short — substitution uses `{name}` placeholders.
 */
import { CURRICULUM_EN } from './curriculum-en.js';

export const EN = {
  ...CURRICULUM_EN,
  /* Toolbar buttons & tooltips */
  'toolbar.undo': 'Undo (⌘Z)',
  'toolbar.redo': 'Redo (⇧⌘Z)',
  'toolbar.zoomOut': 'Zoom out',
  'toolbar.zoomIn': 'Zoom in',
  'toolbar.resetView': 'Reset view',
  'toolbar.play': 'Play (Space)',
  'toolbar.pause': 'Pause (Space)',
  'toolbar.step': 'Single step',
  'toolbar.resetSim': 'Reset',
  'toolbar.reset': 'reset',
  'toolbar.resetLong': 'Fit View',
  'toolbar.assistantLong': 'AI Assistant',
  'toolbar.lessonsLong': 'Lessons',
  'toolbar.newCircuitLong': 'New Circuit',
  'toolbar.componentsLong': 'Components',
  'toolbar.saveAsComposite': 'Save current circuit as composite',
  'toolbar.saveLabel': 'save⋯',
  'toolbar.export': 'export',
  'toolbar.exportTooltip': 'Download as JSON',
  'toolbar.import': 'import',
  'toolbar.importTooltip': 'Load JSON file',
  'toolbar.newCircuit': 'new',
  'toolbar.newCircuitTooltip': 'Start a new circuit from a template',
  'toolbar.tickRate': 'Tick rate',
  'toolbar.localeTooltip': 'Language',

  /* Palette */
  'palette.title': 'Components',
  'palette.categories.wiring': 'Wiring',
  'palette.categories.gates': 'Gates',
  'palette.categories.plexers': 'Plexers',
  'palette.categories.arithmetic': 'Arithmetic',
  'palette.categories.memory': 'Memory',
  'palette.categories.io': 'I/O',
  'palette.categories.library': 'Library',
  'palette.instructions':
    'Click an item, then click the canvas to place. Click a pin to start a wire; click another pin to commit. Esc cancels.',
  'palette.suggestion.tooltip': 'Suggested next step',
  'palette.libraryDeleteConfirm': 'Delete "{name}" from the library?',
  'palette.libraryEmptyHint':
    'No saved components yet.\nSave a tab → it lands here.',

  /* Palette item hints (one per kind) */
  'hint.input': 'Input pin',
  'hint.output': 'Output probe',
  'hint.constant': 'Literal source',
  'hint.clock': 'Clock source',
  'hint.splitter': 'Bus → sub-buses',
  'hint.tunnel': 'Named virtual wire',
  'hint.not': 'Inverter',
  'hint.buffer': 'Pass-through',
  'hint.and': '2-input AND',
  'hint.or': '2-input OR',
  'hint.nand': '2-input NAND',
  'hint.nor': '2-input NOR',
  'hint.xor': '2-input XOR',
  'hint.xnor': '2-input XNOR',
  'hint.mux': '2:1 multiplexer',
  'hint.demux': '1:2 demultiplexer',
  'hint.decoder': '2→4 one-hot',
  'hint.adder': '1-bit adder + carry',
  'hint.subtractor': '1-bit subtractor',
  'hint.comparator': '1-bit comparator',
  'hint.register': 'Edge-triggered register',
  'hint.counter': 'Up-counter',
  'hint.shiftRegister': 'Shift register',
  'hint.button': 'Push button',
  'hint.led': 'Indicator lamp',
  'hint.sevenSeg': '7-segment display',
  'hint.probe': 'Read-only display',
  'hint.power': 'Constant high source',
  'hint.ground': 'Constant low source',
  'hint.bitExtender': 'Zero/one/sign extend',
  'hint.oddParity': 'XOR of all inputs',
  'hint.evenParity': 'XNOR of all inputs',
  'hint.controlledBuffer': 'Tri-state buffer',
  'hint.controlledInverter': 'Tri-state inverter',
  'hint.priorityEncoder': 'Highest-set index',
  'hint.bitSelector': 'Read bit[sel] of bus',
  'hint.multiplier': 'N×N → 2N result',
  'hint.divider': 'Quotient + remainder',
  'hint.negator': "Two's-complement -in",
  'hint.absolute': 'Absolute value',
  'hint.minMax': 'min(a,b) and max(a,b)',
  'hint.shifter': 'Barrel shifter L/R',
  'hint.bitAdder': 'Count of 1-bits',
  'hint.bitFinder': 'Lowest/highest set bit',
  'hint.pullResistor': 'Pull-up / pull-down source',
  'hint.por': 'Power-on reset pulse',
  'hint.exponentiator': 'Modular a^b',
  'hint.squareRoot': 'Integer floor √in',
  'hint.ram': 'Sync read/write memory',
  'hint.rom': 'Read-only data table',
  'hint.dFlipFlop': 'D flip-flop (q := d on edge)',
  'hint.tFlipFlop': 'T flip-flop (toggle on edge)',
  'hint.jkFlipFlop': 'JK flip-flop (universal)',
  'hint.srFlipFlop': 'SR flip-flop (set/reset)',

  /* Tabs */
  'tabs.newShort': 'New',
  'tabs.newTooltip': 'New tab (⌘T)',
  'tabs.closeTooltip': 'Close tab (⌘W)',
  'tabs.publishTooltip': 'Save this tab as a reusable component in your library — drop it into other tabs like any built-in part',
  'tabs.publishLabel': 'Save as Component',
  'tabs.closeConfirm': 'Close "{name}"? Its undo history will be discarded.',
  'tabs.closeConfirmDirty': 'Close "{name}"? It has unsaved changes and the undo history will be discarded.',
  'tabs.closeConfirmLibrary': 'Close "{name}"? Edits sync back to the library, but the undo history will be discarded.',
  'tabs.overflowTooltip': 'All tabs',

  /* Folder persistence */
  'toolbar.folderSave': 'save to folder',
  'toolbar.folderSaveTooltip': 'Save the project as a folder of JSON files',
  'toolbar.folderOpen': 'open folder',
  'toolbar.folderOpenTooltip': 'Open a project folder',
  'toolbar.moreTooltip': 'More actions',
  'toolbar.menuSearchPlaceholder': 'Search actions…',
  'toolbar.menuNoMatch': 'No matching action.',
  'quickopen.title': 'Quick open',
  'quickopen.placeholder': 'Place a component, open a lesson, run an action…',
  'quickopen.empty': 'No matches.',
  'quickopen.libraryHint': 'saved sub-circuit',
  'quickopen.lessonHint': 'open lessons',
  'quickopen.actionHint': 'action',
  'toolbar.exportVerilog': 'export as Verilog…',
  'verilog.title': 'Export Verilog',
  'verilog.subtitle':
    'Generate a synthesizable Verilog module for the current tab. Optionally bundle a self-checking testbench built from any lesson\'s challenge spec — runs with Icarus (iverilog) out of the box.',
  'verilog.moduleName': 'Module name',
  'verilog.includeTb': 'Include a testbench (combined .v)',
  'verilog.tbLessonSource': 'Testbench source (lesson challenge)',
  'verilog.tbPickLesson': '— select a lesson —',
  'verilog.tbHint':
    'The selected lesson must have a challenge spec. The testbench drives every truth-table case and reports pass/fail counts.',
  'verilog.cancel': 'Cancel',
  'verilog.download': 'Download',
  /* Cloud sync */
  'toolbar.cloud': 'cloud…',
  'toolbar.cloudTooltip': 'Save or open from the cloud',
  'cloud.title': 'Cloud',
  'cloud.subtitle':
    'Save this circuit to the gatecraft server so you can come back to it from any browser. Anyone with the share link can view it; only you (or anyone with the edit link) can change it.',
  'cloud.signedInAs': 'Signed in as {email}',
  'cloud.signOut': 'Sign out',
  'cloud.anonymous': 'Anonymous — saves work but are tied to this browser.',
  'cloud.signIn': 'Sign in with email',
  'cloud.emailPlaceholder': 'you@example.com',
  'cloud.sendLink': 'Email me a sign-in link',
  'cloud.linkSent': 'Check your inbox — the link expires in 15 minutes.',
  'cloud.saveCurrent': 'Save this circuit to the cloud',
  'cloud.saveAgain': 'Update cloud copy',
  'cloud.lastSync': 'Last synced {when}',
  'cloud.public': 'Anyone with the link can view',
  'cloud.copyLink': 'Copy share link',
  'cloud.linkCopied': 'Share link copied',
  'cloud.claim': 'Attach this circuit to my account',
  'cloud.myCircuits': 'My circuits',
  'cloud.loadCircuit': 'Open',
  'cloud.noCircuits': 'No saved circuits yet.',
  'cloud.unbind': 'Detach from cloud (keep locally)',
  'cloud.errorGeneric': 'Cloud request failed. Check the API is reachable.',
  'toolbar.publishTab': 'save tab as component',
  'toolbar.publishedToast': 'Published "{name}" to the library (id {id}…). Other tabs can now drop it from the Library section of the palette; edits here auto-sync.',
  'toolbar.llmSettings': 'AI provider…',
  'llm.title': 'AI provider (optional)',
  'llm.subtitle': 'Bring your own LLM. Endpoint, token, and model stay in your browser — gatecraft never sees them. Default rule-based assistant keeps working with this disabled.',
  'llm.endpoint': 'Endpoint URL',
  'llm.token': 'Bearer token',
  'llm.model': 'Model name',
  'llm.disable': 'Disable',
  'llm.cancel': 'Cancel',
  'llm.save': 'Save',
  'assistant.action.askLlm': '✦ Ask LLM',
  'assistant.action.askLlmLoading': '✦ Thinking…',
  'toolbar.colorModeDefault': 'use default colors',
  'toolbar.colorModeDeuteranopia': 'use color-blind palette',
  'toolbar.snapEnable': 'enable snap-to-grid',
  'toolbar.snapDisable': 'disable snap-to-grid',
  'toolbar.waveform': 'waveform viewer',
  'toolbar.history': 'history inspector',
  'history.title': 'History',
  'history.subtitle': 'Click any step to jump to that point in time.',
  'history.past': 'past',
  'history.future': 'future',
  'history.now': 'you are here',
  'contextMenu.deleteWires': 'Delete {n} wire(s)',
  'contextMenu.deleteComponents': 'Delete {n} component(s)',
  'waveform.title': 'Waveform',
  'waveform.empty': 'Select a component to capture its outputs',
  'waveform.signals': 'signals',
  'waveform.clear': 'clear',
  'waveform.refresh': 'fetch history',
  'waveform.refreshTooltip': 'Pull the last 512 ticks from the simulator',
  'toolbar.components': 'components',
  'toolbar.componentsTooltip': 'Show / hide the components palette',
  'palette.searchPlaceholder': 'Search components…',

  /* Inspector */
  'inspector.noEditableParams': 'No editable parameters for this kind.',
  'inspector.multiSelected': '{n} components selected',
  'inspector.multiSelectedHint':
    "Multi-selection editing isn't supported yet — pick a single component to edit its parameters.",
  'inspector.driveValue': 'Drive value',
  'inspector.driveValueMultiBit': 'Drive value ({width}-bit)',
  'inspector.driveValueHigh': '1 (high) — click to flip',
  'inspector.driveValueLow': '0 (low) — click to flip',
  'inspector.driveValuePlaceholder': '0xA or 42',
  'inspector.liveValues': 'Live values',
  'inspector.internalState': 'Internal state',
  'inspector.connections': 'Connections',
  'inspector.noConnections': 'No incident wires.',
  'inspector.connectionClickHint': 'Click to focus the other end on the canvas',
  'inspector.tab.live': 'Live',
  'inspector.tab.params': 'Params',
  'inspector.tab.connections': 'Connections',
  'inspector.labelField': 'Display label',
  'inspector.labelPlaceholder': 'e.g. ALUOp, addr_lo, ready',
  'inspector.noLabelParamsHint': 'No other editable params.',
  'inspector.fanout': '{n} fan-out',
  'inspector.stateUnavailable': 'State pending — start sim or step once.',
  'inspector.fieldErrors.empty': 'Empty',
  'inspector.fieldErrors.badLiteral': 'Bad literal',
  'inspector.fieldErrors.notNumber': 'Not a number',
  'inspector.fieldErrors.min': 'Min {min}',
  'inspector.fieldErrors.max': 'Max {max}',
  'inspector.fieldErrors.options': 'Must be one of: {options}',
  'inspector.fieldErrors.literal': 'Invalid literal (use decimal or 0xHEX)',

  /* Param field labels (overrides param-schema defaults) */
  'param.width': 'Width (bits)',
  'param.inputs': 'Inputs',
  'param.outputs': 'Outputs',
  'param.selectBits': 'Select bits',
  'param.value': 'Value (decimal or 0xHEX)',
  'param.fanout': 'Fanout',
  'param.label': 'Label',
  'param.signed': 'Signed',
  'param.direction': 'Direction',
  'param.color': 'Color',
  'param.name': 'Name',
  'param.inWidth': 'Input width',
  'param.outWidth': 'Output width',
  'param.extendMode': 'Extend mode',
  'param.group': 'Group',
  'param.arithmetic': 'Arithmetic',
  'param.addrBits': 'Address bits',
  'param.romData': 'Data (space-separated hex)',
  'inspector.memorySection': 'Memory',
  'inspector.memoryPageInfo': '{from}–{to} / {total}',
  'inspector.compositeSection': 'Composite source',
  'inspector.compositeEdit': 'Edit in tab',
  'inspector.compositeMissing': 'Library entry missing — composite cannot be edited.',
  'diagnostics.target.compositeCycle': 'Composite cycle',
  'diagnostics.detail.compositeCycle': 'A composite references itself: {chain}',
  'diagnostics.target.compositeDepth': 'Composite too deep',
  'diagnostics.detail.compositeDepth': 'Nesting depth {depth} exceeds the limit',

  /* ---------------- Assistant (rule-based AI) ---------------- */
  'assistant.title': 'Assistant',
  'assistant.subtitle': 'Educational hints based on your circuit.',
  'assistant.empty': 'Nothing to suggest right now — keep building.',
  'toolbar.assistant': 'assistant',
  'toolbar.assistantTooltip': 'Open the rule-based assistant',
  'toolbar.assistantTooltipWithDiag': 'Assistant has {n} new diagnostic(s) — click to read',
  'assistant.close': 'Close',
  'assistant.section.onboarding': 'Get started',
  'assistant.section.nextStep': 'Next step',
  'assistant.section.diagnostic': 'Diagnostics',
  'assistant.section.pattern': 'Pattern',
  'assistant.section.concept': 'Concept',
  'assistant.section.quality': 'Refinement',
  'assistant.curriculum.next.title': 'Continue: {lesson}',
  'assistant.curriculum.next.body':
    'Pick up where you left off. The Lessons panel keeps track of which short walkthroughs you\'ve opened so you can see the full ladder at a glance.',
  'assistant.curriculum.graduated.title': 'You\'ve completed every lesson 🎉',
  'assistant.curriculum.graduated.body':
    'Time to build something of your own. Try the templates that go beyond the lessons (FSM toy, register file, ALU skeleton), or save your favourite sub-circuit to the library and reuse it.',

  /* CTAs */
  'assistant.action.openGlossary': 'Open glossary',
  'assistant.action.openGlossaryZ': 'What is Z?',
  'assistant.action.openLesson': 'Open lesson',
  'assistant.action.openLessons': 'Open lessons',
  'assistant.action.openTemplate': 'Open template',
  'assistant.action.openLessonClock': 'Lesson: clock & register',
  'assistant.action.openHalfAdder': 'Open half-adder',
  'assistant.action.startTour': 'Start the tour',
  'assistant.action.placeAnd': 'Place AND',
  'assistant.action.placeOr': 'Place OR',
  'assistant.action.placeNot': 'Place NOT',
  'assistant.action.placeInput': 'Place IN',
  'assistant.action.placeButton': 'Place BTN',
  'assistant.action.placeOutput': 'Place OUT',
  'assistant.action.placeLed': 'Place LED',
  'assistant.action.placeConstant': 'Place CONST',
  'assistant.action.placeTunnel': 'Place tunnel',
  'assistant.action.placeSevenSeg': 'Place 7-SEG',
  'assistant.action.placeSplitter': 'Place SPLIT',
  'assistant.action.placeRegister': 'Place register',
  'assistant.action.placeControlledBuffer': 'Place tri-state buffer',

  /* Next-step + onboarding cards */
  'assistant.next.empty.title': 'Welcome — start anywhere',
  'assistant.next.empty.body':
    'A blank canvas can be intimidating. Three quick options: take the 5-step tour to learn the editor, browse the lesson library for a guided walkthrough, or open the half-adder template and reverse-engineer it.',
  'assistant.next.inputOnly.title': 'You have inputs — now combine them with a gate',
  'assistant.next.inputOnly.body':
    'An input by itself just drives a wire. Add a logic gate (AND / OR / NOT) and wire your inputs into it to start producing meaningful results.',
  'assistant.next.needsInput.title': 'Your gate is waiting for an input',
  'assistant.next.needsInput.body':
    'Gates compute on bits that have to come from somewhere. Place an IN pin (click-toggle source), a BTN (momentary), or a CONST (literal value) and wire it into the gate input.',
  'assistant.next.needsOutput.title': 'Add a probe so you can see the result',
  'assistant.next.needsOutput.body':
    'You can already simulate, but without an OUT pin or LED you can\'t observe the result. Drop one on the canvas, wire it from your gate\'s output, and press play.',
  'assistant.next.noWires.title': 'Components placed, but no wires yet',
  'assistant.next.noWires.body':
    'Click on a pin to start a wire, then click on another pin to commit it. The Inspector at the bottom-left will show live values once everything is connected.',
  'assistant.next.readyToRun.title': 'Looks clean — press Play',
  'assistant.next.readyToRun.body':
    'Your circuit compiles with no diagnostics and has both inputs and outputs wired up. Hit ▶ in the toolbar to watch signals propagate, then click an input to toggle it.',

  /* Diagnostic cards */
  'assistant.diag.widthMismatch.title': 'Width mismatch ({n})',
  'assistant.diag.widthMismatch.body':
    'A wire connects two ports with different bit widths. The engine refuses to silently truncate or extend — every net has a single width. Fix it by setting the component params so both sides agree, or by inserting an EXT (bit-extender) to widen the narrow side.',
  'assistant.diag.multiDriver.title': 'Multi-driver conflict ({n})',
  'assistant.diag.multiDriver.body':
    'Two or more outputs are pushing values onto the same net. Resolution rule: any bit driven both 0 and 1 becomes X (unknown). The classic fix is a multiplexer (MUX) that picks one driver, or a tri-state buffer (CBUF) that turns drivers Z when not selected so they don\'t fight.',
  'assistant.diag.oscillation.title': 'Combinational oscillation',
  'assistant.diag.oscillation.body':
    'A signal feeds back into itself without a memory element, so the simulator keeps flipping values and never settles. Real circuits would burn power and behave unpredictably. Break the loop with a register or a flip-flop so the feedback path crosses a clock edge.',
  'assistant.diag.floatingInput.title': 'Floating input ({n})',
  'assistant.diag.floatingInput.body':
    'An input port is connected to a net that nobody drives — its value is Z (high impedance). Downstream gates that read Z produce X. Drive the net with an IN pin, a CONST, or another component\'s output.',
  'assistant.diag.compositeCycle.title': 'Composite reference cycle',
  'assistant.diag.compositeCycle.body':
    'A saved composite references itself, directly or through a chain. The engine refuses to flatten an infinite circuit. Edit one of the composites in the chain and remove the self-reference.',
  'assistant.diag.compositeDepth.title': 'Composite nesting too deep',
  'assistant.diag.compositeDepth.body':
    'Composites are nested more than 32 levels — usually a mistake. Collapse some intermediate layers, or store the deeply-nested block as a single composite at the top level.',
  'assistant.diag.reassure.title': '{n} diagnostics — not all are errors',
  'assistant.diag.reassure.body':
    'Diagnostics are gatecraft\'s live feedback. Half-built circuits naturally have floating inputs while you\'re wiring them. The ones to fix urgently are multi-driver and oscillation — those mean something is contradicting itself.',

  /* Pattern cards */
  'assistant.pattern.halfAdder.title': 'Looks like a half-adder',
  'assistant.pattern.halfAdder.body':
    'XOR + AND on two single-bit inputs is the classic half-adder shape. Sum = A XOR B; Carry = A AND B. Open the template to compare your wiring against the reference and complete the truth table 00→00, 01→10, 10→10, 11→01.',
  'assistant.pattern.fullAdder.title': 'Looks like a full-adder',
  'assistant.pattern.fullAdder.body':
    'Two XORs, two ANDs, and an OR is a full-adder: it accepts a carry-in so you can stack them for multi-bit addition. Each column = half-adder(a, b) + half-adder(s1, cin); the two carries OR together.',
  'assistant.pattern.srLatch.title': 'Looks like an SR latch',
  'assistant.pattern.srLatch.body':
    'A pair of cross-coupled NOR (or NAND) gates is the SR latch — the fundamental 1-bit memory cell. S=1 sets Q, R=1 resets Q, S=R=1 is invalid (poison). Wire each gate\'s output to the other gate\'s input to close the loop.',
  'assistant.pattern.clockRegister.title': 'Clock + register — sequential land',
  'assistant.pattern.clockRegister.body':
    'A clock combined with a storage element creates state — your circuit can now remember between ticks. Watch the rising-edge semantics: the register captures `d` only when the clock transitions 0→1.',
  'assistant.pattern.counterDisplay.title': 'Counter + bus → LEDs',
  'assistant.pattern.counterDisplay.body':
    'Counter outputs a wide bus, splitter slices it into single bits, each bit drives one LED — instant binary readout. Slow the clock with the Hz slider to watch the count tick up.',
  'assistant.pattern.rippleCarry.title': '{n} adders — ripple-carry chain',
  'assistant.pattern.rippleCarry.body':
    'Several 1-bit adders in a row is a ripple-carry adder: each carry-out feeds the next column\'s carry-in. Educationally perfect, but watch the propagation delay — adding N-bit numbers takes N gate delays. Faster alternatives: carry-lookahead, carry-select.',
  'assistant.pattern.fsm.title': 'Looks like a finite-state machine',
  'assistant.pattern.fsm.body':
    'Two or more flip-flops fed by a multiplexer (or combinational logic) form a Moore/Mealy FSM. Encode states as bits in the flip-flops, route next-state through a mux based on inputs. Outputs are either a function of state alone (Moore) or state + input (Mealy).',
  'assistant.pattern.alu.title': 'ALU skeleton',
  'assistant.pattern.alu.body':
    'Add/sub units + a multiplexer to pick the operation + a comparator for branch flags — that\'s the spine of an ALU. Real designs add logic ops (AND/OR/XOR), shifter, and overflow detection on top, but this is the canonical starting point.',
  'assistant.pattern.decoderDisplay.title': 'Decoder + 7-segment',
  'assistant.pattern.decoderDisplay.body':
    'A decoder maps a binary input to a one-hot vector; the 7-segment displays the corresponding glyph. The classic "binary-to-decimal" cookbook circuit. Try counting 0–9 with a counter feeding the decoder.',
  'assistant.pattern.edgeDetector.title': 'Edge detector',
  'assistant.pattern.edgeDetector.body':
    'A flip-flop delays a signal by one tick; XOR\'ing the delayed and live versions produces a one-tick pulse whenever the input changes. Essential building block for button debounce, synchronisers, and clock-domain crossings.',

  /* Quality refinements */
  'assistant.quality.highFanout.title': '{n}× fan-out — try a Tunnel',
  'assistant.quality.highFanout.body':
    'A driver fanning out to many sinks gets visually messy fast. A Tunnel is a "named virtual wire": every tunnel sharing a label is electrically one net. Replace the spaghetti with a small named anchor and let downstream pins fish the signal off the tunnel name.',
  'assistant.quality.ledCluster.title': '{n} LEDs — maybe a 7-segment + decoder?',
  'assistant.quality.ledCluster.body':
    'Many LEDs in a row often want to be a single 7-segment digit (or a hex readout). A splitter peels off the bits, a decoder maps the value to the segments. Cleaner schematic, same information density.',
  'assistant.quality.repeated.title': '{n}× {kind} — extract a composite',
  'assistant.quality.repeated.body':
    'Repeating the same primitive many times signals reusable structure. Select the block, "save as composite" in the toolbar, then drop the composite anywhere — one instance per place, but one source of truth in the library.',
  'assistant.quality.compositeReuse.title': '{n} unused library entries',
  'assistant.quality.compositeReuse.body':
    'You\'ve saved circuits like "{name}" to the library but they\'re not in use on this tab. Drag them in from the Library section of the palette, or open them in a new tab from the library list to edit.',

  /* Concept cards (kind → educational blurb, kept short on purpose) */
  'assistant.concept.and.title': 'AND — both must be 1',
  'assistant.concept.and.body':
    'AND outputs 1 only when *every* input is 1. Truth table for 2 inputs: 00→0, 01→0, 10→0, 11→1. AND is the basis of "all conditions hold" logic.',
  'assistant.concept.or.title': 'OR — any one is enough',
  'assistant.concept.or.body':
    'OR outputs 1 when *any* input is 1. Useful for "either branch fires" semantics. Truth table: 00→0, 01→1, 10→1, 11→1.',
  'assistant.concept.not.title': 'NOT — flip the bit',
  'assistant.concept.not.body':
    'Inverter. 0 becomes 1, 1 becomes 0. X and Z bits stay undefined. NOT is the only single-input gate you really need.',
  'assistant.concept.xor.title': 'XOR — odd parity',
  'assistant.concept.xor.body':
    'XOR fires when an *odd* number of inputs are 1. For 2 inputs that means "exactly one". XOR is the workhorse of binary addition (sum bit) and parity-based error detection.',
  'assistant.concept.nand.title': 'NAND — universal gate',
  'assistant.concept.nand.body':
    'NAND is AND with the output inverted. Crucially, you can build *any* boolean function out of NAND alone — making it the universal gate. Real chips often use NAND as the basis cell.',
  'assistant.concept.splitter.title': 'Splitter — slice a bus',
  'assistant.concept.splitter.body':
    'A splitter takes an N-bit bus and exposes each bit (or group of bits) on its own pin. Use it to drive LEDs from a counter, or to address a memory.',
  'assistant.concept.tunnel.title': 'Tunnel — virtual wire by name',
  'assistant.concept.tunnel.body':
    'Two tunnels with the same label are electrically the same net. Use tunnels to declutter long-range connections — global clocks, reset signals, common data buses.',
  'assistant.concept.bitExtender.title': 'Bit extender — pad to a wider bus',
  'assistant.concept.bitExtender.body':
    'Widens an N-bit input to M bits by padding with 0s, 1s, or copies of the sign bit. The classic glue between a small arithmetic block and a wider register.',
  'assistant.concept.mux.title': 'MUX — pick one of N',
  'assistant.concept.mux.body':
    'A multiplexer uses a `select` signal to route exactly one of its data inputs to the output. The conceptual "switch" of digital logic. Used in everything from ALUs to memory bus arbiters.',
  'assistant.concept.decoder.title': 'Decoder — one-hot from binary',
  'assistant.concept.decoder.body':
    'An N→2^N decoder turns a binary number into a one-hot vector: only the selected output is 1, the rest are 0. Used as the address decoder of memories and to drive 7-segment displays.',
  'assistant.concept.priorityEncoder.title': 'Priority encoder — find the highest 1',
  'assistant.concept.priorityEncoder.body':
    'Given 2^N inputs, emits the binary index of the highest-indexed input that is 1. The dual of a decoder. Used in interrupt controllers and floating-point normalisation.',
  'assistant.concept.adder.title': 'Adder — one column of long addition',
  'assistant.concept.adder.body':
    'A 1-bit full adder computes sum + carry-out from a + b + carry-in. Chain N of them to add N-bit numbers. The carry rippling through is the textbook example of "propagation delay".',
  'assistant.concept.multiplier.title': 'Multiplier — N×N → 2N',
  'assistant.concept.multiplier.body':
    'Combinational multiplier: emits the full 2N-bit product split into low and high halves. Real CPUs pipeline this; here it\'s atomic so you can experiment with usage patterns.',
  'assistant.concept.shifter.title': 'Shifter — barrel shift L/R',
  'assistant.concept.shifter.body':
    'Shifts the input by a runtime-chosen amount. Logical right shifts fill with zero; arithmetic right shifts replicate the sign bit. The basis of fast multiply/divide by powers of two.',
  'assistant.concept.register.title': 'Register — remember a value',
  'assistant.concept.register.body':
    'A register holds its stored value between clock edges. On the rising edge, if enabled, it captures the data input. Combine N registers + an adder and you have a counter.',
  'assistant.concept.counter.title': 'Counter — automatic up-count',
  'assistant.concept.counter.body':
    'A counter is N chained registers wired so each clock edge increments the stored value mod 2^N. Add an enable for pause, a reset for sync clear, a carry-out to chain larger counters.',
  'assistant.concept.ram.title': 'RAM — addressable read/write',
  'assistant.concept.ram.body':
    'Synchronous RAM stores 2^addrBits words of `width` bits. Writes happen on the rising clock edge when `we` is high; reads are asynchronous and gated by `oe`. The same building block underlies a CPU\'s register file and cache.',
  'assistant.concept.rom.title': 'ROM — programmed lookup table',
  'assistant.concept.rom.body':
    'A ROM is a fixed table that returns the stored value at the given address. Useful as a microcode store, a character generator, or a small constant table. In hardware it\'s burned at manufacture; here you edit the data param.',
  'assistant.concept.dFlipFlop.title': 'D flip-flop — single-bit register',
  'assistant.concept.dFlipFlop.body':
    'On the rising clock edge, captures `d` into `q`. The smallest possible state element. Two D flip-flops back-to-back form an edge-triggered shift register.',
  'assistant.concept.jkFlipFlop.title': 'JK flip-flop — universal',
  'assistant.concept.jkFlipFlop.body':
    'Hold (J=K=0), reset (K=1), set (J=1), toggle (J=K=1). One flip-flop covers every basic state transition — the textbook "universal" flip-flop.',
  'assistant.concept.clock.title': 'Clock — the heartbeat',
  'assistant.concept.clock.body':
    'A square wave generator. Every rising edge advances registers / counters / flip-flops by one step. Slow it down with the Hz slider to inspect each transition.',
  'assistant.concept.controlledBuffer.title': 'Tri-state buffer — opt-in driver',
  'assistant.concept.controlledBuffer.body':
    'When `en` is 1, passes `in` to `out`. When `en` is 0, releases the net (outputs Z). Multiple tri-state buffers can share a bus as long as only one is enabled at a time — the canonical multi-driver fix.',

  /* Status bar */
  'statusBar.idle': 'idle',
  'statusBar.saved': 'Saved ✓',
  'statusBar.publishedToast': '"{name}" is now a component — find it in the Library section of the palette',
  'statusBar.publishedDismiss': 'Dismiss',
  'statusBar.zoom': 'zoom {n}%',
  'statusBar.pan': 'pan {x}, {y}',
  'statusBar.noSelection': 'no selection',
  'statusBar.selectedSingle': 'selected: {kind} ({id})',
  'statusBar.selectedMulti': 'selected: {n} components',
  'statusBar.noDiagnostics': '0 diagnostics',
  'statusBar.toolMarquee': 'marquee',
  'statusBar.toolPlace': 'place {kind}',
  'statusBar.toolWire': 'wire from {comp}:{port}',
  'statusBar.toolMove': 'move {n}',
  'statusBar.suggestion': 'Suggested next: {kinds}',

  /* Diagnostics panel */
  'diagnostics.title': 'Diagnostics ({n})',
  'diagnostics.empty': 'No diagnostics',
  'diagnostics.kinds.widthMismatch': 'width-mismatch',
  'diagnostics.kinds.floatingInput': 'floating-input',
  'diagnostics.kinds.multiDriver': 'multi-driver',
  'diagnostics.kinds.oscillation': 'oscillation',
  'diagnostics.target.widthMismatch': '{port}',
  'diagnostics.target.floatingInput': '{port}',
  'diagnostics.target.multiDriver': '{n} drivers on net {net}',
  'diagnostics.target.oscillation': '{n} nets',
  'diagnostics.detail.widthMismatch':
    'Port is {got}-bit but net is {expected}-bit. Reduce or widen one side so they match.',
  'diagnostics.detail.floatingInput':
    'No driver is wired to this input. It defaults to high-impedance, which downstream gates read as X.',
  'diagnostics.detail.multiDriver':
    'Two or more outputs drive opposite values onto the same wire. Insert a tri-state buffer or pick one driver.',
  'diagnostics.detail.oscillation':
    'Combinational feedback never settled. Insert a register/clock in the loop or remove the cycle.',

  /* Templates */
  'templates.pickTitle': 'New circuit — pick a template',
  'templates.pickSubtitle':
    'Start with a clean slate or jump into a labelled tutorial circuit.',
  'templates.cancel': 'Cancel',
  'templates.confirmOverwrite':
    'Replace the current circuit? Unsaved changes will be lost.',
  'templates.empty.name': 'Empty',
  'templates.empty.description': 'A blank canvas. Build from scratch.',
  'templates.halfAdder.name': 'Half adder',
  'templates.halfAdder.description': 'XOR + AND with two labelled inputs A and B.',
  'templates.fullAdder.name': 'Full adder',
  'templates.fullAdder.description': 'Two half-adders stitched together to handle carry-in.',
  'templates.srLatch.name': 'SR latch',
  'templates.srLatch.description': 'Cross-coupled NOR gates — the original 1-bit memory cell.',
  'templates.jkFlipFlop.name': 'JK flip-flop',
  'templates.jkFlipFlop.description': 'J + K buttons drive a JK flip-flop. Toggle, set, reset, and hold all visible on Q / Q̄.',
  'templates.mux2to1.name': '2:1 MUX',
  'templates.mux2to1.description': 'Routes one of two data inputs to the output by `sel`.',
  'templates.counterLed.name': 'Counter + LEDs',
  'templates.counterLed.description': 'A 4-bit counter clocked by a Clock source, split into 4 LEDs.',
  'templates.clockBlink.name': 'Clock blinker',
  'templates.clockBlink.description': 'Clock drives a register; register drives an LED that toggles.',
  'templates.hexDisplay.name': 'Hex digit display',
  'templates.hexDisplay.description':
    'Four input switches drive a 7-segment display via wires.',
  'templates.aluSkeleton.name': 'ALU skeleton',
  'templates.aluSkeleton.description':
    '4-bit add and bitwise-OR side by side — wire your select bit to choose.',
  'templates.registerFile.name': 'Two-register file',
  'templates.registerFile.description':
    'Two registers + a decoder so a 1-bit address picks which to clock.',
  'templates.fsmToy.name': 'FSM toy',
  'templates.fsmToy.description':
    'Two cross-coupled NOR latches — flip between states using buttons.',
  'templates.romToy.name': 'ROM toy',
  'templates.romToy.description': '2-bit address decoded to one of four constant outputs.',

  /* Welcome / first-run */
  'welcome.title': 'Welcome to gatecraft',
  'welcome.subtitle':
    'A live digital circuit playground. Drag gates onto the canvas, wire them up, watch signals propagate.',
  'welcome.layout.activity': 'Activity bar — quick access to assistant, lessons, glossary, history, waveform.',
  'welcome.layout.palette': 'Components — drag onto the editor. Library at top holds your saved sub-circuits.',
  'welcome.layout.editor': 'Editor with tabs — each tab is a circuit. Save tab as a component to reuse it.',
  'welcome.layout.inspector': 'Inspector — appears when you select a component. Live values, params, connections.',
  'welcome.shortcut.quickopen': 'Quick open',
  'welcome.shortcut.save': 'Save → adds to Library',
  'welcome.shortcut.fit': 'Fit view',
  'welcome.shortcut.tour': 'Restart tour',
  'welcome.shortcut.rotate': 'Rotate selection',
  'welcome.cta.learn': 'Start learning',
  'welcome.cta.learnSub': 'Step through 6 short lessons that build up from a single bit to a working counter.',
  'welcome.cta.templates': 'Open a template',
  'welcome.cta.templatesSub': 'Browse ready-made circuits — half-adder, SR latch, 4-bit counter, …',
  'welcome.cta.empty': 'Start blank',
  'welcome.cta.emptySub': "I'll explore on my own.",
  'welcome.skipNext': "Don't show this again",

  /* Lessons panel */
  'lessons.title': 'Lessons',
  'lessons.subtitle': 'Concept → small example → try it on the canvas.',
  'lessons.openTemplate': 'Open the template',
  'lessons.next': 'Next lesson',
  'lessons.previous': 'Previous',
  'lessons.close': 'Close',
  'lessons.help.title': 'Help & Lessons',
  'lessons.completedShort': 'completed',
  'lessons.tab.sample': 'Sample',
  'lessons.tab.workspace': 'Workspace',
  'lessons.sample.hint': 'Read-only preview of the circuit that goes with this lesson.',
  'lessons.sample.none': 'This lesson has no canvas example — it is concept-only.',
  'lessons.workspace.hint':
    'Load the lesson template into your live editor so you can wire it up yourself, then come back here.',
  'lessons.workspace.openCta': 'Load template into editor',
  'lessons.workspace.noTemplate': 'This lesson has no template to load — pure concept.',
  'lessons.workspace.blank': 'Start blank instead',
  'toolbar.lessons': 'lessons',
  'toolbar.lessonsTooltip': 'Open the lesson library',

  /* Individual lessons */
  'lesson.bits.title': '1. Bits — the alphabet of digital logic',
  'lesson.bits.summary': 'Why circuits speak in 0s and 1s.',
  'lesson.bits.step1':
    'Everything inside a digital circuit is a bit — a single wire that is either at 0 (low) or 1 (high) volts.',
  'lesson.bits.step2':
    'On the canvas, blue wires are undriven (Z), grey wires are 0, green wires are 1, red wires are X (unknown / conflict).',
  'lesson.bits.step3':
    'Open the half-adder template, click an IN pin, watch a wire flip from grey to green. That is one bit changing state.',

  'lesson.gates.title': '2. Gates — combining bits',
  'lesson.gates.summary': 'AND, OR, NOT and friends turn bits into decisions.',
  'lesson.gates.step1':
    'AND outputs 1 only when every input is 1. OR outputs 1 when any input is 1. NOT flips its single input.',
  'lesson.gates.step2':
    'NAND and NOR are AND/OR with a bubble (negation) on the output. XOR fires when an odd number of inputs are 1 — it is the heart of binary addition.',
  'lesson.gates.step3':
    'Drop an AND from the palette, wire two IN pins to its inputs, an OUT pin to the output, then toggle inputs to see the truth table come alive.',
  'lesson.gates.step4':
    'Stretch goal: write down what XOR(A, B, C) should be — does it match "odd parity"? Build the 3-input version and verify.',

  'lesson.halfAdder.title': '3. The half-adder',
  'lesson.halfAdder.summary': 'XOR + AND = the simplest one-bit adder.',
  'lesson.halfAdder.step1':
    'Adding two bits A and B yields a sum bit (S) and a carry bit (C). Sum is A XOR B; carry is A AND B.',
  'lesson.halfAdder.step2': 'Open the Half-adder template. Note how A and B fan out to both the XOR and the AND gate.',
  'lesson.halfAdder.step3':
    'Toggle A and B through all four combinations. Verify the truth table: 0+0=0c0, 0+1=1c0, 1+0=1c0, 1+1=0c1.',
  'lesson.halfAdder.step4':
    'Open the Sample tab on the right to see the canonical half-adder, then jump to Workspace to wire your own copy.',

  'lesson.fullAdder.title': '4. The full-adder',
  'lesson.fullAdder.summary': 'Two half-adders + an OR = a column of long addition.',
  'lesson.fullAdder.step1':
    'A full-adder accepts a carry-in (Cin) so you can stack them to add multi-bit numbers.',
  'lesson.fullAdder.step2':
    'Open the Full-adder template. Notice that it is just two half-adders feeding an OR to combine their carries.',
  'lesson.fullAdder.step3':
    'Set A=1, B=1, Cin=1. Sum should be 1 (because 1+1+1 = 11 in binary, low bit is 1). Carry-out is 1.',
  'lesson.fullAdder.step4':
    'Now you have the building block for any width — chain N of them and you have an N-bit ripple adder (next unit).',

  'lesson.clock.title': '5. Clock & register — adding memory',
  'lesson.clock.summary': 'A clock turns combinational logic into state machines.',
  'lesson.clock.step1':
    'A register stores a value. On each clock edge, if its enable is high, it latches the data input into the stored value.',
  'lesson.clock.step2':
    'The Clock primitive flips between 0 and 1 each tick. Hooking it to a register makes a one-bit blinker.',
  'lesson.clock.step3':
    'Open the Clock blinker template, press Play, watch the LED toggle. Slow the Hz slider to see each tick.',
  'lesson.clock.step4':
    'A register holding D flip-flops + a clock is the foundation of every synchronous design. Everything from here on uses it.',

  'lesson.counter.title': '6. Counter + display',
  'lesson.counter.summary': 'Stacking registers makes a counter; a splitter feeds a display.',
  'lesson.counter.step1':
    'A counter is essentially N registers chained as a binary up-counter. The Counter primitive bakes that in.',
  'lesson.counter.step2':
    'A splitter peels the bus into individual bits — one LED per bit gives you a binary readout.',
  'lesson.counter.step3':
    'Open the Counter + LEDs template, press Play. The four LEDs count 0→15 in binary. Watch the sim flow dots on the active wires.',
  'lesson.counter.step4':
    'Reset the counter mid-run by pressing the Reset button (Toolbar). State resets to 0 instantly — that is a synchronous reset in action.',

  /* Glossary */
  'glossary.title': 'Glossary',
  'glossary.subtitle': 'Quick definitions for terms used across the app.',
  'glossary.search': 'Search…',
  'glossary.empty': 'No terms match.',
  'toolbar.glossary': 'glossary',
  'toolbar.welcome': 'show welcome screen',
  'toolbar.glossaryTooltip': 'Open the glossary',
  'glossary.term.bit.name': 'Bit',
  'glossary.term.bit.desc':
    'A single binary signal: 0 (low) or 1 (high). Every wire in the app carries one or more bits.',
  'glossary.term.bus.name': 'Bus',
  'glossary.term.bus.desc':
    'A wire carrying multiple bits at once. Width is set per component (e.g. 4-bit, 8-bit).',
  'glossary.term.gate.name': 'Gate',
  'glossary.term.gate.desc':
    'A primitive that maps inputs to outputs via Boolean logic — AND, OR, NOT, NAND, NOR, XOR, XNOR, buffer.',
  'glossary.term.driver.name': 'Driver',
  'glossary.term.driver.desc':
    'A component output port that pushes a value onto a net. A net can have zero, one, or many drivers.',
  'glossary.term.sink.name': 'Sink',
  'glossary.term.sink.desc':
    'A component input port that reads the value of the net it is connected to.',
  'glossary.term.net.name': 'Net',
  'glossary.term.net.desc':
    'The set of ports connected by wires that are electrically the same. Each net has one resolved value.',
  'glossary.term.x.name': 'X (unknown)',
  'glossary.term.x.desc':
    'A bit whose value the simulator cannot determine — multiple drivers disagree, or an undefined input fed a gate.',
  'glossary.term.z.name': 'Z (high impedance)',
  'glossary.term.z.desc':
    'A bit that is not being driven by anyone. Tri-state buffers and floating wires sit at Z.',
  'glossary.term.fanout.name': 'Fan-out',
  'glossary.term.fanout.desc':
    'How many sinks a single driver feeds. The number after a port in the Inspector is its fan-out count.',
  'glossary.term.multiDriver.name': 'Multi-driver conflict',
  'glossary.term.multiDriver.desc':
    'Two or more drivers push opposite values onto the same net. The simulator resolves it to X and raises a diagnostic.',
  'glossary.term.oscillation.name': 'Oscillation',
  'glossary.term.oscillation.desc':
    'Combinational feedback that never settles. Break the loop with a register, or rethink the logic.',
  'glossary.term.edge.name': 'Clock edge',
  'glossary.term.edge.desc':
    'The instant a clock transitions from 0 to 1 (rising edge). Registers latch their input on this edge.',
  'glossary.term.register.name': 'Register',
  'glossary.term.register.desc':
    'A 1-bit (or N-bit) memory cell. Holds its value until the next enabled clock edge.',
  'glossary.term.mux.name': 'Multiplexer (MUX)',
  'glossary.term.mux.desc':
    'Picks one of N data inputs based on a select signal. The selected input passes through to the output.',
  'glossary.term.splitter.name': 'Splitter',
  'glossary.term.splitter.desc':
    'Slices a wide bus into narrower sub-buses (e.g. an 8-bit bus into 4×2-bit slices).',
  'glossary.term.tunnel.name': 'Tunnel',
  'glossary.term.tunnel.desc':
    'A "virtual wire" by name. All tunnels sharing the same label are electrically the same net.',
  'glossary.term.composite.name': 'Composite',
  'glossary.term.composite.desc':
    'A saved circuit reused as a single block. Built once, dropped anywhere; the engine flattens it on compile.',
  'glossary.term.netlist.name': 'Netlist',
  'glossary.term.netlist.desc':
    'The compiled representation of a circuit — components, ports, and nets — that the simulator runs.',
  'glossary.term.snapshot.name': 'Snapshot',
  'glossary.term.snapshot.desc':
    'A read-only view of every net\'s current value, produced by the simulator on each settle/tick.',
  'glossary.term.diagnostic.name': 'Diagnostic',
  'glossary.term.diagnostic.desc':
    'A warning produced by the compiler or simulator — width-mismatch, multi-driver, oscillation, floating-input.',
  'glossary.term.truthTable.name': 'Truth table',
  'glossary.term.truthTable.desc':
    'An exhaustive list of inputs and the expected outputs for a piece of logic. The Challenge mode uses one to grade your circuit.',

  /* Challenge mode */
  'challenge.title': 'Challenge',
  'challenge.run': 'Check my circuit',
  'challenge.pass': 'All cases pass ✓',
  'challenge.fail': '{n} case(s) failed',
  'challenge.failDetail': 'Inputs {inputs} → expected {expected}, got {got}',
  'challenge.error': "Couldn't grade: {message}",
  'challenge.missing': 'No challenge attached to this lesson.',
  'challenge.expected': 'Expected',
  'challenge.actual': 'Actual',
  'challenge.case': 'Case {n}',
  'challenge.downloadTb': 'tb.v',
  'challenge.downloadTbTooltip': 'Download a Verilog testbench that drives every truth-table case',

  /* Tour */
  'tour.start': 'Start the tour',
  'tour.skip': 'Skip',
  'tour.next': 'Next',
  'tour.done': 'Done',
  'tour.step1.title': 'Components live here',
  'tour.step1.body':
    'The right-hand palette holds every primitive. Click one to enter "place" mode.',
  'tour.step2.title': 'Place a gate',
  'tour.step2.body': 'Click "AND" in the palette, then click anywhere on the canvas. An AND gate appears.',
  'tour.step3.title': 'Inspect & wire',
  'tour.step3.body': 'Click a pin to start a wire, click another pin to commit it. The Inspector at the bottom-left shows live values.',
  'tour.step4.title': 'Run the simulation',
  'tour.step4.body': 'Press Play in the toolbar. Inputs you click toggle 0↔1, and downstream wires light up.',
  'tour.step5.title': 'Need help?',
  'tour.step5.body': 'The "? dersler" button opens 6 short lessons + a glossary. You can re-open the tour from there.',
  'welcome.cta.tour': 'Take the tour',
  'welcome.cta.tourSub': 'A 5-step walkthrough of the canvas, the palette, and how to run a simulation.',

  /* Component kind help (titles + descriptions; cheats stay in code) */
  'kindHelp.input.title': 'Input pin',
  'kindHelp.input.description':
    'A driven source — click it on the canvas to toggle between 0 and 1. Use it to feed external stimulus into your circuit.',
  'kindHelp.output.title': 'Output probe',
  'kindHelp.output.description':
    'A passive sink that lets you observe the value on the net. The renderer colors the connected wire by its current value.',
  'kindHelp.constant.title': 'Constant',
  'kindHelp.constant.description':
    'Drives a fixed literal forever. Set the value as decimal (42) or hexadecimal (0xA). Useful for tying inputs high or low.',
  'kindHelp.clock.title': 'Clock',
  'kindHelp.clock.description':
    'Free-running 1-bit oscillator — toggles on every tick. Connect to register/counter clock inputs to sequence them.',
  'kindHelp.splitter.title': 'Splitter',
  'kindHelp.splitter.description':
    'Slices a wide bus into N equal-width sub-buses. Reverse direction (combine) is on the roadmap.',
  'kindHelp.tunnel.title': 'Tunnel',
  'kindHelp.tunnel.description':
    'Named virtual wire. Every tunnel with the same label (and width) is electrically the same net — useful for clean diagrams.',
  'kindHelp.and.title': 'AND',
  'kindHelp.and.description':
    'Output is 1 only when every input is 1. Otherwise 0. An X bit anywhere taints the output to X.',
  'kindHelp.or.title': 'OR',
  'kindHelp.or.description':
    'Output is 1 if any input is 1. Otherwise 0. A 1 dominates X; 0 + X = X.',
  'kindHelp.nand.title': 'NAND',
  'kindHelp.nand.description':
    'AND with the output inverted. Universal gate — every other logic function can be built from NANDs alone.',
  'kindHelp.nor.title': 'NOR',
  'kindHelp.nor.description':
    'OR with the output inverted. Also universal — combine with itself to build any logic.',
  'kindHelp.xor.title': 'XOR',
  'kindHelp.xor.description':
    'Output is 1 iff an odd number of inputs are 1. Carry-free addition of two bits.',
  'kindHelp.xnor.title': 'XNOR',
  'kindHelp.xnor.description': 'XOR with the output inverted — equality detector.',
  'kindHelp.not.title': 'NOT (inverter)',
  'kindHelp.not.description':
    'Flips each input bit. ~X = X (we cannot guess the inverse of an unknown).',
  'kindHelp.buffer.title': 'Buffer',
  'kindHelp.buffer.description':
    'Identity gate. Same value, slightly delayed in real silicon — used for fan-out isolation.',
  'kindHelp.mux.title': 'Multiplexer',
  'kindHelp.mux.description':
    'Selects one of N data inputs by the binary value of `sel`. If sel is X/Z, output is X.',
  'kindHelp.demux.title': 'Demultiplexer',
  'kindHelp.demux.description':
    'Routes the single `in` to one of N outputs by `sel`. Unselected outputs go high-impedance (Z).',
  'kindHelp.decoder.title': 'Decoder',
  'kindHelp.decoder.description':
    'One-hot: only the output indexed by `sel` is 1; the rest are 0. Useful for address decoding.',
  'kindHelp.adder.title': 'Binary adder',
  'kindHelp.adder.description':
    'Computes a + b + cin → s (sum, same width) + cout (carry-out, 1 bit). Wraps modulo 2^width.',
  'kindHelp.subtractor.title': 'Binary subtractor',
  'kindHelp.subtractor.description':
    'Computes a − b − bin → d (difference) + bout (borrow-out, set when the subtraction underflows).',
  'kindHelp.comparator.title': 'Magnitude comparator',
  'kindHelp.comparator.description':
    'Sets exactly one of `lt`, `eq`, `gt` high based on a vs b. Toggle `signed` for two\'s-complement comparison.',
  'kindHelp.register.title': 'Edge-triggered register',
  'kindHelp.register.description':
    'On each clock edge, if `en` is high, latch `d` into the stored value. Otherwise hold. `q` always reflects state.',
  'kindHelp.counter.title': 'Up-counter',
  'kindHelp.counter.description':
    'Increments on each clock edge when `en` is high; `rst` clears to 0. `co` (carry-out) goes high when q is at its max.',
  'kindHelp.shiftRegister.title': 'Shift register',
  'kindHelp.shiftRegister.description':
    'Shifts in a serial bit on each enabled clock edge; reveals the contents in parallel on `q`.',
  'kindHelp.button.title': 'Push button',
  'kindHelp.button.description':
    'Like an input pin but visually distinct. Click on the canvas to toggle. Default value is 0 (pulled low).',
  'kindHelp.led.title': 'LED',
  'kindHelp.led.description':
    'A lamp that glows when its input is 1. Pure sink; the renderer reads the net value and lights up accordingly.',
  'kindHelp.sevenSeg.title': '7-segment display',
  'kindHelp.sevenSeg.description':
    'Eight individual 1-bit segment inputs (a..g + dp). Drive each one to light up that segment.',
} as const;

export type EnKey = keyof typeof EN;
