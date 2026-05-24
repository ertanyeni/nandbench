# ARCHITECTURE.md

The whole architecture rests on keeping **three layers in separate threads** and never letting
simulation logic leak into rendering/UI. This document explains the *why* behind the rules in `CLAUDE.md`.

## Thread / data-flow model

```
Main thread (UI · 60fps)                Sim worker (own clock)
  Interaction  →  Document model  →  Renderer
                      │  ▲
            compile + │  │ value
              diff    ▼  │ snapshot
                   Net compiler  →  Sim engine
                  (union-find)     (event-driven)
```

- The **document model** is the single source of truth (UUID-keyed graph).
- On edit, a **diff** is sent to the worker; the worker **compiles nets** and runs the engine.
- The engine posts **value snapshots** back; the renderer draws the latest snapshot at 60fps.
- Engine never blocks the UI; renderer never waits for the engine.

## 1. Document model (source of truth)

Keep three concerns physically separate:

- **Logical graph** — components (nodes) + nets (electrical connections). No positions here.
- **Visual model** — positions, sizes, rotations, wire waypoints. The renderer reads this.
- **Simulation state** — current resolved value per net. Output of the engine; not part of the model.

Rules:
- Every component, net, and wire has a **stable UUID**. Never index-based references.
- **Hierarchical sub-circuits**: a component is either a *primitive* (AND, MUX, Register, …) or a
  *composite* (an instance of a saved circuit). This must exist from day one.
- The model is plain serializable JSON → enables persistence and Yjs retrofit.

## 2. Net compiler

Wires are visual; electrically, all touching wires collapse into one **net**. Compute connected
components with **Union-Find (Disjoint Set)** — near-constant time, recomputed on connect/disconnect.
Naive graph traversal per change dies on large circuits. Output: terminal → net mapping for the engine.

## 3. Simulation engine (the actual product)

**Event-driven**, not cycle-based:
- Maintain an event queue. When a net's value changes, enqueue re-evaluation of components on that net.
- A component computes its outputs; if an output changed, enqueue downstream. Change propagates as a
  wavefront — this is exactly what powers the "live signal flow" animation.

Hard problems to design for up front:
- **Four-valued logic per bit:** `0 / 1 / X (unknown) / Z (high-impedance)`. This separates a toy from a tool.
- **Multi-bit / buses:** values are bit-vectors. Use `BigInt` or typed arrays for wide buses.
- **Multi-driver resolution:** two outputs driving one net → resolution function (conflict ⇒ X).
  This is the basis of the "short circuit detected" debugging feature.
- **Sequential logic + clock:** flip-flops/registers latch on a clock edge. Combinational settles to a
  fixed point between edges; clock tick then updates state.
- **Oscillation guard:** combinational feedback (ring oscillator, SR latch) won't settle. Cap iterations;
  on overflow mark net as oscillating/X. Without this the tab freezes.

Placement: a **framework-agnostic TypeScript module** running in a Web Worker. Unit-test against truth
tables before any UI exists. Port the hot path to Rust/WASM **only** if profiling demands it — not before.

## 4. Renderer

- **Canvas 2D** behind a `Renderer` interface. Never DOM-per-component.
- **Infinite canvas** via a viewport transform matrix (world space → screen space).
- **Hit-testing** via a spatial index (quadtree) so "what did I click" stays fast at scale.
- **Layered drawing:** static layer (components + wires, redraw on change) + dynamic layer (signal
  animation, cursor, selection).
- **Decoupled from sim:** renderer reads the latest value snapshot at 60fps; it never blocks on the engine.
- Swap to **PixiJS/WebGL** later for thousands of elements — the interface keeps the rest of the code stable.

## 5. Interaction

- **Grid snapping** for pins and wires (mandatory).
- **Orthogonal (Manhattan) wires** with manual waypoints for v1.
- **Auto-routing** (A* on a component-avoiding grid) is a v2 polish item, not MVP.
- **Resize** via bounding-box handles; composite components scale the box, not the inner contents.

## 6. Undo/redo & state

- **Command pattern**: every mutation is a command with `do()` / `undo()`. Cleaner than snapshotting at
  this scale and aligns with future CRDT collaboration.
- UI state (selection, viewport, tool) in Zustand; document model is separate and authoritative.

## Future (post-MVP)

- **Rust/WASM engine core** for very large circuits / "professional" performance claims.
- **Yjs (CRDT) collaboration** — the UUID-keyed JSON model retrofits cleanly into a `Y.Doc`.
- **Verilog/VHDL export** (FPGA path) — turns this from an education tool into an industrial one.
- **AI-assisted design** ("draw a circuit that does X").
