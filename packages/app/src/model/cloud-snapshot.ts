/**
 * Snapshot the live store into a CloudDoc suitable for the API and the
 * inverse: load a CloudDoc back into the store.
 *
 * Cloud sync is at the *project* granularity — every tab, the library,
 * and the locale travel together. That mirrors the local autosave so
 * users see the same thing from any machine.
 */

import type { CircuitDocument } from './document.js';
import { FORMAT_VERSION, type PersistedProject, type PersistedTab } from './persistence.js';
import type { CloudDoc } from './cloud-client.js';
import { useAppStore } from './store.js';

export function snapshotCloudDoc(): CloudDoc {
  const s = useAppStore.getState();
  const tabs: PersistedTab[] = s.documentOrder.map((id) => {
    if (id === s.activeDocumentId) {
      return { id, name: s.activeDocumentName, document: s.document };
    }
    const frozen = s.documents.get(id);
    if (!frozen) {
      const empty: CircuitDocument = { components: [], wires: [] };
      return { id, name: 'untitled', document: empty };
    }
    return { id, name: frozen.name, document: frozen.document };
  });
  const project: PersistedProject = {
    name: s.activeDocumentName,
    activeDocumentId: s.activeDocumentId,
    tabs,
  };
  return {
    version: FORMAT_VERSION,
    project,
    library: s.library,
    locale: s.locale,
  };
}
