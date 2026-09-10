-- Role-targeted staff notifications.
-- NULL / empty keeps legacy behavior (visible to all staff in the office scope);
-- a JSON array of role keys (e.g. ["regional-director"]) narrows the audience so
-- handoffs reach the role that must act next.
ALTER TABLE notifications
    ADD COLUMN target_roles VARCHAR(512) NULL;
