-- OTP verification codes for email/SMS account verification during registration.
CREATE TABLE IF NOT EXISTS verification_codes (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    channel VARCHAR(16) NOT NULL,
    target VARCHAR(255) NOT NULL,
    code_hash VARCHAR(128) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_channel_target
    ON verification_codes (channel, target);
