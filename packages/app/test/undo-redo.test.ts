/**
 * Undo/redo + history bookkeeping behavior on the Zustand store.
 *
 * Covers:
 *   - Multi-step dispatch builds a history stack
 *   - undo() pops in reverse order
 *   - redo() reapplies in original order
 *   - dispatch() after undo() drops the redo stack
 *   - History is bounded — HISTORY_CAP keeps memory finite
 *   - canUndo / canRedo flags reflect stack sizes
 */

import { asComponentId, type ComponentId } from '@gatecraft/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddComponentCommand, DeleteCommand } from '../src/commands/index.js';
import { type VisualComponent } from '../src/model/document.js';
import { IDLE_TOOL, INITIAL_VIEWPORT, useAppStore } from '../src/model/store.js';

function comp(id: string, x = 0, y = 0): VisualComponent {
  return {
    id: asComponentId(id),
    kind: 'and',
    params: { width: 1, inputs: 2 },
    position: { x, y },
    rotation: 0,
  };
}

function reset(): void {
  useAppStore.setState({
    document: { components: [], wires: [] },
    selection: { componentIds: new Set() },
    tool: IDLE_TOOL,
    viewport: INITIAL_VIEWPORT,
    history: [],
    redoStack: [],
  });
}

describe('store undo/redo', () => {
  beforeEach(() => reset());

  it('multi-step dispatch builds a history stack', () => {
    const s = useAppStore.getState();
    s.dispatch(new AddComponentCommand(comp('a')));
    s.dispatch(new AddComponentCommand(comp('b', 100, 0)));
    s.dispatch(new AddComponentCommand(comp('c', 200, 0)));
    expect(useAppStore.getState().history).toHaveLength(3);
    expect(useAppStore.getState().document.components).toHaveLength(3);
  });

  it('undo pops the most recent command and reverts the doc', () => {
    const s = useAppStore.getState();
    s.dispatch(new AddComponentCommand(comp('a')));
    s.dispatch(new AddComponentCommand(comp('b', 100, 0)));
    expect(useAppStore.getState().document.components).toHaveLength(2);
    useAppStore.getState().undo();
    expect(useAppStore.getState().document.components).toHaveLength(1);
    expect(useAppStore.getState().document.components[0]!.id).toBe(asComponentId('a'));
  });

  it('undo then redo restores the previous state', () => {
    const s = useAppStore.getState();
    s.dispatch(new AddComponentCommand(comp('a')));
    s.dispatch(new AddComponentCommand(comp('b', 100, 0)));
    useAppStore.getState().undo();
    useAppStore.getState().redo();
    expect(useAppStore.getState().document.components).toHaveLength(2);
    expect(useAppStore.getState().redoStack).toHaveLength(0);
  });

  it('dispatch after undo clears the redo stack', () => {
    const s = useAppStore.getState();
    s.dispatch(new AddComponentCommand(comp('a')));
    s.dispatch(new AddComponentCommand(comp('b', 100, 0)));
    useAppStore.getState().undo();
    expect(useAppStore.getState().redoStack).toHaveLength(1);
    // Now we branch — push a new command, redo should disappear.
    useAppStore.getState().dispatch(new AddComponentCommand(comp('c', 200, 0)));
    expect(useAppStore.getState().redoStack).toHaveLength(0);
  });

  it('canUndo / canRedo flags reflect stack sizes', () => {
    expect(useAppStore.getState().canUndo()).toBe(false);
    expect(useAppStore.getState().canRedo()).toBe(false);
    useAppStore.getState().dispatch(new AddComponentCommand(comp('a')));
    expect(useAppStore.getState().canUndo()).toBe(true);
    expect(useAppStore.getState().canRedo()).toBe(false);
    useAppStore.getState().undo();
    expect(useAppStore.getState().canUndo()).toBe(false);
    expect(useAppStore.getState().canRedo()).toBe(true);
  });

  it('history bounded — large bursts drop the oldest entries', () => {
    const s = useAppStore.getState();
    // Push way past HISTORY_CAP (200) — we just confirm it doesn't grow
    // unbounded. The cap value is implementation detail; just assert it
    // didn't store more than the total bursts.
    for (let i = 0; i < 250; i++) {
      s.dispatch(new AddComponentCommand(comp(`x${i}`, i * 10, 0)));
    }
    const len = useAppStore.getState().history.length;
    expect(len).toBeLessThanOrEqual(250);
    // Confirm it actually capped (a non-capped run would store all 250).
    expect(len).toBeLessThan(250);
  });

  it('delete then undo restores the component back to the doc', () => {
    const id = asComponentId('a');
    useAppStore.setState({ document: { components: [comp('a')], wires: [] } });
    useAppStore.getState().dispatch(new DeleteCommand([comp('a')], []));
    expect(useAppStore.getState().document.components).toHaveLength(0);
    useAppStore.getState().undo();
    expect(useAppStore.getState().document.components).toHaveLength(1);
    expect(useAppStore.getState().document.components[0]!.id).toBe(id);
  });
});
