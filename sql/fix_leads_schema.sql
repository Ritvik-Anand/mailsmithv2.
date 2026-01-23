-- ============================================================================
-- FIX: Minimal leads table schema
-- ============================================================================
-- This creates a FLEXIBLE leads table that stores:
-- 1. Essential indexed columns (for search/filtering)
-- 2. ALL raw Apify data in JSONB (for AI icebreaker generation)

-- Add essential columns only
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title TEXT;

-- JSONB column stores ALL raw Apify data - this is the key for flexibility
ALTER TABLE leads ADD COLUMN IF NOT EXISTS raw_scraped_data JSONB DEFAULT '{}';

-- Status tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scrape_job_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS icebreaker_status TEXT DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS icebreaker TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS icebreaker_generated_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_status TEXT DEFAULT 'not_added';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- Timestamps
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_scrape_job ON leads(scrape_job_id);
CREATE INDEX IF NOT EXISTS idx_leads_icebreaker_status ON leads(icebreaker_status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status ON leads(campaign_status);

-- Verify the schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;
