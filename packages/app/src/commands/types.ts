/**
 * Command pattern — every document mutation is a Command with do/undo.
 *
 * This is what powers Faz 2's undo/redo and what will retrofit cleanly into
 * a CRDT log when Yjs collaboration lands (CLAUDE.md §6 / ARCHITECTURE §6).
 *
 * A Command sees only the document. UI-only state (viewport, selection,
 * tool) lives in the Zustand store and is NOT undoable.
 */

import type { CircuitDocument } from '../model/document.js';

export interface Command {
  /** Short label for debug + future history UI. */
  readonly label: string;
  /** Pure transform on the document. */
  apply(doc: CircuitDocument): CircuitDocument;
  /** Inverse transform — must reproduce the doc as it was before apply(). */
  revert(doc: CircuitDocument): CircuitDocument;
}
