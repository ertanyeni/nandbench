/**
 * Sim bridge — invisible component that wires the worker to the Zustand
 * store. Mount it once at the root and forget about it.
 *
 * Responsibilities:
 *   - Create the worker on mount, terminate on unmount.
 *   - Push every compiled-netlist change to the worker (`load`).
 *   - Pipe snapshots/diagnostics from the worker back into the store.
 *   - When `running` is true, drive a setInterval that posts tickClock at
 *     the user-selected rate; tear it down when stopped.
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../model/store.js';
import { createSimClient, type SimClient } from './sim-client.js';

export function SimBridge(): null {
  const clientRef = useRef<SimClient | null>(null);

  // Boot the worker once, terminate on teardown.
  useEffect(() => {
    const client = createSimClient();
    clientRef.current = client;
    // Expose so the toolbar (Step / Reset) can post one-shot messages
    // without needing a React context. Kept narrow on purpose.
    (window as unknown as { __sim: SimClient }).__sim = client;
    const unsubscribeSnapshot = client.onSnapshot((snap, diags, states) => {
      const s = useAppStore.getState();
      s.setSimSnapshot(snap, diags);
      s.setSimComponentStates(states);
    });
    // Push the initial compiled netlist (covers the case where a fixture is
    // pre-loaded at mount time).
    client.load(useAppStore.getState().compiled.netlist);
    return () => {
      unsubscribeSnapshot();
      client.dispose();
      clientRef.current = null;
    };
  }, []);

  // Reload the worker whenever the compiled netlist changes.
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (state.compiled.netlist !== prev.compiled.netlist) {
        clientRef.current?.load(state.compiled.netlist);
      }
    });
    return unsubscribe;
  }, []);

  // Run loop — setInterval keyed on (running, tickRate). Cleanup re-keys
  // when either changes.
  const running = useAppStore((s) => s.running);
  const tickRate = useAppStore((s) => s.tickRate);
  useEffect(() => {
    if (!running) return;
    const periodMs = Math.max(16, 1000 / tickRate);
    const id = window.setInterval(() => {
      clientRef.current?.tickClock();
    }, periodMs);
    return () => window.clearInterval(id);
  }, [running, tickRate]);

  return null;
}
