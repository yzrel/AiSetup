-- Applicant blob store: profile + moduleData JSON per SETUP case.
CREATE TABLE IF NOT EXISTS applicant_records (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    application_id VARCHAR(255) NOT NULL,
    enterprise_name VARCHAR(255),
    current_module VARCHAR(255),
    module_data_json LONGTEXT,
    profile_json LONGTEXT,
    updated_at DATETIME(6),
    CONSTRAINT uk_applicant_records_application_id UNIQUE (application_id)
);
