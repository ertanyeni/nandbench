/**
 * Circuit CRUD endpoints. Anonymous-friendly: any client can POST to
 * create one and edit it via the returned `editToken`. Once a user
 * claims a circuit (POST /me/claim) the `owner_email` column is set
 * and the user's session also grants edit access.
 */

import { Hono } from 'hono';
import { query } from '../db.js';
import { currentEmail, randomToken } from '../session.js';

interface CircuitRow {
  id: string;
  name: string;
  edit_token: string;
  owner_email: string | null;
  doc: unknown;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export const circuits = new Hono();

// ----- POST /circuits — create -----
circuits.post('/', async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | { name?: string; doc?: unknown; public?: boolean }
    | null;
  if (!body || !body.doc) return c.json({ error: 'missing doc' }, 400);
  const email = await currentEmail(c);
  const id = crypto.randomUUID();
  const editToken = randomToken(24);
  await query(
    `INSERT INTO circuits (id, name, edit_token, owner_email, doc, public)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [id, body.name ?? 'Untitled', editToken, email, JSON.stringify(body.doc), body.public ?? false],
  );
  return c.json({ id, editToken });
});

// ----- GET /circuits/:id — read -----
circuits.get('/:id', async (c) => {
  const id = c.req.param('id');
  const { rows } = await query<CircuitRow>('SELECT * FROM circuits WHERE id = $1', [id]);
  const row = rows[0];
  if (!row) return c.json({ error: 'not found' }, 404);
  const email = await currentEmail(c);
  const isOwner = row.owner_email && row.owner_email === email;
  const isPublic = row.public;
  if (!isPublic && !isOwner) {
    // Owner-private. Allow if the caller still holds the edit_token (the
    // creator on the same browser).
    const edit = c.req.header('x-edit-token');
    if (edit !== row.edit_token) return c.json({ error: 'forbidden' }, 403);
  }
  // Touch last_access for cleanup of dead anon circuits.
  await query('UPDATE circuits SET last_access = now() WHERE id = $1', [id]);
  return c.json({
    id: row.id,
    name: row.name,
    doc: row.doc,
    public: row.public,
    ownerEmail: row.owner_email,
    canEdit: Boolean(isOwner) || c.req.header('x-edit-token') === row.edit_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// ----- PATCH /circuits/:id — update -----
circuits.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => null)) as
    | { name?: string; doc?: unknown; public?: boolean }
    | null;
  if (!body) return c.json({ error: 'missing body' }, 400);
  const { rows } = await query<CircuitRow>(
    'SELECT edit_token, owner_email FROM circuits WHERE id = $1',
    [id],
  );
  const row = rows[0];
  if (!row) return c.json({ error: 'not found' }, 404);
  const email = await currentEmail(c);
  const isOwner = row.owner_email && row.owner_email === email;
  const editOk = c.req.header('x-edit-token') === row.edit_token;
  if (!isOwner && !editOk) return c.json({ error: 'forbidden' }, 403);
  // Patch only the supplied fields.
  const sets: string[] = ['updated_at = now()', 'last_access = now()'];
  const values: unknown[] = [];
  let i = 1;
  if (body.name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(body.name);
  }
  if (body.doc !== undefined) {
    sets.push(`doc = $${i++}::jsonb`);
    values.push(JSON.stringify(body.doc));
  }
  if (body.public !== undefined) {
    sets.push(`public = $${i++}`);
    values.push(body.public);
  }
  values.push(id);
  await query(`UPDATE circuits SET ${sets.join(', ')} WHERE id = $${i}`, values);
  return c.json({ ok: true });
});

// ----- DELETE /circuits/:id — delete -----
circuits.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const { rows } = await query<CircuitRow>(
    'SELECT edit_token, owner_email FROM circuits WHERE id = $1',
    [id],
  );
  const row = rows[0];
  if (!row) return c.json({ error: 'not found' }, 404);
  const email = await currentEmail(c);
  const isOwner = row.owner_email && row.owner_email === email;
  const editOk = c.req.header('x-edit-token') === row.edit_token;
  if (!isOwner && !editOk) return c.json({ error: 'forbidden' }, 403);
  await query('DELETE FROM circuits WHERE id = $1', [id]);
  return c.json({ ok: true });
});
