-- Create system_admins table for Internal Team Management
CREATE TABLE IF NOT EXISTS system_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin', -- 'master', 'admin', 'support', 'success', 'analyst'
    permissions TEXT[] DEFAULT '{}',
    access_key TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with Initial Master Account
INSERT INTO system_admins (email, full_name, role, access_key, permissions)
VALUES (
    'ritvik@acquifix.com', 
    'Ritvik', 
    'master', 
    'Rv@129', 
    '{manage_admins, manage_customers, manage_support, manage_system, view_financials, view_logs, send_broadcasts}'
) ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated admins 
-- (Note: This policy is broad for initial setup; refine based on organization requirements)
CREATE POLICY "Admins can view team" ON system_admins FOR SELECT USING (true);
