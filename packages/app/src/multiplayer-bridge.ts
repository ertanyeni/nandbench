/**
 * Local app-side glue for @gatecraft/multiplayer. The adapter is loaded
 * lazily (dynamic import) so peers who never enable multiplayer don't
 * pay the Yjs bundle cost. Connection state lives in a module-local
 * variable since only one room can be active at a time per browser.
 */

import type { MultiplayerSession, SessionConfig } from '@gatecraft/multiplayer';
import type { CircuitDocument } from './model/document.js';
import { useAppStore } from './model/store.js';

let active: MultiplayerSession | null = null;
let unsubRemote: (() => void) | null = null;
let unsubLocal: (() => void) | null = null;

const CONFIG_KEY = 'gatecraft:multiplayer:v1';

export interface MultiplayerConfig {
  readonly endpoint: string;
  readonly room: string;
  readonly displayName: string;
  readonly color: string;
}

export function readMultiplayerConfig(): MultiplayerConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MultiplayerConfig>;
    if (parsed.endpoint && parsed.room && parsed.displayName && parsed.color) {
      return parsed as MultiplayerConfig;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeMultiplayerConfig(cfg: MultiplayerConfig | null): void {
  try {
    if (!cfg) localStorage.removeItem(CONFIG_KEY);
    else localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

export function isConnected(): boolean {
  return active !== null;
}

export async function connect(cfg: SessionConfig): Promise<void> {
  if (active) disconnect();
  const mod = await import('@gatecraft/multiplayer');
  const session = mod.joinSession(cfg);

  // Mirror local edits → Y.Doc.
  unsubLocal = useAppStore.subscribe((state, prev) => {
    if (state.document !== prev.document) {
      session.applyLocalDoc(state.document as Parameters<typeof session.applyLocalDoc>[0]);
    }
  });
  // Mirror remote edits → store. We bypass the command stack — remote
  // changes don't show up in local undo (intentional V1 simplification).
  unsubRemote = session.subscribeRemoteDoc((doc) => {
    useAppStore.setState({ document: doc as unknown as CircuitDocument });
  });
  // Seed the room with our current document.
  session.applyLocalDoc(useAppStore.getState().document as never);
  active = session;
}

export function disconnect(): void {
  if (!active) return;
  unsubLocal?.();
  unsubRemote?.();
  active.disconnect();
  active = null;
  unsubLocal = null;
  unsubRemote = null;
}
