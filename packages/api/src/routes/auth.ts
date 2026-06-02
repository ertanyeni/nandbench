/**
 * Magic-link auth. Three endpoints:
 *
 *   POST /auth/request  { email }      → creates a token, prints the link
 *                                         (in dev) or emails it (later).
 *   GET  /auth/verify?token=…          → consumes the token, creates a
 *                                         session row, sets the cookie,
 *                                         and 302s back to the frontend.
 *   POST /auth/logout                  → clears the cookie + session.
 *
 * Token lifetime: 15 minutes. Session lifetime: 60 days.
 */

import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { query } from '../db.js';
import { sendMagicLink } from '../mailer.js';
import { clientIp, rateLimit } from '../rate-limit.js';
import { SESSION_COOKIE, randomToken } from '../session.js';

export const auth = new Hono();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MIN = 15;
const SESSION_TTL_DAYS = 60;

// Two stacked limiters: 5 requests / minute / IP and 3 requests / hour
// / email. The IP limit blunts spray attacks; the email limit blunts
// targeted mailbomb. Email is parsed once and cached on the context.
const ipLimit = rateLimit({
  keyFor: (c) => `auth:ip:${clientIp(c)}`,
  max: 5,
  windowMs: 60_000,
});
const emailLimit = rateLimit({
  keyFor: async (c) => {
    const email = await peekEmail(c);
    return email ? `auth:email:${email}` : null;
  },
  max: 3,
  windowMs: 60 * 60 * 1000,
});

// Hono caches the parsed body on the request, so calling `c.req.json()`
// from both the limiter and the handler reads it once. We still wrap
// in try/catch because malformed bodies should not throw out of
// middleware.
async function peekEmail(c: Context): Promise<string | null> {
  try {
    const body = (await c.req.json()) as { email?: string };
    return body?.email?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}

auth.post('/request', ipLimit, emailLimit, async (c) => {
  const email = await peekEmail(c);
  if (!email || !EMAIL_RE.test(email)) return c.json({ error: 'invalid email' }, 400);

  // Upsert user.
  await query(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO NOTHING`,
    [email],
  );

  const token = randomToken(24);
  await query(
    `INSERT INTO auth_tokens (token, email, expires_at)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [token, email, String(TOKEN_TTL_MIN)],
  );

  const apiBase = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4555}`;
  const link = `${apiBase}/auth/verify?token=${token}`;
  try {
    await sendMagicLink({ to: email, link });
  } catch (err) {
    // Mail delivery failed — surface a 503 so the client can show a
    // helpful message rather than silently pretending the link was
    // sent.
    // eslint-disable-next-line no-console
    console.error('[gatecraft-api] sendMagicLink failed', err);
    return c.json({ error: 'mail-failed' }, 503);
  }
  return c.json({ ok: true });
});

auth.get('/verify', async (c) => {
  const token = c.req.query('token');
  const frontend = process.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5175';
  if (!token) return c.redirect(`${frontend}/?auth=missing`);
  const { rows } = await query<{ email: string; used_at: string | null; expired: boolean }>(
    `SELECT email, used_at, (expires_at < now()) AS expired
     FROM auth_tokens WHERE token = $1`,
    [token],
  );
  const row = rows[0];
  if (!row || row.used_at || row.expired) {
    return c.redirect(`${frontend}/?auth=invalid`);
  }
  // Mark token used.
  await query('UPDATE auth_tokens SET used_at = now() WHERE token = $1', [token]);
  // Upsert user (defensive — should already exist) and stamp last_login.
  await query(
    `INSERT INTO users (email, last_login) VALUES ($1, now())
     ON CONFLICT (email) DO UPDATE SET last_login = now()`,
    [row.email],
  );
  // Create session.
  const sid = randomToken(32);
  await query('INSERT INTO sessions (id, email) VALUES ($1, $2)', [sid, row.email]);
  setCookie(c, SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_DAYS * 86_400,
    path: '/',
  });
  return c.redirect(`${frontend}/?auth=ok`);
});

auth.post('/logout', async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) await query('DELETE FROM sessions WHERE id = $1', [sid]);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});
