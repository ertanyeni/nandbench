# CLAUDE.md — Project Context & Rules

> This file is read automatically by Claude Code at the start of every session.
> Keep it short, directive, and current. It is the single source of project truth for any agent.

## Mission

A web-based, real-time digital logic circuit simulator and editor — a modern, professional
alternative to Logisim / CircuitVerse. The product is **the simulation engine**, not the UI.
Drag-and-drop is the easy 20%; a correct, fast, event-driven engine is the hard 80%.

**Killer feature (MVP focus):** real-time error detection / live debugging
(bit-width mismatches, multi-driver conflicts, oscillation) — the thing students burn hours on.
AI-assisted design and Figma-style multiplayer collaboration are explicitly **v2**.

## Golden rules (violating any of these means a rewrite later — do not)

1. **Render on Canvas, never DOM-per-component.** One `<div>` per gate kills the browser at scale.
2. **Simulation is event-driven, never cycle-based.** Re-evaluating everything per frame dies at ~500 gates.
3. **Hierarchical sub-circuits live in the data model from day one.** A component is either primitive or a saved circuit instance. Bolting this on later = rewrite.
4. **Every entity has a stable UUID.** Never reference by array index — collaboration (Yjs) depends on stable IDs.
5. **The engine has ZERO React/DOM imports.** It is a framework-agnostic TS package, runs in a Web Worker, fully unit-testable in isolation. Enforce with a lint boundary rule.

## Tech stack (agreed — do not substitute without asking)

| Concern | Choice |
| --- | --- |
| Framework / build | React + Vite + TypeScript (strict) |
| UI state | Zustand (NOT Redux) |
| Rendering | Canvas 2D behind a `Renderer` interface (swap to PixiJS/WebGL later) |
| Simulation | Pure TypeScript engine in a Web Worker (port hot path to Rust/WASM ONLY if profiling demands it) |
| Document model | Plain serializable graph (JSON), UUID-keyed |
| Persistence (MVP) | localStorage + JSON import/export. No backend yet. |
| Backend (later) | Node + Postgres (accounts, saving, sharing) |
| Collaboration (v2) | Yjs (CRDT) + y-websocket |

## Repo structure

```
/packages
  /engine        # Pure TS simulation engine. NO React, NO DOM. Heavily unit-tested.
    /src
    /test
  /app           # React + Canvas editor. Imports engine via a worker boundary.
    /src
      /render    # Canvas renderer (behind Renderer interface)
      /model     # Document model: logical graph / visual / sim-state (kept separate)
      /interaction
      /workers   # Web Worker host for the engine
      /ui        # React components (palette, panels, toolbar)
/docs
  ARCHITECTURE.md
  ROADMAP.md
```
Use a pnpm workspace. Keep `engine` and `app` as separate packages so the decoupling is *physical*, not a convention.

## Conventions

- TypeScript `strict: true`. No `any` in engine code.
- Engine ↔ app communicate only via `postMessage` with typed messages (diffs in, value snapshots out).
- All mutations to the document model go through **Command objects** (do/undo) for undo/redo + future collab.
- Tests first for the engine (Faz 0). Do not build UI until the engine passes its truth-table tests.
- Sentence-case commit messages, conventional-commits style (`feat:`, `fix:`, `refactor:`).

## Faz 0 — Engine contract (authoritative)

The engine's public shape is defined in **`packages/engine/src/types.ts`** — implement against it,
do not redesign it without asking. Key contracts:

- **Branded IDs** (`ComponentId`, `NetId`): UUIDs, but type-distinct so they can't be swapped.
- **`SignalValue`**: immutable multi-bit, four-valued per bit (`0/1/X/Z`) via three `bigint` masks
  (`value` / `unknown` / `hiZ`). All bit logic goes through a single tested `SignalOps`.
- **`ComponentDefinition` vs `ComponentInstance`**: behavior (registered by `kind`) is separate from
  placed data (`id`, `params`, `state`). This is what lets composite sub-circuits slot in later.
- **`evaluate()` vs `clockEdge()`**: combinational outputs in `evaluate` (a register's `q` reflects
  its state); state mutation only in `clockEdge`.
- **`Simulator`**: `settle()` runs delta cycles to a fixed point with an oscillation cap; `tickClock()`
  does one edge then settles; `snapshot()` is the structured-clone-safe payload for the renderer.
- **`Diagnostic`**: width-mismatch / multi-driver / oscillation / floating-input are first-class engine
  output — the live-debugging feature is part of the contract, not a later add-on.

Faz 0 is done when these interfaces are implemented and pass truth-table + sequential-counter tests in CI.

## Working agreement for the agent

- **Build in the phase order in `docs/ROADMAP.md`.** Do not skip ahead. Faz 0 (engine, no UI) must pass tests before any rendering work.
- When a decision isn't covered here, STOP and ask rather than guessing on architecture-shaping choices (IDs, threading, data model, sim strategy).
- Read `docs/ARCHITECTURE.md` for the *why* behind every rule above.
