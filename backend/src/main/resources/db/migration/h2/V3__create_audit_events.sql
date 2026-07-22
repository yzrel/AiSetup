-- Audit trail for case mutations and publish actions.
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    actor_user_id VARCHAR(255),
    actor_email VARCHAR(255),
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(128) NOT NULL,
    entity_id VARCHAR(255),
    detail_json CLOB,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events (created_at);
