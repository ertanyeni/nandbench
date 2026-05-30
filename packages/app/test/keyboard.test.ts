/**
 * Direct unit tests for the keyboard helpers. We don't simulate key
 * presses — `attachCanvasController` is responsible for the binding,
 * already covered by canvas-controller.test.ts. Here we just call the
 * exported helpers on a controlled store fixture and verify the
 * resulting document/selection/history.
 */

import { asComponentId, type ComponentId } from '@gatecraft/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  copySelection,
  deleteSelected,
  duplicateSelection,
  nudge,
  pasteClipboard,
  rotateSelected,
  selectAll,
} from '../src/interaction/keyboard.js';
import { type VisualComponent } from '../src/model/document.js';
import { IDLE_TOOL, INITIAL_VIEWPORT, useAppStore } from '../src/model/store.js';

function comp(id: string, kind: string, x: number, y: number): VisualComponent {
  return {
    id: asComponentId(id),
    kind,
    params:
      kind === 'and' || kind === 'or'
        ? { width: 1, inputs: 2 }
        : { width: 1 },
    position: { x, y },
    rotation: 0,
  };
}

function resetWith(components: readonly VisualComponent[], selectedIds: readonly ComponentId[] = []): void {
  useAppStore.setState({
    document: { components: [...components], wires: [] },
    selection: { componentIds: new Set(selectedIds) },
    tool: IDLE_TOOL,
    viewport: INITIAL_VIEWPORT,
    history: [],
    redoStack: [],
    clipboard: null,
  });
}

describe('keyboard helpers', () => {
  beforeEach(() => {
    resetWith([]);
  });

  it('selectAll selects every component on the canvas', () => {
    resetWith([comp('a', 'and', 0, 0), comp('b', 'or', 100, 100), comp('c', 'input', 200, 0)]);
    selectAll();
    expect(useAppStore.getState().selection.componentIds.size).toBe(3);
  });

  it('rotateSelected (cw) advances rotation by 90° via a command', () => {
    const id = asComponentId('a');
    resetWith([comp('a', 'and', 0, 0)], [id]);
    rotateSelected('cw');
    const after = useAppStore.getState().document.components.find((c) => c.id === id);
    expect(after?.rotation).toBe(90);
    expect(useAppStore.getState().history).toHaveLength(1);
  });

  it('rotateSelected (ccw) wraps to 270 from 0', () => {
    const id = asComponentId('a');
    resetWith([comp('a', 'and', 0, 0)], [id]);
    rotateSelected('ccw');
    const after = useAppStore.getState().document.components.find((c) => c.id === id);
    expect(after?.rotation).toBe(270);
  });

  it('rotateSelected with empty selection is a no-op', () => {
    resetWith([comp('a', 'and', 0, 0)]);
    rotateSelected('cw');
    expect(useAppStore.getState().history).toHaveLength(0);
  });

  it('nudge translates every selected component by N grid units', () => {
    const id = asComponentId('a');
    resetWith([comp('a', 'and', 100, 100)], [id]);
    nudge(1, 0);
    const after = useAppStore.getState().document.components.find((c) => c.id === id);
    expect(after?.position.x).toBeGreaterThan(100);
    // history should contain a MoveComponentsCommand
    expect(useAppStore.getState().history).toHaveLength(1);
  });

  it('deleteSelected removes selected components and pushes a Delete command', () => {
    const id = asComponentId('a');
    resetWith([comp('a', 'and', 0, 0), comp('b', 'or', 100, 0)], [id]);
    deleteSelected();
    const docs = useAppStore.getState().document.components;
    expect(docs).toHaveLength(1);
    expect(docs[0]!.id).toBe(asComponentId('b'));
    expect(useAppStore.getState().history).toHaveLength(1);
  });

  it('copySelection + pasteClipboard duplicates components with fresh ids', () => {
    const idA = asComponentId('a');
    resetWith([comp('a', 'and', 100, 100)], [idA]);
    copySelection();
    // Clipboard should be populated.
    expect(useAppStore.getState().clipboard).not.toBeNull();
    pasteClipboard({ x: 300, y: 300 });
    const docs = useAppStore.getState().document.components;
    expect(docs).toHaveLength(2);
    // New paste must have a different id.
    expect(docs[1]!.id).not.toBe(idA);
    // Selection moved to the pasted component(s).
    expect(useAppStore.getState().selection.componentIds.has(docs[1]!.id)).toBe(true);
  });

  it('duplicateSelection clones + selects the new copy in one step', () => {
    const idA = asComponentId('a');
    resetWith([comp('a', 'and', 100, 100)], [idA]);
    duplicateSelection();
    const docs = useAppStore.getState().document.components;
    expect(docs).toHaveLength(2);
    // History records the paste as a single command.
    expect(useAppStore.getState().history).toHaveLength(1);
    // Selection is the duplicate.
    const selIds = [...useAppStore.getState().selection.componentIds];
    expect(selIds).toContain(docs[1]!.id);
  });

  it('pasteClipboard with no clipboard is a no-op', () => {
    resetWith([comp('a', 'and', 0, 0)]);
    pasteClipboard();
    expect(useAppStore.getState().document.components).toHaveLength(1);
    expect(useAppStore.getState().history).toHaveLength(0);
  });
});
