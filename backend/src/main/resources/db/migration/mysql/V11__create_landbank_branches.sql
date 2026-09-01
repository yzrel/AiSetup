-- LandBank branch directory (staff-maintained reference data).
CREATE TABLE IF NOT EXISTS landbank_branches (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(512) NOT NULL,
    city_province VARCHAR(255) NOT NULL,
    manager_name VARCHAR(255) NOT NULL,
    manager_title VARCHAR(128) NOT NULL DEFAULT 'Branch Manager',
    office_id VARCHAR(128),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_landbank_branches_name UNIQUE (name)
);

CREATE INDEX idx_landbank_branches_office_id ON landbank_branches (office_id);
CREATE INDEX idx_landbank_branches_active ON landbank_branches (active);
