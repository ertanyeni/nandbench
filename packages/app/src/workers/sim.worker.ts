/**
 * Simulation worker — owns the engine's Simulator on a thread of its own.
 *
 * Main thread never blocks on simulation: edits arrive as `load` messages
 * (full netlist replacement, simple and correct; diff-based incremental
 * updates are a Faz 4+ optimization), and every state-changing operation
 * is followed by a `snapshot` post back to the main thread.
 *
 * Per CLAUDE.md the engine has zero DOM/React imports, so it loads cleanly
 * in this worker context.
 */

import {
  createRegistry,
  createSimulator,
  registerPrimitives,
  type CompiledNetlist,
  type ComponentId,
  type Diagnostic,
  type PortRef,
  type SignalValue,
  type SimSnapshot,
  type Simulator,
} from '@nandbench/engine';

export type WorkerInMsg =
  | { readonly type: 'load'; readonly netlist: CompiledNetlist }
  | { readonly type: 'setInput'; readonly port: PortRef; readonly value: SignalValue }
  | { readonly type: 'tickClock' }
  | { readonly type: 'settle' }
  | { readonly type: 'requestHistory'; readonly portKeys: readonly string[] };

export type WorkerOutMsg =
  | {
      readonly type: 'snapshot';
      readonly snapshot: SimSnapshot;
      readonly diagnostics: readonly Diagnostic[];
      /**
       * Per-sequential-component runtime state, structured-clone-safe.
       * Inspector reads this to show register / counter / shift-register values.
       * Stateless components are absent from the map.
       */
      readonly componentStates: ReadonlyMap<ComponentId, unknown>;
    }
  | {
      readonly type: 'history';
      /** ports[key] = sequence of values, low → high tick. */
      readonly traces: ReadonlyMap<string, readonly { tick: number; value: SignalValue }[]>;
    };

/** Ring buffer of recent snapshots — used to feed the Waveform panel. */
interface SnapshotEntry {
  readonly tick: number;
  readonly nets: ReadonlyMap<string, SignalValue>;
}
const HISTORY_LIMIT = 512;
let historyBuffer: SnapshotEntry[] = [];
let tickCounter = 0;

const registry = createRegistry();
registerPrimitives(registry);
let sim: Simulator | null = null;
let netlist: CompiledNetlist | null = null;

function emit(): void {
  if (!sim) return;
  const componentStates = new Map<ComponentId, unknown>();
  if (netlist) {
    for (const [id, inst] of netlist.components) {
      const def = registry.get(inst.kind);
      // Only ship state for sequential components; combinational state is
      // not meaningful for the Inspector readout.
      if (def?.isSequential) {
        componentStates.set(id, inst.state);
      }
    }
  }
  const snapshot = sim.snapshot();
  // Record a thin copy in the ring buffer for the Waveform panel.
  const tick = ++tickCounter;
  const nets = new Map<string, SignalValue>();
  for (const [id, v] of snapshot.nets) nets.set(String(id), v);
  historyBuffer.push({ tick, nets });
  if (historyBuffer.length > HISTORY_LIMIT) historyBuffer.shift();
  const out: WorkerOutMsg = {
    type: 'snapshot',
    snapshot,
    diagnostics: sim.diagnostics(),
    componentStates,
  };
  // Structured clone handles the Map<…, SignalValue/bigint/…> recursively.
  (self as DedicatedWorkerGlobalScope).postMessage(out);
}

self.onmessage = (ev: MessageEvent<WorkerInMsg>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'load': {
      sim = createSimulator(registry);
      netlist = msg.netlist;
      historyBuffer = [];
      tickCounter = 0;
      sim.load(msg.netlist);
      sim.settle();
      emit();
      return;
    }
    case 'setInput': {
      if (!sim) return;
      sim.setInput(msg.port, msg.value);
      sim.settle();
      emit();
      return;
    }
    case 'tickClock': {
      if (!sim) return;
      sim.tickClock();
      emit();
      return;
    }
    case 'settle': {
      if (!sim) return;
      sim.settle();
      emit();
      return;
    }
    case 'requestHistory': {
      // The main thread asks for the recent values of specific nets,
      // identified by their `portKey`-flavoured string (we resolve via the
      // currently loaded netlist's portToNet map). The Waveform panel
      // uses this on user-driven refresh; we don't push history
      // unsolicited (would dominate the wire on long runs).
      if (!netlist) {
        const out: WorkerOutMsg = { type: 'history', traces: new Map() };
        (self as DedicatedWorkerGlobalScope).postMessage(out);
        return;
      }
      const traces = new Map<string, { tick: number; value: SignalValue }[]>();
      for (const pk of msg.portKeys) {
        const netId = netlist.portToNet.get(pk as never);
        if (!netId) continue;
        const samples: { tick: number; value: SignalValue }[] = [];
        for (const entry of historyBuffer) {
          const v = entry.nets.get(String(netId));
          if (v) samples.push({ tick: entry.tick, value: v });
        }
        traces.set(pk, samples);
      }
      const out: WorkerOutMsg = { type: 'history', traces };
      (self as DedicatedWorkerGlobalScope).postMessage(out);
      return;
    }
  }
};
