-- ============================================================================
-- FIX: Add missing company_domain column to leads table
-- ============================================================================
-- Run this migration if you get the error:
-- "Could not find the 'company_domain' column of 'leads' in the schema cache"

-- Add company_domain column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'company_domain'
    ) THEN
        ALTER TABLE leads ADD COLUMN company_domain TEXT;
        RAISE NOTICE 'Added company_domain column to leads table';
    ELSE
        RAISE NOTICE 'company_domain column already exists';
    END IF;
END $$;

-- Also ensure these other columns exist (in case schema is partially applied)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'raw_scraped_data'
    ) THEN
        ALTER TABLE leads ADD COLUMN raw_scraped_data JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'enrichment_data'
    ) THEN
        ALTER TABLE leads ADD COLUMN enrichment_data JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'scrape_job_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN scrape_job_id UUID REFERENCES scrape_jobs(id) ON DELETE SET NULL;
    END IF;
END $$;
