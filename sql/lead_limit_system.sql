-- ============================================================================
-- LEAD LIMIT SYSTEM
-- ============================================================================

-- 1. Add monthly limit to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS monthly_lead_limit INTEGER DEFAULT 1000;

-- 2. Create lead limit requests table
CREATE TABLE IF NOT EXISTS lead_limit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    requested_limit INTEGER NOT NULL,
    current_limit INTEGER NOT NULL,
    reason TEXT,
    
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lead_limit_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own org limit requests" 
ON lead_limit_requests FOR SELECT 
USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can create limit requests"
ON lead_limit_requests FOR INSERT
WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

-- Index
CREATE INDEX IF NOT EXISTS idx_limit_requests_org ON lead_limit_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_limit_requests_status ON lead_limit_requests(status);
