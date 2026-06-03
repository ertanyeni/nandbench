# nandbench self-host LLM stack

Optional Ollama-based AI assist endpoint. Runs on a single Hetzner box
(or any Docker host). The browser app only talks to this if the user has
explicitly enabled the "Self-host LLM" toggle in Settings — by default
the assistant remains 100% rule-based.

## Hardware

- 4 vCPU / 8 GB RAM is enough for Qwen 2.5 1.5B–3B or Llama 3.2 3B.
- 32 GB+ + GPU recommended for 13B+ models.
- Disk: 5 GB free per model.

## First run

```bash
# On the server
cd /home/deploy/nandbench/infra/llm
echo "NANDBENCH_LLM_TOKEN=$(openssl rand -hex 32)" > .env
docker compose up -d
docker compose exec ollama ollama pull qwen2.5:3b-instruct
```

Add the domain (e.g. `ai.nandbench.example`) to your DNS pointing at the
server, edit `Caddyfile` to use it, and Caddy will provision a TLS cert
on first request.

## Browser configuration

In nandbench → Toolbar ☰ → "AI provider":
- Endpoint: `https://ai.nandbench.example`
- Token: the value of `NANDBENCH_LLM_TOKEN`
- Model: `qwen2.5:3b-instruct`

Both fields stay in `localStorage`; they never round-trip through any
nandbench.app server.

## Security

- All traffic is over HTTPS (Caddy auto-provisions Let's Encrypt).
- Single-secret bearer token. Rotate by changing `.env` + restart Caddy.
- The endpoint exposes Ollama's full API surface — if you share the
  token, the holder can pull/run arbitrary models on your server. Treat
  it like any production credential.
- For a production setup, add a per-user rate limit (e.g. `rate_limit`
  Caddy plugin) and an Ollama model allow-list (already sketched in the
  Caddyfile comment).

## API contract

Browser → server:

```
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "model": "qwen2.5:3b-instruct",
  "messages": [{"role": "user", "content": "..."}],
  "stream": false
}
```

Server → browser: standard Ollama chat response. The app extracts
`message.content` from the first choice.
