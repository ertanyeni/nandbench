# ROADMAP.md

Build strictly in phase order. **Faz 0 (engine, no UI) must pass its tests before any rendering work.**
Each phase lists concrete acceptance criteria — do not advance until they are met.

## Faz 0 — Engine core (NO UI)

The heart of the product. Most clones die by skipping this and building a pretty UI on a broken engine.

- Event-driven simulation loop with an event queue.
- Primitives: AND, OR, NOT, XOR, MUX, and a clocked Register.
- Four-valued logic per bit (`0/1/X/Z`); multi-bit buses.
- Net model + Union-Find net compilation.
- Multi-driver resolution and an oscillation iteration cap.

**Acceptance:** define a small circuit in code (no GUI), drive inputs, and assert outputs against
truth tables. Sequential test: a counter increments on each clock edge. All green in CI.

## Faz 1 — Renderer + static drawing

- Canvas 2D renderer behind a `Renderer` interface.
- Infinite canvas: pan, zoom, grid.
- Quadtree hit-testing.
- Draw components and wires from the visual model. **No simulation wired up yet.**

**Acceptance:** render a hand-authored circuit, pan/zoom smoothly, click-select the correct component.

## Faz 2 — Interaction

- Component palette → drag/drop onto canvas.
- Wire drawing with grid snap + orthogonal segments.
- Net compiler runs on edits (union-find).
- Selection, move, delete; command-pattern undo/redo.

**Acceptance:** build a full circuit entirely via mouse; undo/redo every action correctly.

## Faz 3 — Wire the engine in (the "live-action" moment)

- Engine runs in a Web Worker; typed `postMessage` boundary.
- Diffs out → value snapshots back.
- Renderer animates live signal flow at 60fps from snapshots.

**Acceptance:** toggle an input switch and watch values propagate visually in real time; a clocked
counter visibly counts on the canvas.

## Faz 4 — Education layer + live debugging (the differentiator)

- Real-time bit-width mismatch warnings.
- Multi-driver / short-circuit detection surfaced inline.
- Oscillation warnings.
- Context side panel ("what does this MUX do?").

**Acceptance:** intentionally mis-wire a 3-bit pin to an 8-bit bus → instant, clear inline warning
pointing at the exact wire.

## Faz 5 — Hierarchy, persistence, export

- Save a circuit and reuse it as a composite component.
- localStorage autosave + JSON import/export.
- Shareable file format finalized.

**Acceptance:** build an ALU, save it, drop it as a single block into a larger CPU circuit; simulate
the whole thing correctly; export and re-import without loss.

---

### Deliberately deferred (v2+)
Auto-routing (A*), Yjs multiplayer, Rust/WASM engine core, Verilog/VHDL export, AI-assisted design.
Do not pull these forward into the MVP.
