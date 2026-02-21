-- ============================================================================
-- ICEBREAKER BACKGROUND GENERATION - Schema Migration
-- ============================================================================
-- Adds background job tracking columns to scrape_jobs table so icebreaker
-- generation can run as a persistent background process (Supabase Edge Function)
-- rather than in the browser. Supports 20K+ lead jobs unattended.
-- ============================================================================

ALTER TABLE scrape_jobs
    ADD COLUMN IF NOT EXISTS icebreaker_generation_status TEXT
        NOT NULL DEFAULT 'idle'
        CHECK (icebreaker_generation_status IN ('idle','queued','running','completed','failed')),

    ADD COLUMN IF NOT EXISTS icebreaker_config_org_id UUID
        REFERENCES organizations(id) ON DELETE SET NULL,

    ADD COLUMN IF NOT EXISTS icebreaker_generation_progress JSONB
        NOT NULL DEFAULT '{"total":0,"completed":0,"failed":0}',

    ADD COLUMN IF NOT EXISTS icebreaker_generation_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS icebreaker_generation_completed_at TIMESTAMPTZ;

-- Index so the Edge Function can efficiently find queued/running jobs
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_icebreaker_status
    ON scrape_jobs(icebreaker_generation_status)
    WHERE icebreaker_generation_status IN ('queued', 'running');

-- ============================================================================
-- RUN IN SUPABASE SQL EDITOR — then deploy the Edge Function and Webhook
-- ============================================================================
