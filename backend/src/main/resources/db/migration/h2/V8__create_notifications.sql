-- In-app notifications (applicant / staff audience).
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    audience VARCHAR(32) NOT NULL,
    applicant_id VARCHAR(255),
    office_id VARCHAR(128),
    kind VARCHAR(32) NOT NULL,
    title VARCHAR(512) NOT NULL,
    message CLOB NOT NULL,
    view_key VARCHAR(128),
    read_flag BOOLEAN NOT NULL DEFAULT FALSE,
    urgent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_audience_applicant
    ON notifications (audience, applicant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_audience_office
    ON notifications (audience, office_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created
    ON notifications (created_at);
