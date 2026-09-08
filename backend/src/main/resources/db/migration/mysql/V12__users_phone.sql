-- Unique applicant mobile for registration OTP uniqueness checks.
ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL;
CREATE UNIQUE INDEX uk_users_phone ON users (phone);
