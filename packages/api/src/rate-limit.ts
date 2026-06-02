/**
 * Postgres-backed sliding-window rate limiter.
 *
 * Each named bucket holds (key, window_start, count). On every hit we
 * normalise the timestamp to the start of the current window, upsert
 * the row, and reject when count exceeds `max`. Old rows are reaped
 * lazily by the same upsert (any row whose window has rolled over
 * just gets ignored).
 *
 * Use it as Hono middleware:
 *
 *   app.post('/auth/request', rateLimit({
 *     keyFor: (c) => `auth:ip:${clientIp(c)}`,
 *     max: 5,
 *     windowMs: 60_000,
 *   }), handler);
 *
 * Multiple limiters can stack on one route — e.g. per-IP + per-email.
 */

import type { Context, MiddlewareHandler } from 'hono';
import { query } from './db.js';

export interface RateLimitOptions {
  /** Build the bucket key for this request (usually `<scope>:ip:<ip>`). */
  keyFor: (c: Context) => string | null | Promise<string | null>;
  /** Allowed hits per window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const key = await opts.keyFor(c);
    if (!key) return next(); // no key (e.g. body unparsable) → allow
    const now = Date.now();
    const windowStart = new Date(now - (now % opts.windowMs));
    const { rows } = await query<{ count: number }>(
      `INSERT INTO rate_limit_buckets (key, window_start, count)
       VALUES ($1, $2, 1)
       ON CONFLICT (key, window_start)
       DO UPDATE SET count = rate_limit_buckets.count + 1
       RETURNING count`,
      [key, windowStart.toISOString()],
    );
    const count = rows[0]?.count ?? 0;
    if (count > opts.max) {
      const retryAfter = Math.ceil(
        (windowStart.getTime() + opts.windowMs - now) / 1000,
      );
      c.header('Retry-After', String(Math.max(1, retryAfter)));
      return c.json({ error: 'rate-limited', retryAfter }, 429);
    }
    return next();
  };
}

/**
 * Best-effort IP extraction. Honours X-Forwarded-For when present (so
 * a Caddy/nginx reverse proxy sets it) and falls back to `'anon'` so
 * the bucket key is still deterministic. The first value of XFF is
 * the original client; later values are intermediate proxies.
 */
export function clientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = c.req.header('x-real-ip');
  if (real) return real;
  return 'anon';
}
