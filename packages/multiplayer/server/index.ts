#!/usr/bin/env node
/**
 * Minimal y-websocket relay for nandbench rooms.
 *
 * Drop this on the Hetzner box (or any Node host):
 *   cd packages/multiplayer
 *   PORT=4444 pnpm server
 *
 * Caddy / nginx in front for TLS termination is recommended. The relay
 * stores nothing on disk — disconnect a room and it's gone. Persistent
 * room state belongs in the browser's localStorage or a future Postgres
 * adapter.
 */

import { createServer } from 'node:http';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT ?? 4444);
const host = process.env.HOST ?? '0.0.0.0';

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('nandbench y-websocket relay — connect via ws://host:port/<room>\n');
});

const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (conn, req) => {
  const url = req.url ?? '/';
  const room = url.slice(1).split('?')[0] || 'default';
  // y-websocket's setupWSConnection expects a docName as 2nd arg.
  setupWSConnection(conn, req, { docName: room, gc: true });
});

httpServer.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

httpServer.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`[nandbench multiplayer] listening on ws://${host}:${port}/<room>`);
});
