-- Unique applicant mobile for registration OTP uniqueness checks.
ALTER TABLE users ADD COLUMN phone VARCHAR(32);
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_phone ON users (phone);
