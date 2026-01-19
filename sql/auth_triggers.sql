-- 1. Ensure columns exist (Safety Check)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS monthly_lead_limit INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 2. Helper Function to generate slugs
CREATE OR REPLACE FUNCTION public.slugify(text) RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(trim($1), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Trigger Function for Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id UUID;
  company_name_val TEXT;
  full_name_val TEXT;
  slug_val TEXT;
BEGIN
  -- Extract metadata from auth.users
  company_name_val := COALESCE(new.raw_user_meta_data->>'company_name', 'My Organization');
  full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', 'User');
  
  -- Create organization slug (ensure uniqueness)
  slug_val := public.slugify(company_name_val);
  
  -- Check if slug exists, if so append random
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = slug_val) THEN
    slug_val := slug_val || '-' || substr(md5(random()::text), 1, 4);
  END IF;

  -- 1. Create Organization
  INSERT INTO public.organizations (name, slug, plan, status, monthly_lead_limit)
  VALUES (company_name_val, slug_val, 'free', 'active', 1000)
  RETURNING id INTO new_org_id;

  -- 2. Create User Profile
  INSERT INTO public.users (id, organization_id, email, full_name, role, status)
  VALUES (
    new.id, 
    new_org_id, 
    new.email, 
    full_name_val, 
    'owner', 
    'active'
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error (optional) and continue
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FIX-UP Script for existing users who are missing public records
-- ============================================================================
-- You can run this in the Supabase SQL Editor to fix users who signed 
-- up before the trigger was added.

/*
INSERT INTO public.organizations (name, slug, plan, status)
SELECT 
  COALESCE(raw_user_meta_data->>'company_name', 'My Organization'),
  public.slugify(COALESCE(raw_user_meta_data->>'company_name', 'My Organization')) || '-' || substr(id::text, 1, 4),
  'free',
  'active'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

INSERT INTO public.users (id, organization_id, email, full_name, role, status)
SELECT 
  au.id,
  (SELECT o.id FROM public.organizations o WHERE o.slug LIKE public.slugify(COALESCE(au.raw_user_meta_data->>'company_name', 'My Organization')) || '%' ORDER BY o.created_at DESC LIMIT 1),
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'owner',
  'active'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);
*/
