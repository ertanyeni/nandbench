# @nandbench/multiplayer

Yjs-based real-time collaboration. Self-host the relay; the browser app
opts in via Toolbar → "Share". V1 syncs document content + cursor
awareness; runtime state (selection, viewport, sim snapshot) stays local
to each peer.

## Layout

- `src/index.ts` — browser adapter. `joinSession({ endpoint, room, ... })`
  returns hooks the app uses to mirror its `document` into a `Y.Doc` and
  receive remote edits.
- `server/index.ts` — minimal Node + y-websocket relay. No persistence;
  rooms vanish when empty.

## Run the relay (Hetzner)

```bash
cd /home/deploy/nandbench
pnpm install
pnpm --filter @nandbench/multiplayer server     # listens on :4444 by default
```

Put Caddy in front for TLS:

```
mp.nandbench.example {
    reverse_proxy localhost:4444
}
```

## Connect from the app

In nandbench → Toolbar ☰ → "Multiplayer…" set:
- WebSocket URL: `wss://mp.nandbench.example`
- Room: any string (the URL fragment people share)
- Display name + color: shown on other peers' cursors

Two browsers in the same room see each other's edits + cursors. Close
the tab — relay drops you. Reload — you reconnect to the room.

## Status (V1 scope)

- ✅ Document content (components + wires) sync
- ✅ Awareness cursors
- ❌ No persistence — room is empty on the first connect
- ❌ No undo isolation — your undo can undo a remote edit
- ❌ No ACLs — anyone with the room name + relay URL can edit

Roadmap: server-side persistence (postgres + y-leveldb), per-room
ACL/tokens, undo-per-user via Y.UndoManager scopes.
