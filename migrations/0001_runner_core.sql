PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_owner_expiry ON sessions(owner_id, expires_at);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project','task_stream','habit','fitness','learning','hobby','custom')),
  outcome TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('planned','active','paused','blocked','completed','archived')),
  priority TEXT NOT NULL CHECK (priority IN ('low','normal','high','critical')),
  next_action TEXT NOT NULL DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  blocker TEXT,
  due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_runs_owner_status ON runs(owner_id, status);
CREATE INDEX idx_runs_owner_priority ON runs(owner_id, priority);
CREATE INDEX idx_runs_owner_updated ON runs(owner_id, updated_at DESC);

CREATE TABLE run_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_run_events_owner_run_created ON run_events(owner_id, run_id, created_at DESC);
