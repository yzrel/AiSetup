-- Ensure Regional Director account exists (Engr. Sammy P. Malawan).
-- Reuses the admin password hash so credentials stay aligned with seeded staff (admin123).
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    middle_name,
    last_name,
    role,
    enterprise_name,
    applicant_id,
    application_id,
    office_id,
    assigned_provinces_json,
    enabled,
    created_at,
    updated_at
)
SELECT
    'rd-malawan',
    'rd@dost.gov.ph',
    u.password_hash,
    'Sammy',
    'P.',
    'Malawan',
    'regional-director',
    'DOST SOCCSKSARGEN — Regional Office',
    NULL,
    NULL,
    'regional',
    '[]',
    TRUE,
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
FROM users u
WHERE LOWER(u.email) = 'admin@dost.gov.ph'
  AND NOT EXISTS (
      SELECT 1 FROM users x WHERE LOWER(x.email) = 'rd@dost.gov.ph'
  );
