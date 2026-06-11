-- Audit log for admin edits. Every UPDATE goes through a server action that writes
-- to this table BEFORE applying the change.

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,                      -- update / insert / delete
  changed_by_email text,                     -- admin email from JWT
  changed_at timestamptz DEFAULT now(),
  changes jsonb NOT NULL                     -- {field: {before, after}, ...}
);

CREATE INDEX IF NOT EXISTS audit_log_record_idx
  ON audit_log (table_name, record_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_user_idx
  ON audit_log (changed_by_email, changed_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- service_role bypasses RLS; no policies added.
