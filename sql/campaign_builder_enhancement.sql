-- ============================================================================
-- CAMPAIGN BUILDER ENHANCEMENT MIGRATION
-- ============================================================================
-- This migration adds support for:
-- 1. Multi-step email sequences with variants (A/B testing)
-- 2. Campaign schedules (timing, days, timezone)
-- 3. Enhanced campaign options (tracking, daily limits, accounts)
-- ============================================================================

-- 1. Create campaign_sequences table for multi-step emails
CREATE TABLE IF NOT EXISTS campaign_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    step_number INTEGER NOT NULL DEFAULT 1,
    delay_days INTEGER NOT NULL DEFAULT 1, -- Days to wait before sending this step
    
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Variant support for A/B testing
    variant_label TEXT DEFAULT 'A', -- 'A', 'B', 'C', etc.
    parent_step_id UUID REFERENCES campaign_sequences(id) ON DELETE CASCADE, -- If variant, links to main step
    
    -- Stats per sequence step
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sequences
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign ON campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_step ON campaign_sequences(campaign_id, step_number);

-- 2. Create campaign_schedules table
CREATE TABLE IF NOT EXISTS campaign_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL DEFAULT 'Default Schedule',
    
    -- Timing
    send_from_hour INTEGER NOT NULL DEFAULT 9, -- 24-hour format
    send_from_minute INTEGER NOT NULL DEFAULT 0,
    send_to_hour INTEGER NOT NULL DEFAULT 18,
    send_to_minute INTEGER NOT NULL DEFAULT 0,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    
    -- Days of week (true = enabled)
    monday BOOLEAN DEFAULT true,
    tuesday BOOLEAN DEFAULT true,
    wednesday BOOLEAN DEFAULT true,
    thursday BOOLEAN DEFAULT true,
    friday BOOLEAN DEFAULT true,
    saturday BOOLEAN DEFAULT false,
    sunday BOOLEAN DEFAULT false,
    
    -- Start/End dates (optional)
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for schedules
CREATE INDEX IF NOT EXISTS idx_campaign_schedules_campaign ON campaign_schedules(campaign_id);

-- 3. Update campaigns table with enhanced options
DO $$ 
BEGIN 
    -- Add instantly_status if not exists (may already exist from control plane migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='instantly_status') THEN
        ALTER TABLE campaigns ADD COLUMN instantly_status TEXT DEFAULT 'draft';
    END IF;
    
    -- Campaign options
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='stop_on_reply') THEN
        ALTER TABLE campaigns ADD COLUMN stop_on_reply BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='open_tracking') THEN
        ALTER TABLE campaigns ADD COLUMN open_tracking BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='link_tracking') THEN
        ALTER TABLE campaigns ADD COLUMN link_tracking BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='send_as_text') THEN
        ALTER TABLE campaigns ADD COLUMN send_as_text BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='daily_limit') THEN
        ALTER TABLE campaigns ADD COLUMN daily_limit INTEGER DEFAULT 450;
    END IF;
    
    -- Sync metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='last_synced_at') THEN
        ALTER TABLE campaigns ADD COLUMN last_synced_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='sync_error') THEN
        ALTER TABLE campaigns ADD COLUMN sync_error TEXT;
    END IF;
END $$;

-- 4. Create junction table for campaign email accounts (outreach nodes)
CREATE TABLE IF NOT EXISTS campaign_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES instantly_email_accounts(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_accounts_campaign ON campaign_accounts(campaign_id);

-- 5. Enable RLS on new tables
ALTER TABLE campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_accounts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for campaign_sequences
DROP POLICY IF EXISTS "Users can manage sequences for own campaigns" ON campaign_sequences;
CREATE POLICY "Users can manage sequences for own campaigns" ON campaign_sequences FOR ALL
USING (
    campaign_id IN (
        SELECT id FROM campaigns WHERE organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Operators can manage all sequences" ON campaign_sequences;
CREATE POLICY "Operators can manage all sequences" ON campaign_sequences FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'operator'))
);

-- 7. RLS Policies for campaign_schedules
DROP POLICY IF EXISTS "Users can manage schedules for own campaigns" ON campaign_schedules;
CREATE POLICY "Users can manage schedules for own campaigns" ON campaign_schedules FOR ALL
USING (
    campaign_id IN (
        SELECT id FROM campaigns WHERE organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Operators can manage all schedules" ON campaign_schedules;
CREATE POLICY "Operators can manage all schedules" ON campaign_schedules FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'operator'))
);

-- 8. RLS Policies for campaign_accounts
DROP POLICY IF EXISTS "Users can view accounts for own campaigns" ON campaign_accounts;
CREATE POLICY "Users can view accounts for own campaigns" ON campaign_accounts FOR SELECT
USING (
    campaign_id IN (
        SELECT id FROM campaigns WHERE organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Operators can manage all campaign accounts" ON campaign_accounts;
CREATE POLICY "Operators can manage all campaign accounts" ON campaign_accounts FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'operator'))
);

-- 9. Service role bypass for all new tables
DROP POLICY IF EXISTS "Service role bypass sequences" ON campaign_sequences;
CREATE POLICY "Service role bypass sequences" ON campaign_sequences FOR ALL
TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass schedules" ON campaign_schedules;
CREATE POLICY "Service role bypass schedules" ON campaign_schedules FOR ALL
TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass campaign_accounts" ON campaign_accounts;
CREATE POLICY "Service role bypass campaign_accounts" ON campaign_accounts FOR ALL
TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- DONE! Campaign builder enhancement ready.
-- Run this migration in your Supabase SQL Editor.
-- ============================================================================
