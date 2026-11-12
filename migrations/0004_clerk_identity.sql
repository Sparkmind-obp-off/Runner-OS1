-- Phase: Clerk identity (Google sign-in) — additive, backward-compatible.
-- Internal users.id stays canonical. Clerk subjects are mapped through external_identities.
-- Rollback: DROP TABLE auth_events; DROP TABLE external_identities; (no existing table is altered).

CREATE TABLE IF NOT EXISTS external_identities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('clerk')),
  subject TEXT NOT NULL,
  email_at_link TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (provider, subject),
  UNIQUE (owner_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_external_identities_owner ON external_identities(owner_id);

CREATE TABLE IF NOT EXISTS auth_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  event_type TEXT NOT NULL,
  provider TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_events_owner_created ON auth_events(owner_id, created_at DESC);
