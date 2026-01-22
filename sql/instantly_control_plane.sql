-- ============================================================================
-- INSTANTLY CONTROL PLANE MIGRATION
-- ============================================================================
-- This migration adds support for:
-- 1. Mapping Instantly email accounts to organizations
-- 2. Mapping Instantly campaigns to organizations
-- 3. Storing sync status and metadata for outreach nodes
-- ============================================================================

-- 1. Create table for mapping Instantly email accounts (Outreach Nodes)
CREATE TABLE IF NOT EXISTS instantly_email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    instantly_account_id TEXT NOT NULL, -- ID from Instantly API
    email_address TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    
    -- Status and Health
    status TEXT DEFAULT 'active', -- active, warmup, paused, error
    warmup_enabled BOOLEAN DEFAULT false,
    reputation_score INTEGER DEFAULT 100,
    daily_limit INTEGER DEFAULT 50,
    
    -- Sync Metadata
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate accounts globally in our system
    UNIQUE(instantly_account_id)
);

-- Index for organization lookups
CREATE INDEX IF NOT EXISTS idx_instantly_accounts_org ON instantly_email_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_instantly_accounts_email ON instantly_email_accounts(email_address);

-- 2. Update campaigns table for Instantly linking
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='instantly_campaign_id') THEN
        ALTER TABLE campaigns ADD COLUMN instantly_campaign_id TEXT;
        ALTER TABLE campaigns ADD COLUMN instantly_status TEXT DEFAULT 'draft';
        ALTER TABLE campaigns ADD COLUMN last_synced_at TIMESTAMPTZ;
        ALTER TABLE campaigns ADD COLUMN sync_error TEXT;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE instantly_email_accounts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Super Admins can manage everything
CREATE POLICY "Super admins can manage all outreach nodes" ON instantly_email_accounts FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Operators can manage assigned outreach nodes
CREATE POLICY "Operators can manage assigned outreach nodes" ON instantly_email_accounts FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM operator_assignments WHERE operator_user_id = auth.uid()
    )
);

-- Customers can VIEW their outreach nodes (branded as outreach infrastructure)
-- They don't see IDs or sensitive metadata, just status/email/reputation
CREATE POLICY "Customers can view their outreach nodes" ON instantly_email_accounts FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

-- Service role bypass
CREATE POLICY "Service role can manage all outreach nodes" ON instantly_email_accounts FOR ALL
TO service_role USING (true) WITH CHECK (true);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instantly_email_accounts_updated_at
    BEFORE UPDATE ON instantly_email_accounts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- DONE! Instantly Control Plane infrastructure ready.
-- ============================================================================
