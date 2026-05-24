/**
 * Persistence bridge — autosave on document/library change.
 * Initial restore lives in App.tsx so the order is explicit (restore →
 * fall back to fixture).
 */

import { useEffect } from 'react';
import { FORMAT_VERSION, saveToStorage, type PersistedTab } from '../model/persistence.js';
import { useAppStore } from '../model/store.js';

const SAVE_DEBOUNCE_MS = 400;

export function PersistenceBridge(): null {
  useEffect(() => {
    let timeout: number | undefined;
    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (
        state.document !== prev.document ||
        state.library !== prev.library ||
        state.locale !== prev.locale ||
        state.activeDocumentId !== prev.activeDocumentId ||
        state.activeDocumentName !== prev.activeDocumentName ||
        state.documents !== prev.documents ||
        state.documentOrder !== prev.documentOrder
      ) {
        if (timeout) window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          saveToStorage({
            version: FORMAT_VERSION,
            library: state.library,
            locale: state.locale,
            project: snapshotProject(),
          });
        }, SAVE_DEBOUNCE_MS);
      }
    });
    // Cmd/Ctrl+S → immediate save + clear dirty marker. Browser's default
    // "save webpage" dialog is suppressed.
    const onKey = (ev: KeyboardEvent): void => {
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 's' || ev.key === 'S')) {
        ev.preventDefault();
        flushSave();
        // Auto-publish: if this tab isn't already backed by a saved
        // circuit, save it to the library too. Tabs that *are* already
        // bound (origin === library) get auto-synced by store.dispatch,
        // so we can skip them.
        const st = useAppStore.getState();
        if (!st.activeDocumentOrigin) {
          const id = st.publishActiveTab();
          st.setPublishedFlash({ id, name: st.activeDocumentName });
        } else {
          window.dispatchEvent(new Event('gatecraft:saved-toast'));
        }
        useAppStore.setState({ activeDocumentDirty: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      if (timeout) window.clearTimeout(timeout);
      window.removeEventListener('keydown', onKey);
      unsubscribe();
    };
  }, []);

  return null;
}

/**
 * Imperative: trigger an immediate save. Used by the export button so we
 * never download a stale snapshot.
 */
export function flushSave(): void {
  const s = useAppStore.getState();
  saveToStorage({
    version: FORMAT_VERSION,
    library: s.library,
    locale: s.locale,
    project: snapshotProject(),
  });
}

/**
 * Build a PersistedProject reflecting the live + frozen tabs in the store.
 * Only `document` and `name` round-trip — runtime sim/history state is
 * intentionally discarded.
 */
function snapshotProject(): {
  name: string;
  activeDocumentId: string;
  tabs: PersistedTab[];
} {
  const s = useAppStore.getState();
  const tabs: PersistedTab[] = s.documentOrder.map((id) => {
    if (id === s.activeDocumentId) {
      return { id, name: s.activeDocumentName, document: s.document };
    }
    const frozen = s.documents.get(id);
    if (!frozen) return { id, name: 'untitled', document: { components: [], wires: [] } };
    return { id, name: frozen.name, document: frozen.document };
  });
  return {
    name: 'Untitled',
    activeDocumentId: s.activeDocumentId,
    tabs,
  };
}
