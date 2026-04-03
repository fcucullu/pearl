-- Add last_notified_phase to partner notifications
ALTER TABLE pearl_partner_notifications ADD COLUMN IF NOT EXISTS last_notified_phase text;
