-- nandbench cloud schema v1.
--
-- Two tables:
--   circuits — every saved circuit document. owner_email is NULL for
--     anonymous saves; non-NULL after a user claims it via magic-link.
--   users    — email-only records, populated by the auth flow. No
--     password column: magic-link is the only credential.
--
-- editToken lives on each circuit so the original creator can keep
-- editing an anonymous circuit even before signing in. After claim
-- it stays valid (multiple devices/sessions of the same user).

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  -- One-shot magic-link tokens.
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS auth_tokens_email_idx ON auth_tokens (email);

CREATE TABLE IF NOT EXISTS sessions (
  -- Long-lived session id stored in a httpOnly cookie.
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_email_idx ON sessions (email);

CREATE TABLE IF NOT EXISTS circuits (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Untitled',
  -- Edit token issued at creation, used by anonymous clients to keep
  -- editing the circuit they own without a login.
  edit_token TEXT NOT NULL,
  owner_email TEXT REFERENCES users(email) ON DELETE SET NULL,
  -- Project blob mirrors the v3 persistence format: { tabs, library, locale }.
  doc JSONB NOT NULL,
  -- Whether anyone with the URL can view this. Editing always requires
  -- the edit_token (or being the owner).
  public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_access TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS circuits_owner_idx ON circuits (owner_email);
CREATE INDEX IF NOT EXISTS circuits_last_access_idx ON circuits (last_access);
