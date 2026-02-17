-- Add missing stat columns to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS emails_clicked INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS emails_interested INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS emails_uninterested INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS emails_unsubscribed INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS emails_neutral INTEGER DEFAULT 0;

-- Additional sync metadata
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_stats_sync_at TIMESTAMPTZ;
