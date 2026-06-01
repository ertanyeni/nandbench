/**
 * Cookie-backed session helpers shared by auth + me routes. We keep the
 * surface minimal: read the `gc_session` cookie, look it up in the DB,
 * and return the bound email (or null).
 */

import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { query } from './db.js';

export const SESSION_COOKIE = 'gc_session';

export async function currentEmail(c: Context): Promise<string | null> {
  const sid = getCookie(c, SESSION_COOKIE);
  if (!sid) return null;
  const { rows } = await query<{ email: string }>(
    `UPDATE sessions
     SET last_seen = now()
     WHERE id = $1
     RETURNING email`,
    [sid],
  );
  return rows[0]?.email ?? null;
}

export function randomToken(bytes = 32): string {
  // Node's web crypto is available globally on 20+.
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  // base64url
  return Buffer.from(arr)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
