-- Rate-limit bucket. One row per (key, window_start). The key is
-- normally `<scope>:<identifier>` — for example `auth:ip:1.2.3.4` or
-- `auth:email:alice@example.com`. window_start is truncated to the
-- nearest window size by the application before insert.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_window_idx
  ON rate_limit_buckets (window_start);
