# nandbench

A web-based, real-time digital logic circuit simulator and editor — a
modern, professional alternative to Logisim and CircuitVerse.

The product is the **simulation engine**, not the UI. Drag-and-drop is
the easy 20% of the problem; a correct, fast, event-driven engine is
the hard 80%.

## Killer feature

**Live debugging.** Every edit is recompiled and resimulated in a Web
Worker, and the editor flags bit-width mismatches, multi-driver
conflicts, oscillation, and floating inputs the moment they appear.
That's the thing students burn hours on with other simulators.

## Highlights

- **Pure-TypeScript engine** (`packages/engine`) with zero React or DOM
  dependencies. Four-valued logic (`0`/`1`/`X`/`Z`), multi-bit signals
  via three `bigint` masks, event-driven settle loop with oscillation
  cap, structural and clock-edge semantics separated. Heavily
  unit-tested.
- **Canvas 2D renderer** behind a `Renderer` interface — no
  `<div>`-per-component. Quadtree hit-testing, custom A\* grid router
  with collision escalation.
- **Hierarchical sub-circuits** in the data model from day one — every
  saved circuit can be dropped as a black-box instance inside another.
- **Verilog export** of any tab to a synthesizable module, optionally
  bundled with a self-checking testbench generated from a lesson's
  challenge spec (runs out of the box with Icarus iverilog).
- **Lessons + challenges** baked in: each lesson has a truth-table
  challenge, the engine grades it live, and the same spec drives the
  exported testbench.
- **Local persistence** to `localStorage` (autosaved), JSON
  import/export, and a **cloud save** flow (anonymous-friendly, with
  optional magic-link sign-in to claim circuits across devices).
- **Quick open**, command palette, suggestion hints, AI assistant
  panel, glossary, waveform viewer, history inspector, light
  multi-tab editing.
- **i18n** (English + Turkish, compile-time-checked key parity).

## Repo layout

```
packages/
  engine/        Pure TS simulation engine. NO React, NO DOM.
  app/           React + Vite editor. Imports engine via a worker.
  cli/           Headless CLI runner for the engine.
  api/           Hono + Postgres cloud save server.
  multiplayer/   Dormant; Yjs CRDT collaboration is a v2 goal.
docs/
  architecture.md  The "why" behind every rule in CLAUDE.md.
  ROADMAP.md       Phase-ordered build plan.
```

## Getting started

Requires Node ≥ 20 and pnpm 10.

```sh
pnpm install
pnpm -r typecheck
pnpm test          # engine + app test suites
pnpm --filter @nandbench/app dev   # editor at http://localhost:5175
```

### Optional: cloud save backend

The editor works fully offline against `localStorage`; the cloud
sync is only needed if you want a server-backed save.

```sh
# 1. Bring up Postgres any way you like, then point the API at it:
export DATABASE_URL=postgres://nandbench:nandbench@localhost:5432/nandbench

# 2. Apply migrations:
pnpm --filter @nandbench/api migrate

# 3. Run the API:
pnpm --filter @nandbench/api dev   # http://localhost:4555

# 4. Point the editor at it (defaults to http://localhost:4555):
VITE_NANDBENCH_API=http://localhost:4555 pnpm --filter @nandbench/app dev
```

Use the **cloud…** entry in the toolbar overflow menu to save the
current project, copy a share link (`?c=<id>`), and — optionally —
sign in with a magic link to claim circuits to your account.

## Golden rules

Five non-negotiables that protect the architecture from
death-by-a-thousand-cuts. Full reasoning in
[`docs/architecture.md`](docs/architecture.md).

1. Render on Canvas, never DOM-per-component.
2. Simulation is event-driven, never cycle-based.
3. Hierarchical sub-circuits live in the data model from day one.
4. Every entity has a stable UUID — never reference by array index.
5. The engine has zero React/DOM imports and runs in a Web Worker.

## License

[AGPL-3.0](LICENSE). You're free to use, study, share, and modify
nandbench. If you run a modified version as a network service, the AGPL
requires you to offer your users its source code.
