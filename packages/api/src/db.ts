/**
 * Single-source Postgres pool. Reads the connection string from
 * `DATABASE_URL`; in dev that points at the local docker compose stack,
 * in prod at the Hetzner `infrastructure-postgres-1` container.
 */

import pg from 'pg';

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgres://nandbench:nandbench@localhost:5432/nandbench';

export const pool = new Pool({
  connectionString: databaseUrl,
  // Long-running app — keep the pool small, recycle connections so
  // Postgres' idle timeout doesn't surprise us mid-request.
  max: 10,
  idleTimeoutMillis: 30_000,
});

export async function query<R extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
): Promise<pg.QueryResult<R>> {
  return pool.query<R>(text, values as unknown[]);
}
