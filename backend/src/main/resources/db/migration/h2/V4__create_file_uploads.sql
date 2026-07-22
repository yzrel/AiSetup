-- Uploaded documents (MOA scans, quotations, etc.).
CREATE TABLE IF NOT EXISTS file_uploads (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    applicant_id VARCHAR(255) NOT NULL,
    application_id VARCHAR(255),
    module_key VARCHAR(128) NOT NULL,
    original_filename VARCHAR(512) NOT NULL,
    content_type VARCHAR(255),
    size_bytes BIGINT,
    storage_path VARCHAR(1024) NOT NULL,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_applicant ON file_uploads (applicant_id);
