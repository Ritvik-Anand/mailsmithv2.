-- ============================================================================
-- LEAD FINDER - SAFE MIGRATION
-- ============================================================================
-- This migration safely adds Lead Finder tables and columns.
-- It handles cases where tables may or may not already exist.
-- Run in Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE SCRAPE_JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Actor info (internal, not shown to users)
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    input_params JSONB NOT NULL DEFAULT '{}',
    
    -- Job status
    status TEXT NOT NULL DEFAULT 'pending',
    apify_run_id TEXT,
    
    -- Results
    leads_found INTEGER DEFAULT 0,
    leads_imported INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE CAMPAIGNS TABLE (needed for leads FK)
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    instantly_campaign_id TEXT,
    instantly_account_id TEXT,
    
    subject_template TEXT,
    body_template TEXT,
    sequences JSONB DEFAULT '[]',
    
    total_leads INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'draft',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE OR UPDATE LEADS TABLE
-- ============================================================================

-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    linkedin_url TEXT,
    
    company_name TEXT,
    company_domain TEXT,
    job_title TEXT,
    industry TEXT,
    company_size TEXT,
    location TEXT,
    
    raw_scraped_data JSONB DEFAULT '{}',
    enrichment_data JSONB DEFAULT '{}',
    
    icebreaker_status TEXT DEFAULT 'pending',
    icebreaker TEXT,
    icebreaker_generated_at TIMESTAMPTZ,
    icebreaker_metadata JSONB DEFAULT '{}',
    
    campaign_id UUID,
    campaign_status TEXT DEFAULT 'not_added',
    
    source TEXT DEFAULT 'manual',
    scrape_job_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if leads table already exists
DO $$ 
BEGIN 
    -- Add scrape_job_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='scrape_job_id') THEN
        ALTER TABLE leads ADD COLUMN scrape_job_id UUID;
    END IF;
    
    -- Add source if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='source') THEN
        ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'manual';
    END IF;
    
    -- Add enrichment_data if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='enrichment_data') THEN
        ALTER TABLE leads ADD COLUMN enrichment_data JSONB DEFAULT '{}';
    END IF;
    
    -- Add raw_scraped_data if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='raw_scraped_data') THEN
        ALTER TABLE leads ADD COLUMN raw_scraped_data JSONB DEFAULT '{}';
    END IF;
    
    -- Add icebreaker columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='icebreaker_status') THEN
        ALTER TABLE leads ADD COLUMN icebreaker_status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='icebreaker') THEN
        ALTER TABLE leads ADD COLUMN icebreaker TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='icebreaker_generated_at') THEN
        ALTER TABLE leads ADD COLUMN icebreaker_generated_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='icebreaker_metadata') THEN
        ALTER TABLE leads ADD COLUMN icebreaker_metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add campaign columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='campaign_id') THEN
        ALTER TABLE leads ADD COLUMN campaign_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='campaign_status') THEN
        ALTER TABLE leads ADD COLUMN campaign_status TEXT DEFAULT 'not_added';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS (safely)
-- ============================================================================

-- Add scrape_job_id FK if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_scrape_job_id_fkey' AND table_name = 'leads'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT leads_scrape_job_id_fkey 
        FOREIGN KEY (scrape_job_id) REFERENCES scrape_jobs(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add campaign_id FK if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_leads_campaign' AND table_name = 'leads'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_campaign_id_fkey' AND table_name = 'leads'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT fk_leads_campaign 
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add unique constraint for deduplication if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_organization_id_email_key' AND table_name = 'leads'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT leads_organization_id_email_key UNIQUE(organization_id, email);
    END IF;
EXCEPTION WHEN others THEN
    -- Constraint might already exist with different name, ignore
    NULL;
END $$;

-- ============================================================================
-- STEP 5: CREATE NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES (drop and recreate to avoid conflicts)
-- ============================================================================

-- SCRAPE_JOBS policies
DROP POLICY IF EXISTS "Users can view own org scrape jobs" ON scrape_jobs;
DROP POLICY IF EXISTS "Users can insert scrape jobs for own org" ON scrape_jobs;
DROP POLICY IF EXISTS "Users can update own org scrape jobs" ON scrape_jobs;
DROP POLICY IF EXISTS "Service role can manage all scrape_jobs" ON scrape_jobs;

CREATE POLICY "Users can view own org scrape jobs" ON scrape_jobs FOR SELECT 
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert scrape jobs for own org" ON scrape_jobs FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org scrape jobs" ON scrape_jobs FOR UPDATE
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role can manage all scrape_jobs" ON scrape_jobs FOR ALL
TO service_role USING (true) WITH CHECK (true);

-- CAMPAIGNS policies
DROP POLICY IF EXISTS "Users can view own org campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can manage own org campaigns" ON campaigns;

CREATE POLICY "Users can view own org campaigns" ON campaigns FOR SELECT 
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage own org campaigns" ON campaigns FOR ALL
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- LEADS policies
DROP POLICY IF EXISTS "Users can view own org leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads to own org" ON leads;
DROP POLICY IF EXISTS "Users can update own org leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own org leads" ON leads;
DROP POLICY IF EXISTS "Service role can manage all leads" ON leads;

CREATE POLICY "Users can view own org leads" ON leads FOR SELECT 
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert leads to own org" ON leads FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org leads" ON leads FOR UPDATE
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org leads" ON leads FOR DELETE
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role can manage all leads" ON leads FOR ALL
TO service_role USING (true) WITH CHECK (true);

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
USING (user_id = auth.uid() OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
USING (user_id = auth.uid() OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role can manage all notifications" ON notifications FOR ALL
TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 8: CREATE INDEXES (IF NOT EXISTS handles duplicates)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_org_id ON scrape_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_scrape_job ON leads(scrape_job_id);
CREATE INDEX IF NOT EXISTS idx_leads_icebreaker_status ON leads(icebreaker_status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status ON leads(campaign_status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- DONE! Migration completed successfully.
-- ============================================================================
