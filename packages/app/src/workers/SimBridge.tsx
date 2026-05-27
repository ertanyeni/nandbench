/**
 * Sim bridge — invisible component that wires the simulation worker(s)
 * to the Zustand store. Mount once at the root and forget.
 *
 * Responsibilities:
 *   - Create the **main** sim worker on mount, terminate on unmount.
 *   - Create / dispose a **split** sim worker on demand when the editor's
 *     `splitView` toggle flips, so two unrelated tabs can simulate in
 *     parallel.
 *   - Push every compiled-netlist change (per pane) to its worker.
 *   - Pipe snapshots/diagnostics back into the matching store slice.
 *   - Drive a per-pane setInterval at the user-selected tick rate.
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../model/store.js';
import { createSimClient, type SimClient } from './sim-client.js';

export function SimBridge(): null {
  /* -------- Main pane sim worker -------- */
  const mainRef = useRef<SimClient | null>(null);

  useEffect(() => {
    const client = createSimClient();
    mainRef.current = client;
    (window as unknown as { __sim: SimClient }).__sim = client;
    const unsubscribeSnapshot = client.onSnapshot((snap, diags, states) => {
      const s = useAppStore.getState();
      s.setSimSnapshot(snap, diags);
      s.setSimComponentStates(states);
    });
    client.load(useAppStore.getState().compiled.netlist);
    return () => {
      unsubscribeSnapshot();
      client.dispose();
      mainRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (state.compiled.netlist !== prev.compiled.netlist) {
        mainRef.current?.load(state.compiled.netlist);
      }
    });
    return unsubscribe;
  }, []);

  const running = useAppStore((s) => s.running);
  const tickRate = useAppStore((s) => s.tickRate);
  useEffect(() => {
    if (!running) return;
    const periodMs = Math.max(16, 1000 / tickRate);
    const id = window.setInterval(() => {
      mainRef.current?.tickClock();
    }, periodMs);
    return () => window.clearInterval(id);
  }, [running, tickRate]);

  /* -------- Split pane sim worker (lazy) -------- */
  // Lifecycle: spawn the worker the first time `splitView` flips to true,
  // dispose when it flips back to false. Subsequent re-opens spin up a
  // fresh worker. The split netlist (`splitCompiled`) feeds it directly.
  const splitRef = useRef<SimClient | null>(null);
  const splitView = useAppStore((s) => s.splitView);

  useEffect(() => {
    if (!splitView) return;
    const client = createSimClient();
    splitRef.current = client;
    (window as unknown as { __splitSim?: SimClient }).__splitSim = client;
    const unsubscribeSnapshot = client.onSnapshot((snap, diags, states) => {
      const s = useAppStore.getState();
      s.setSplitSimSnapshot(snap, diags);
      s.setSplitSimComponentStates(states);
    });
    // Prime with whatever the split pane is currently pointing at.
    client.load(useAppStore.getState().splitCompiled.netlist);
    return () => {
      unsubscribeSnapshot();
      client.dispose();
      splitRef.current = null;
      delete (window as unknown as { __splitSim?: SimClient }).__splitSim;
    };
  }, [splitView]);

  // Reload split worker whenever its compiled netlist changes (pin
  // changed, split-edit dispatched, undo, redo).
  useEffect(() => {
    if (!splitView) return;
    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (state.splitCompiled.netlist !== prev.splitCompiled.netlist) {
        splitRef.current?.load(state.splitCompiled.netlist);
      }
    });
    return unsubscribe;
  }, [splitView]);

  // Independent tick loop for the split pane. Shares the global tickRate
  // for simplicity — per-pane rate would multiply UI surface area.
  const splitRunning = useAppStore((s) => s.splitRunning);
  useEffect(() => {
    if (!splitView || !splitRunning) return;
    const periodMs = Math.max(16, 1000 / tickRate);
    const id = window.setInterval(() => {
      splitRef.current?.tickClock();
    }, periodMs);
    return () => window.clearInterval(id);
  }, [splitView, splitRunning, tickRate]);

  return null;
}
