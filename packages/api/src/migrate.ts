#!/usr/bin/env tsx
/**
 * Apply every `migrations/*.sql` file in lexical order. Tracks applied
 * names in a `schema_migrations` table so reruns are idempotent.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');

async function main(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );
  const { rows: applied } = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations',
  );
  const done = new Set(applied.map((r) => r.name));
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    if (done.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    console.log(`apply ${file}`);
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  await pool.end();
  console.log('migrations complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
