-- ============================================================================
-- ICEBREAKER CONFIGURATION: Add context field to organizations
-- ============================================================================
-- This stores customer-specific context for personalized icebreaker generation

-- Add icebreaker_context JSONB column to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS icebreaker_context JSONB DEFAULT '{}'::jsonb;

-- Example structure:
-- {
--   "company_name": "Acme Content Studio",
--   "description": "I am the founder of a Creative studio that works with tech and AI companies...",
--   "industry_focus": "tech and AI companies",
--   "services": "promo and explainer videos, social media content",
--   "experience": "Been in the content space for more than 7 years"
-- }

COMMENT ON COLUMN organizations.icebreaker_context IS 'Customer context for personalized icebreaker generation';
