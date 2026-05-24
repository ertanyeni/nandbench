/**
 * Shim — y-websocket ships CJS internals without bundled types.
 * setupWSConnection signature documented at
 * https://github.com/yjs/y-websocket/blob/main/bin/utils.cjs.
 */
declare module 'y-websocket/bin/utils' {
  import type { IncomingMessage } from 'node:http';
  import type { WebSocket } from 'ws';
  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    opts?: { docName?: string; gc?: boolean },
  ): void;
}
