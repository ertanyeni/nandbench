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

import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { query } from '../db.js';
import { SESSION_COOKIE, randomToken } from '../session.js';

export const auth = new Hono();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MIN = 15;
const SESSION_TTL_DAYS = 60;

auth.post('/request', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
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
  // In production, this is where we'd send the email. For dev we log it
  // so the developer can click it from the terminal.
  // eslint-disable-next-line no-console
  console.log(`[gatecraft-api] magic link for ${email}: ${link}`);
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
