/**
 * Bridge that pushes local edits up to the cloud when the user is
 * signed in (or holds an edit_token for an anonymous circuit) and a
 * cloud binding exists. Debounced to one PATCH every 800 ms.
 *
 * Also handles the initial `?c=<id>` URL parameter: if present, the
 * bridge fetches that circuit and replaces the local project with it,
 * so a share link "just works".
 */

import { useEffect } from 'react';
import { getCircuit, getEditToken, me, patchCircuit } from '../model/cloud-client.js';
import { snapshotCloudDoc } from '../model/cloud-snapshot.js';
import { useAppStore } from '../model/store.js';
import { restoreProject } from '../App.js';

const PATCH_DEBOUNCE_MS = 800;

export function CloudSyncBridge(): null {
  // One-shot bootstrap: load `?c=<id>` if present, then read the
  // current session to populate cloudEmail.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('c');
    void (async () => {
      try {
        const user = await me();
        useAppStore.getState().setCloudEmail(user?.email ?? null);
      } catch {
        /* ignore — API may not be reachable */
      }
      if (cid) {
        try {
          const c = await getCircuit(cid);
          restoreProject(c.doc.library, c.doc.locale, c.doc.project);
          useAppStore.getState().setCloudBinding({ id: c.id });
        } catch {
          /* swallow — invalid id or offline */
        }
      }
    })();
  }, []);

  // Debounced patcher.
  useEffect(() => {
    let timeout: number | undefined;
    const unsub = useAppStore.subscribe((state, prev) => {
      const ready =
        state.cloudCircuitId &&
        (state.cloudEmail || getEditToken(state.cloudCircuitId));
      if (!ready) return;
      const dirty =
        state.document !== prev.document ||
        state.documents !== prev.documents ||
        state.library !== prev.library ||
        state.locale !== prev.locale ||
        state.activeDocumentName !== prev.activeDocumentName;
      if (!dirty) return;
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        const id = useAppStore.getState().cloudCircuitId;
        if (!id) return;
        const doc = snapshotCloudDoc();
        const name = useAppStore.getState().activeDocumentName;
        void patchCircuit(id, { name, doc })
          .then(() => useAppStore.getState().setCloudBinding({ id }))
          .catch(() => {
            /* network blip — next change retries */
          });
      }, PATCH_DEBOUNCE_MS);
    });
    return () => {
      if (timeout) window.clearTimeout(timeout);
      unsub();
    };
  }, []);

  return null;
}
