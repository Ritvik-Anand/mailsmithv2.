-- ============================================================================
-- ADD NAME COLUMN TO SCRAPE_JOBS
-- ============================================================================
-- This migration adds a 'name' column to scrape_jobs table to allow job renaming

ALTER TABLE scrape_jobs 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create index for searching by name
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_name ON scrape_jobs(name);
