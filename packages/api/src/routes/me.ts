/**
 * Signed-in user endpoints.
 *
 *   GET  /me           → { email } or 401
 *   GET  /me/circuits  → list of circuits the user owns
 *   POST /me/claim     { id, editToken } → set owner_email to current user
 */

import { Hono } from 'hono';
import { query } from '../db.js';
import { currentEmail } from '../session.js';

export const me = new Hono();

me.get('/', async (c) => {
  const email = await currentEmail(c);
  if (!email) return c.json({ error: 'unauthenticated' }, 401);
  return c.json({ email });
});

me.get('/circuits', async (c) => {
  const email = await currentEmail(c);
  if (!email) return c.json({ error: 'unauthenticated' }, 401);
  const { rows } = await query<{
    id: string;
    name: string;
    public: boolean;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, name, public, created_at, updated_at
     FROM circuits WHERE owner_email = $1
     ORDER BY updated_at DESC`,
    [email],
  );
  return c.json({ circuits: rows });
});

me.post('/claim', async (c) => {
  const email = await currentEmail(c);
  if (!email) return c.json({ error: 'unauthenticated' }, 401);
  const body = (await c.req.json().catch(() => null)) as
    | { id?: string; editToken?: string }
    | null;
  if (!body?.id || !body?.editToken) return c.json({ error: 'missing id/editToken' }, 400);
  const { rows } = await query<{ edit_token: string; owner_email: string | null }>(
    'SELECT edit_token, owner_email FROM circuits WHERE id = $1',
    [body.id],
  );
  const row = rows[0];
  if (!row) return c.json({ error: 'not found' }, 404);
  if (row.edit_token !== body.editToken) return c.json({ error: 'forbidden' }, 403);
  if (row.owner_email && row.owner_email !== email) {
    return c.json({ error: 'already claimed' }, 409);
  }
  await query(
    `UPDATE circuits SET owner_email = $1, updated_at = now() WHERE id = $2`,
    [email, body.id],
  );
  return c.json({ ok: true });
});
