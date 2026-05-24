/**
 * Yjs adapter — keeps a CircuitDocument in sync with a Y.Doc so multiple
 * browsers editing the same room converge.
 *
 * Design constraints (V1):
 *   - The local Zustand store remains the source of truth for *runtime*
 *     state (selection, viewport, sim snapshot). Only `document` content
 *     (components + wires) is mirrored into Y.Doc.
 *   - Components are stored in a `Y.Map<ComponentId, Y.Map<…>>`, wires
 *     likewise. The serialized shape inside each Y.Map matches the
 *     persistence v3 schema so round-tripping is lossless.
 *   - Awareness (`Y.Awareness`) carries cursor world position + display
 *     name + color per peer.
 *
 * Higher-level (Y.XmlFragment, splines, etc.) is overkill for the model.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { CircuitDocument, VisualComponent, VisualWire } from './shared-types.js';

export interface SessionConfig {
  readonly endpoint: string; // ws://... or wss://...
  readonly room: string;
  readonly displayName: string;
  readonly color: string;
}

export interface AwarenessState {
  readonly name: string;
  readonly color: string;
  readonly cursor: { x: number; y: number } | null;
}

export interface MultiplayerSession {
  readonly doc: Y.Doc;
  readonly provider: WebsocketProvider;
  readonly applyLocalDoc: (doc: CircuitDocument) => void;
  readonly subscribeRemoteDoc: (cb: (doc: CircuitDocument) => void) => () => void;
  readonly updateCursor: (cursor: { x: number; y: number } | null) => void;
  readonly subscribeAwareness: (cb: (peers: ReadonlyMap<number, AwarenessState>) => void) => () => void;
  readonly disconnect: () => void;
}

export function joinSession(config: SessionConfig): MultiplayerSession {
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(config.endpoint, config.room, doc);
  const componentsMap = doc.getMap<Y.Map<unknown>>('components');
  const wiresMap = doc.getMap<Y.Map<unknown>>('wires');

  // Seed our awareness slot.
  provider.awareness.setLocalState({
    name: config.displayName,
    color: config.color,
    cursor: null,
  } satisfies AwarenessState);

  /**
   * Write the local document into the Y.Doc. Y.Maps don't have a "replace
   * everything atomically" affordance, so we diff: add missing entries,
   * update changed ones, delete removed ones — all inside a transaction
   * so peers see one update.
   */
  const applyLocalDoc = (newDoc: CircuitDocument): void => {
    doc.transact(() => {
      // Components.
      const seenComps = new Set<string>();
      for (const c of newDoc.components) {
        seenComps.add(c.id);
        const ymap = componentsMap.get(c.id) ?? new Y.Map();
        ymap.set('id', c.id);
        ymap.set('kind', c.kind);
        ymap.set('params', JSON.stringify(c.params));
        ymap.set('position', JSON.stringify(c.position));
        ymap.set('rotation', c.rotation);
        if (!componentsMap.has(c.id)) componentsMap.set(c.id, ymap);
      }
      for (const id of [...componentsMap.keys()]) {
        if (!seenComps.has(id)) componentsMap.delete(id);
      }
      // Wires.
      const seenWires = new Set<string>();
      for (const w of newDoc.wires) {
        seenWires.add(w.id);
        const ymap = wiresMap.get(w.id) ?? new Y.Map();
        ymap.set('id', w.id);
        ymap.set('endpoints', JSON.stringify(w.endpoints));
        ymap.set('path', JSON.stringify(w.path));
        if (!wiresMap.has(w.id)) wiresMap.set(w.id, ymap);
      }
      for (const id of [...wiresMap.keys()]) {
        if (!seenWires.has(id)) wiresMap.delete(id);
      }
    }, { origin: 'local' });
  };

  const readRemoteDoc = (): CircuitDocument => {
    const components: VisualComponent[] = [];
    for (const ymap of componentsMap.values()) {
      components.push({
        id: ymap.get('id') as VisualComponent['id'],
        kind: String(ymap.get('kind')),
        params: JSON.parse(String(ymap.get('params') ?? '{}')) as VisualComponent['params'],
        position: JSON.parse(String(ymap.get('position') ?? '{}')) as VisualComponent['position'],
        rotation: Number(ymap.get('rotation') ?? 0) as VisualComponent['rotation'],
      });
    }
    const wires: VisualWire[] = [];
    for (const ymap of wiresMap.values()) {
      wires.push({
        id: ymap.get('id') as VisualWire['id'],
        endpoints: JSON.parse(String(ymap.get('endpoints') ?? '[]')) as VisualWire['endpoints'],
        path: JSON.parse(String(ymap.get('path') ?? '[]')) as VisualWire['path'],
      });
    }
    return { components, wires };
  };

  const subscribeRemoteDoc = (cb: (doc: CircuitDocument) => void): (() => void) => {
    const handler = (_ev: unknown, transaction: Y.Transaction): void => {
      // Don't echo our own writes back into the store.
      if (transaction.origin === 'local') return;
      cb(readRemoteDoc());
    };
    componentsMap.observeDeep(handler);
    wiresMap.observeDeep(handler);
    return () => {
      componentsMap.unobserveDeep(handler);
      wiresMap.unobserveDeep(handler);
    };
  };

  const updateCursor = (cursor: { x: number; y: number } | null): void => {
    provider.awareness.setLocalStateField('cursor', cursor);
  };

  const subscribeAwareness = (
    cb: (peers: ReadonlyMap<number, AwarenessState>) => void,
  ): (() => void) => {
    const handler = (): void => {
      const peers = new Map<number, AwarenessState>();
      provider.awareness.getStates().forEach((s, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        peers.set(clientId, s as AwarenessState);
      });
      cb(peers);
    };
    provider.awareness.on('change', handler);
    handler();
    return () => provider.awareness.off('change', handler);
  };

  const disconnect = (): void => {
    provider.disconnect();
    provider.destroy();
  };

  return {
    doc,
    provider,
    applyLocalDoc,
    subscribeRemoteDoc,
    updateCursor,
    subscribeAwareness,
    disconnect,
  };
}
