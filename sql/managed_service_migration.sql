-- ============================================================================
-- MANAGED SERVICE PIVOT - DATABASE MIGRATION
-- ============================================================================
-- This migration adds support for the 3-role system:
-- - super_admin: Full system access
-- - operator: Campaign operations for assigned customers
-- - customer: Read-only portal access
-- Run in Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD ROLE COLUMN TO USERS TABLE
-- ============================================================================

-- Add role column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer';
    END IF;
END $$;

-- Update existing users based on current state
-- (Existing admins stay as super_admin, rest become customers)
DO $$
BEGIN
    -- Check if there are any system_admins and mark them as super_admin
    UPDATE users 
    SET role = 'super_admin'
    WHERE id IN (SELECT user_id FROM system_admins WHERE user_id IS NOT NULL);
    
    -- Everyone else without a role becomes a customer
    UPDATE users 
    SET role = 'customer'
    WHERE role IS NULL;
END $$;

-- ============================================================================
-- STEP 2: ADD ORGANIZATION HEALTH TRACKING
-- ============================================================================

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='health_score') THEN
        ALTER TABLE organizations ADD COLUMN health_score INTEGER DEFAULT 100;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='last_activity_at') THEN
        ALTER TABLE organizations ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='account_manager_notes') THEN
        ALTER TABLE organizations ADD COLUMN account_manager_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='primary_contact_email') THEN
        ALTER TABLE organizations ADD COLUMN primary_contact_email TEXT;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE OPERATOR ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS operator_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,  -- Primary account manager
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,  -- Internal notes about this customer
    UNIQUE(operator_user_id, organization_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_operator_assignments_operator ON operator_assignments(operator_user_id);
CREATE INDEX IF NOT EXISTS idx_operator_assignments_org ON operator_assignments(organization_id);

-- ============================================================================
-- STEP 4: CREATE AI CHAT TABLES
-- ============================================================================

-- Chat sessions (one per conversation thread)
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,  -- Auto-generated from first message
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages within sessions
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',  -- Store tool calls, data queries, etc.
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast message retrieval
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_org ON ai_chat_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created ON ai_chat_messages(created_at DESC);

-- ============================================================================
-- STEP 5: CREATE CUSTOMER REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom', 'on_demand')),
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    file_url TEXT,  -- Supabase storage URL to PDF
    ai_summary TEXT,  -- AI-generated executive summary
    metrics_snapshot JSONB DEFAULT '{}',  -- Snapshot of key metrics at generation time
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for report retrieval
CREATE INDEX IF NOT EXISTS idx_customer_reports_org ON customer_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_reports_date ON customer_reports(generated_at DESC);

-- ============================================================================
-- STEP 6: CREATE ACTIVITY FEED TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,  -- 'lead_scraped', 'email_sent', 'email_opened', 'reply_received', 'campaign_started', etc.
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',  -- Additional context data
    is_highlight BOOLEAN DEFAULT false,  -- Show prominently
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast feed retrieval
CREATE INDEX IF NOT EXISTS idx_activity_feed_org ON activity_feed(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);

-- ============================================================================
-- STEP 7: ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: CREATE RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- OPERATOR_ASSIGNMENTS policies
-- Only super_admins can manage assignments, operators can view their own
DROP POLICY IF EXISTS "Super admins can manage all assignments" ON operator_assignments;
DROP POLICY IF EXISTS "Operators can view their assignments" ON operator_assignments;

CREATE POLICY "Super admins can manage all assignments" ON operator_assignments FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Operators can view their assignments" ON operator_assignments FOR SELECT
USING (operator_user_id = auth.uid());

-- AI_CHAT_SESSIONS policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON ai_chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON ai_chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON ai_chat_sessions;

CREATE POLICY "Users can view own chat sessions" ON ai_chat_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own chat sessions" ON ai_chat_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions" ON ai_chat_sessions FOR UPDATE
USING (user_id = auth.uid());

-- AI_CHAT_MESSAGES policies
DROP POLICY IF EXISTS "Users can view messages in own sessions" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in own sessions" ON ai_chat_messages;

CREATE POLICY "Users can view messages in own sessions" ON ai_chat_messages FOR SELECT
USING (
    session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert messages in own sessions" ON ai_chat_messages FOR INSERT
WITH CHECK (
    session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = auth.uid())
);

-- CUSTOMER_REPORTS policies
DROP POLICY IF EXISTS "Customers can view own reports" ON customer_reports;
DROP POLICY IF EXISTS "Operators can manage assigned customer reports" ON customer_reports;
DROP POLICY IF EXISTS "Super admins can manage all reports" ON customer_reports;

CREATE POLICY "Customers can view own reports" ON customer_reports FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Operators can manage assigned customer reports" ON customer_reports FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM operator_assignments WHERE operator_user_id = auth.uid()
    )
);

CREATE POLICY "Super admins can manage all reports" ON customer_reports FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- ACTIVITY_FEED policies
DROP POLICY IF EXISTS "Customers can view own activity" ON activity_feed;
DROP POLICY IF EXISTS "Operators can manage assigned customer activity" ON activity_feed;
DROP POLICY IF EXISTS "Super admins can manage all activity" ON activity_feed;

CREATE POLICY "Customers can view own activity" ON activity_feed FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Operators can manage assigned customer activity" ON activity_feed FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM operator_assignments WHERE operator_user_id = auth.uid()
    )
);

CREATE POLICY "Super admins can manage all activity" ON activity_feed FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Service role bypass for all new tables
CREATE POLICY "Service role can manage all operator_assignments" ON operator_assignments FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all ai_chat_sessions" ON ai_chat_sessions FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all ai_chat_messages" ON ai_chat_messages FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all customer_reports" ON customer_reports FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage all activity_feed" ON activity_feed FOR ALL
TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is operator for an organization
CREATE OR REPLACE FUNCTION is_operator_for_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM operator_assignments 
        WHERE operator_user_id = auth.uid() 
        AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is operator
CREATE OR REPLACE FUNCTION is_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONE! Migration completed successfully.
-- ============================================================================
