# nandbench — Deployment notes

Living checklist for the **Hetzner box** + **optional services**.
Update as we ship. Order is intentional: app first, opt-in services
second, multiplayer last (still UI-incomplete in the client).

---

## 1. Web app — production deploy

Standard pattern from `~/.claude/CLAUDE.md`:

```bash
# First-time
deploy-new nandbench

# Subsequent
ssh server "cd ~/nandbench && git pull origin main \
  && pnpm install \
  && pnpm --filter @nandbench/app build \
  && docker compose build --no-cache \
  && docker compose up -d --force-recreate"
```

Build happens **on the server**. Locally we only `pnpm typecheck && pnpm
test`.

Vite output is a static bundle (`packages/app/dist/`) — serve via Caddy
with `try_files`. `docker-compose.yml` should mount the dist + a tiny
Caddy/nginx image.

DNS:

```bash
dns setup nandbench.example   # or whatever domain
```

`nandbench.example` + `www.nandbench.example` A records → server IP.
Caddy auto-provisions TLS.

---

## 2. Self-hosted LLM (opt-in AI provider)

**Status:** backend ready (`infra/llm/`), browser UI ready (`☰ → AI
provider…`). Not connected yet — runs only after the Hetzner stack is up.

```bash
ssh server
cd ~/nandbench/infra/llm
echo "NANDBENCH_LLM_TOKEN=$(openssl rand -hex 32)" > .env

# Edit Caddyfile: replace ai.nandbench.example with your real subdomain
# (or the placeholder if you already have a wildcard cert).

docker compose up -d
docker compose exec ollama ollama pull qwen2.5:3b-instruct
# Optional larger model (needs ~8 GB RAM):
# docker compose exec ollama ollama pull llama3.2:3b-instruct
```

DNS:

```bash
dns add ai.nandbench.example
```

Caddy `ai.nandbench.example` block (already in `infra/llm/Caddyfile`):

```caddyfile
ai.nandbench.example {
    @authorized header Authorization "Bearer {$NANDBENCH_LLM_TOKEN}"
    handle @authorized {
        reverse_proxy ollama:11434 {
            transport http { read_timeout 120s }
        }
    }
    respond 401
}
```

Caddy restart:

```bash
docker compose -f ~/infrastructure/docker-compose.yml restart caddy
# or, if Caddy is co-located in the LLM stack:
docker compose restart caddy
```

**Client setup (browser):**
- App → toolbar ☰ → **AI provider…**
- Endpoint: `https://ai.nandbench.example`
- Token: contents of `.env` (`NANDBENCH_LLM_TOKEN`)
- Model: `qwen2.5:3b-instruct`

Token stays in localStorage only; never sent to nandbench itself.

**Verification:**
- Open Assistant panel
- Each card now has a `✦ Ask LLM` footer button
- Click → LLM reply renders in a purple-bordered box

If the request hangs: check `docker compose logs ollama` for pull
state. The first request after a model swap can take 30–60 s while
Ollama hot-loads the weights.

---

## 3. Real-time multiplayer (deferred — backend only)

**Status:**
- ✅ Backend ready (`packages/multiplayer/server/index.ts`)
- ✅ Browser adapter ready (`packages/multiplayer/src/index.ts`)
- ✅ App-side glue ready (`packages/app/src/multiplayer-bridge.ts`)
- ⏸ **Toolbar UI deferred** — no "Share…" button yet. Backend is
  callable from `connect()` if you want to dogfood by typing in the
  console.

Will resurface when we focus on collaboration. Until then:

```bash
# Reference setup for future-us — DO NOT run yet, no client UI hooks.
ssh server
cd ~/nandbench
pnpm install
PORT=4444 pnpm --filter @nandbench/multiplayer server
```

DNS:

```bash
dns add mp.nandbench.example
```

Caddy block:

```caddyfile
mp.nandbench.example {
    reverse_proxy localhost:4444
}
```

**To resume:**
1. Add a "Share…" entry to `Toolbar` overflow menu.
2. Build `MultiplayerConnectModal` (endpoint, room, displayName, color).
3. Wire `connect(cfg)` / `disconnect()` from `multiplayer-bridge.ts`.
4. Add remote-cursor rendering pass to `canvas2d.ts` (read awareness
   states, draw per-peer triangle + label).
5. Decide undo isolation policy (V1 = global, V2 = per-user).

---

## Service inventory

| Service | Domain (suggested) | Port | Status |
|---|---|---|---|
| Web app (Vite build) | `nandbench.example` | 443 (Caddy) | not deployed |
| LLM proxy (Ollama via Caddy) | `ai.nandbench.example` | 443 | backend ready, awaits Hetzner |
| Multiplayer relay | `mp.nandbench.example` | 443 (WSS) | backend ready, **client UI pending** |

---

## Local dev parity

For testing the LLM bridge locally without Hetzner:

```bash
# Mac / Linux dev box
brew install ollama   # or use the official Ollama installer
ollama pull qwen2.5:1.5b-instruct
ollama serve          # default port 11434

# In nandbench → AI provider…:
# Endpoint: http://localhost:11434
# Token: anything (Ollama doesn't require auth by default)
# Model: qwen2.5:1.5b-instruct
```

Be aware: local Ollama exposes no auth, so don't bind it publicly.
