-- Scraping Templates Table
-- Stores reusable scraping parameter configurations

CREATE TABLE IF NOT EXISTS scraping_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filters JSONB NOT NULL, -- Stores the LeadSearchFilters object
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scraping_templates_org ON scraping_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraping_templates_created_by ON scraping_templates(created_by);

-- RLS Policies
ALTER TABLE scraping_templates ENABLE ROW LEVEL SECURITY;

-- Users can view templates from their organization
CREATE POLICY "Users can view org templates"
ON scraping_templates
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Users can create templates for their organization
CREATE POLICY "Users can create templates"
ON scraping_templates
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON scraping_templates
FOR UPDATE
USING (created_by = auth.uid());

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON scraping_templates
FOR DELETE
USING (created_by = auth.uid());

-- Super admins and operators can do anything
CREATE POLICY "Admins have full access to templates"
ON scraping_templates
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'operator')
    )
);

COMMENT ON TABLE scraping_templates IS 'Stores reusable scraping parameter templates for lead finder';
COMMENT ON COLUMN scraping_templates.filters IS 'JSONB object containing LeadSearchFilters (job titles, locations, industries, etc.)';
