PRAGMA foreign_keys = ON;

CREATE TABLE runner_profiles (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  running_area TEXT,
  preferred_days TEXT NOT NULL DEFAULT '[]',
  preferred_time TEXT,
  preferred_distances TEXT NOT NULL DEFAULT '[]',
  primary_goal TEXT,
  preferred_event_types TEXT NOT NULL DEFAULT '[]',
  running_with_others_preference TEXT,
  communities TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  onboarding_completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE recurring_activities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  recurrence_rule TEXT NOT NULL,
  usual_day TEXT,
  usual_time TEXT,
  usual_location TEXT,
  community TEXT,
  expected_distance_meters REAL,
  notes TEXT,
  source TEXT NOT NULL,
  relevance_weight REAL NOT NULL DEFAULT 0.5 CHECK (relevance_weight BETWEEN 0 AND 1),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_recurring_owner_active ON recurring_activities(owner_id, active, usual_day);

CREATE TABLE running_activities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER,
  distance_meters REAL,
  pace_seconds_per_km INTEGER,
  elevation_meters REAL,
  effort INTEGER CHECK (effort IS NULL OR effort BETWEEN 1 AND 10),
  feeling TEXT,
  source TEXT NOT NULL,
  external_id TEXT,
  event_id TEXT,
  recurring_activity_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES running_events(id) ON DELETE SET NULL,
  FOREIGN KEY (recurring_activity_id) REFERENCES recurring_activities(id) ON DELETE SET NULL,
  UNIQUE(owner_id, source, external_id)
);
CREATE INDEX idx_running_activities_owner_started ON running_activities(owner_id, started_at DESC);

CREATE TABLE recurring_activity_occurrences (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  recurring_activity_id TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned','attended','skipped','unknown')),
  linked_running_activity_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recurring_activity_id) REFERENCES recurring_activities(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_running_activity_id) REFERENCES running_activities(id) ON DELETE SET NULL,
  UNIQUE(owner_id, recurring_activity_id, scheduled_at)
);
CREATE INDEX idx_occurrences_owner_scheduled ON recurring_activity_occurrences(owner_id, scheduled_at DESC);

CREATE TABLE running_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  edition_year INTEGER,
  month_hint TEXT,
  event_date TEXT,
  location TEXT,
  organizer TEXT,
  distance_or_category TEXT,
  registration_url TEXT,
  registration_deadline TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'candidate',
  date_status TEXT NOT NULL CHECK (date_status IN ('verified','unverified')),
  participation_intent TEXT NOT NULL DEFAULT 'none' CHECK (participation_intent IN ('none','interested','planned','confirmed')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_running_events_owner_date ON running_events(owner_id, event_date);
CREATE INDEX idx_running_events_owner_year ON running_events(owner_id, edition_year);

CREATE TABLE event_evidence (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('prior_participation','instagram_post','instagram_highlight','repost','explicit_confirmation','registration','public_event_listing')),
  evidence_strength TEXT NOT NULL CHECK (evidence_strength IN ('weak','moderate','strong','confirmed')),
  source_url TEXT,
  observed_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES running_events(id) ON DELETE CASCADE
);
CREATE INDEX idx_event_evidence_owner_event ON event_evidence(owner_id, event_id, observed_at DESC);

CREATE TABLE integration_accounts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('strava')),
  provider_user_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('disconnected','connected','error')),
  scopes TEXT NOT NULL DEFAULT '[]',
  connected_at TEXT,
  last_synced_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(owner_id, provider)
);
