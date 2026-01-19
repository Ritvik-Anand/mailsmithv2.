-- ============================================================================
-- LEAD FINDER - Database Schema Extension
-- ============================================================================
-- This migration adds tables required for the Lead Finder feature.
-- Run this after the initial schema_setup.sql

-- ============================================================================
-- SCRAPE JOBS TABLE
-- ============================================================================
-- Stores lead search job records (without exposing Apify details to users)

CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Actor info (internal, not shown to users)
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    input_params JSONB NOT NULL DEFAULT '{}',
    
    -- Job status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    apify_run_id TEXT, -- Internal reference
    
    -- Results
    leads_found INTEGER DEFAULT 0,
    leads_imported INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scrape_jobs
CREATE POLICY "Users can view own org scrape jobs" 
ON scrape_jobs FOR SELECT 
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert scrape jobs for own org"
ON scrape_jobs FOR INSERT
WITH CHECK (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own org scrape jobs"
ON scrape_jobs FOR UPDATE
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_org_id ON scrape_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================
-- Stores all lead/contact records

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Contact Info
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    linkedin_url TEXT,
    
    -- Company Info
    company_name TEXT,
    company_domain TEXT,
    job_title TEXT,
    industry TEXT,
    company_size TEXT,
    location TEXT,
    
    -- Enrichment Data (stores all extra data from source)
    raw_scraped_data JSONB DEFAULT '{}',
    enrichment_data JSONB DEFAULT '{}',
    
    -- Icebreaker
    icebreaker_status TEXT DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    icebreaker TEXT,
    icebreaker_generated_at TIMESTAMPTZ,
    icebreaker_metadata JSONB DEFAULT '{}',
    
    -- Campaign Status
    campaign_id UUID,
    campaign_status TEXT DEFAULT 'not_added', -- 'not_added', 'queued', 'sent', 'opened', 'replied', 'bounced'
    
    -- Source tracking
    source TEXT DEFAULT 'manual', -- 'apify_leads_finder', 'csv_import', 'manual'
    scrape_job_id UUID REFERENCES scrape_jobs(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for deduplication
    UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view own org leads" 
ON leads FOR SELECT 
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert leads to own org"
ON leads FOR INSERT
WITH CHECK (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own org leads"
ON leads FOR UPDATE
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own org leads"
ON leads FOR DELETE
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_scrape_job ON leads(scrape_job_id);
CREATE INDEX IF NOT EXISTS idx_leads_icebreaker_status ON leads(icebreaker_status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status ON leads(campaign_status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- ============================================================================
-- CAMPAIGNS TABLE
-- ============================================================================
-- Stores email campaigns

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Instantly integration
    instantly_campaign_id TEXT,
    instantly_account_id TEXT,
    
    -- Email templates
    subject_template TEXT,
    body_template TEXT,
    sequences JSONB DEFAULT '[]', -- Array of email sequence steps
    
    -- Stats
    total_leads INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org campaigns" 
ON campaigns FOR SELECT 
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own org campaigns"
ON campaigns FOR ALL
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Add foreign key for leads -> campaigns
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_campaign 
FOREIGN KEY (campaign_id) 
REFERENCES campaigns(id) 
ON DELETE SET NULL;

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- Stores notifications for users

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL DEFAULT 'system', -- 'system', 'campaign', 'alert', 'reply', 'admin', 'bug_update'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (
    user_id = auth.uid() OR
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (
    user_id = auth.uid() OR
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- BUG REPORTS TABLE
-- ============================================================================
-- Stores bug reports from users

CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    
    browser_info JSONB DEFAULT '{}',
    screenshot_urls TEXT[] DEFAULT '{}',
    
    admin_notes TEXT,
    assigned_to UUID REFERENCES system_admins(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create bug reports"
ON bug_reports FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Users can view own bug reports"
ON bug_reports FOR SELECT
USING (
    user_id = auth.uid() OR
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_org ON bug_reports(organization_id);

-- ============================================================================
-- SERVICE ROLE BYPASS POLICY
-- ============================================================================
-- Allow service role (used by webhooks) to bypass RLS

ALTER TABLE scrape_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Service role can bypass RLS
CREATE POLICY "Service role can manage all scrape_jobs"
ON scrape_jobs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all leads"
ON leads FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all notifications"
ON notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
