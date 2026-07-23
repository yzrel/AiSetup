-- Per-module JSON store so large cases are not a single flooded module_data_json blob.
CREATE TABLE IF NOT EXISTS applicant_module_data (
    applicant_id VARCHAR(255) NOT NULL,
    module_key VARCHAR(128) NOT NULL,
    data_json CLOB,
    published BOOLEAN,
    published_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (applicant_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_applicant_module_data_applicant
    ON applicant_module_data (applicant_id);
