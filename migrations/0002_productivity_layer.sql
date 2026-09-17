ALTER TABLE runs ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE runs ADD COLUMN focus_date TEXT;
ALTER TABLE runs ADD COLUMN focus_order INTEGER CHECK (focus_order IS NULL OR focus_order BETWEEN 1 AND 3);

CREATE INDEX idx_runs_owner_due ON runs(owner_id, due_at);
CREATE INDEX idx_runs_owner_focus ON runs(owner_id, focus_date, focus_order);
