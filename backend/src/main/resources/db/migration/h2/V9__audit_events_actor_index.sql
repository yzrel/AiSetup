-- Ops queries by actor for the HTTP request audit trail.
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events (actor_user_id);
