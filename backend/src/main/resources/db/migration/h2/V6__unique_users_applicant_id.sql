-- One user account may bind to a given applicant case (NULLs remain allowed for staff).
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_applicant_id ON users (applicant_id);
