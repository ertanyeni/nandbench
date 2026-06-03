/**
 * nandbench cloud API — Hono app. Wires:
 *
 *   POST   /circuits         create (anonymous or authed)
 *   GET    /circuits/:id     read (public or owner)
 *   PATCH  /circuits/:id     update (edit_token or owner)
 *   DELETE /circuits/:id     delete (edit_token or owner)
 *
 *   POST   /auth/request     request a magic-link
 *   GET    /auth/verify      verify a magic-link → session cookie
 *   POST   /auth/logout      drop the current session
 *
 *   GET    /me               current session info
 *   GET    /me/circuits      list owned circuits
 *   POST   /me/claim         attach an anonymous circuit to the current user
 *
 *   GET    /health           liveness
 *
 * Route handlers are split across `routes/`.
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './routes/auth.js';
import { circuits } from './routes/circuits.js';
import { me } from './routes/me.js';

const app = new Hono();

// CORS — allow the production frontend + local dev. Wide-open for now;
// tighten via env when we have a real domain.
const allowed = (process.env.CORS_ORIGINS ?? 'http://localhost:5175').split(',');
app.use(
  '*',
  cors({
    origin: (origin) => (allowed.includes(origin) ? origin : null),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Edit-Token'],
  }),
);

app.get('/health', (c) => c.json({ ok: true }));
app.route('/circuits', circuits);
app.route('/auth', auth);
app.route('/me', me);

const port = Number(process.env.PORT ?? 4555);
serve({ fetch: app.fetch, port }, ({ port: p }) => {
  // eslint-disable-next-line no-console
  console.log(`[nandbench-api] listening on http://localhost:${p}`);
});

export default app;
