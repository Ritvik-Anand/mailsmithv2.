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

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trial', 'suspended', 'churned'
    features JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure status column exists if table was created previously without it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='status') THEN
        ALTER TABLE organizations ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    END IF;
END $$;

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
