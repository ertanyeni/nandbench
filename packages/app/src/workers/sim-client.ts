/**
 * Main-thread façade in front of the simulation worker.
 *
 * Owns the Worker instance, posts typed messages, fans out snapshot events
 * to subscribers (the Zustand store wires itself up here). Singletons —
 * one worker per app instance.
 */

import type {
  CompiledNetlist,
  ComponentId,
  Diagnostic,
  PortRef,
  SignalValue,
  SimSnapshot,
} from '@gatecraft/engine';
import SimWorkerCtor from './sim.worker?worker';
import type { WorkerInMsg, WorkerOutMsg } from './sim.worker.js';

export type SnapshotHandler = (
  snapshot: SimSnapshot,
  diagnostics: readonly Diagnostic[],
  componentStates: ReadonlyMap<ComponentId, unknown>,
) => void;

export type HistoryHandler = (
  traces: ReadonlyMap<string, readonly { tick: number; value: SignalValue }[]>,
) => void;

export interface SimClient {
  load(netlist: CompiledNetlist): void;
  setInput(port: PortRef, value: SignalValue): void;
  tickClock(): void;
  settle(): void;
  onSnapshot(handler: SnapshotHandler): () => void;
  /** Request a one-shot snapshot of the worker's recent ring buffer. */
  requestHistory(portKeys: readonly string[]): void;
  onHistory(handler: HistoryHandler): () => void;
  dispose(): void;
}

export function createSimClient(): SimClient {
  const worker = new SimWorkerCtor();
  const handlers = new Set<SnapshotHandler>();
  const historyHandlers = new Set<HistoryHandler>();
  worker.onmessage = (ev: MessageEvent<WorkerOutMsg>) => {
    const msg = ev.data;
    if (msg.type === 'snapshot') {
      for (const h of handlers) h(msg.snapshot, msg.diagnostics, msg.componentStates);
    } else if (msg.type === 'history') {
      for (const h of historyHandlers) h(msg.traces);
    }
  };
  const post = (m: WorkerInMsg): void => worker.postMessage(m);
  return {
    load: (netlist) => post({ type: 'load', netlist }),
    setInput: (port, value) => post({ type: 'setInput', port, value }),
    tickClock: () => post({ type: 'tickClock' }),
    settle: () => post({ type: 'settle' }),
    requestHistory: (portKeys) => post({ type: 'requestHistory', portKeys }),
    onSnapshot: (h) => {
      handlers.add(h);
      return () => {
        handlers.delete(h);
      };
    },
    onHistory: (h) => {
      historyHandlers.add(h);
      return () => {
        historyHandlers.delete(h);
      };
    },
    dispose: () => worker.terminate(),
  };
}
