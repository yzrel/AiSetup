-- Auth users (staff + applicants). Passwords are BCrypt hashes.
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    enterprise_name VARCHAR(255),
    applicant_id VARCHAR(255),
    application_id VARCHAR(255),
    office_id VARCHAR(128),
    assigned_provinces_json LONGTEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_applicant_id ON users (applicant_id);
CREATE INDEX idx_users_role ON users (role);
