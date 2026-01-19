// =============================================================================
// MAILSMITH v2 - Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Organizations (Tenants)
// -----------------------------------------------------------------------------
export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'trial' | 'suspended' | 'churned';
    features: OrganizationFeatures;
    settings: Record<string, unknown>;
    monthly_lead_limit: number;
    created_at: string;
    updated_at: string;
}

export interface OrganizationFeatures {
    maxLeads: number;
    maxCampaigns: number;
    maxTeamMembers: number;
    aiIcebreakers: boolean;
    csvImport: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    betaFeatures: string[];
}

export interface OrganizationWithStats extends Organization {
    _count: {
        leads: number;
        users: number;
        campaigns: number;
    };
    owner_email?: string;
}

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
export interface User {
    id: string;
    organization_id: string;
    email: string;
    full_name: string | null;
    role: 'owner' | 'admin' | 'member';
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export type AdminRole = 'master' | 'admin' | 'support' | 'success' | 'analyst';

export type AdminPermission =
    | 'manage_admins'
    | 'manage_customers'
    | 'manage_support'
    | 'manage_system'
    | 'view_financials'
    | 'view_logs'
    | 'send_broadcasts';

export interface SystemAdmin {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    role: AdminRole;
    permissions: AdminPermission[];
    access_key: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

// -----------------------------------------------------------------------------
// Leads
// -----------------------------------------------------------------------------
export interface Lead {
    id: string;
    organization_id: string;

    // Contact Info
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    linkedin_url: string | null;

    // Company Info
    company_name: string | null;
    company_domain: string | null;
    job_title: string | null;
    industry: string | null;
    company_size: string | null;
    location: string | null;

    // Enrichment
    raw_scraped_data: Record<string, unknown>;
    enrichment_data: Record<string, unknown>;

    // Icebreaker
    icebreaker_status: 'pending' | 'generating' | 'completed' | 'failed';
    icebreaker: string | null;
    icebreaker_generated_at: string | null;
    icebreaker_metadata: Record<string, unknown>;

    // Campaign
    campaign_id: string | null;
    campaign_status: 'not_added' | 'queued' | 'sent' | 'opened' | 'replied' | 'bounced';

    // Source
    source: 'apify_linkedin' | 'apify_apollo' | 'apify_leads_finder' | 'manual' | 'csv_import';
    scrape_job_id: string | null;

    created_at: string;
    updated_at: string;
}

export type LeadStatus = Lead['campaign_status'];
export type IcebreakerStatus = Lead['icebreaker_status'];

// -----------------------------------------------------------------------------
// Campaigns
// -----------------------------------------------------------------------------
export interface Campaign {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;

    // Instantly Integration
    instantly_campaign_id: string | null;
    instantly_account_id: string | null;

    // Email Template
    subject_template: string | null;
    body_template: string | null;

    // Sequences
    sequences: EmailSequence[];

    // Stats
    total_leads: number;
    emails_sent: number;
    emails_opened: number;
    emails_replied: number;
    emails_bounced: number;

    status: 'draft' | 'active' | 'paused' | 'completed';

    created_at: string;
    updated_at: string;
}

export interface EmailSequence {
    id: string;
    step: number;
    subject: string;
    body: string;
    wait_days: number;
}

export type CampaignStatus = Campaign['status'];

// -----------------------------------------------------------------------------
// Scrape Jobs (Lead Finder)
// -----------------------------------------------------------------------------
export interface ScrapeJob {
    id: string;
    organization_id: string;

    actor_id: string;
    actor_name: string | null;
    input_params: LeadSearchFilters;

    status: 'pending' | 'running' | 'completed' | 'failed';
    apify_run_id: string | null;

    leads_found: number;
    leads_imported: number;

    started_at: string | null;
    completed_at: string | null;
    error_message: string | null;

    created_at: string;
}

// -----------------------------------------------------------------------------
// Lead Search Filters (Lead Finder)
// -----------------------------------------------------------------------------
export interface LeadSearchFilters {
    // People Targeting
    contact_job_title?: string[];
    contact_not_job_title?: string[];
    seniority_level?: SeniorityLevel[];
    functional_level?: FunctionalLevel[];

    // Location (Include)
    contact_location?: string[];
    contact_city?: string[];

    // Location (Exclude)
    contact_not_location?: string[];
    contact_not_city?: string[];

    // Email Quality
    email_status?: EmailQuality[];

    // Company Targeting
    company_domain?: string[];
    size?: CompanySize[];
    company_industry?: string[];
    company_not_industry?: string[];
    company_keywords?: string[];
    company_not_keywords?: string[];
    min_revenue?: string;
    max_revenue?: string;
    funding?: FundingStage[];

    // General
    fetch_count?: number;
    file_name?: string;
}

export type SeniorityLevel =
    | 'founder' | 'owner' | 'c_suite' | 'director' | 'partner'
    | 'vp' | 'head' | 'manager' | 'senior' | 'entry' | 'trainee';

export type FunctionalLevel =
    | 'c_suite' | 'finance' | 'product' | 'engineering'
    | 'design' | 'hr' | 'it' | 'legal' | 'marketing'
    | 'operations' | 'sales' | 'support';

export type CompanySize =
    | '1-10' | '11-20' | '21-50' | '51-100'
    | '101-200' | '201-500' | '501-1000' | '1001-2000'
    | '2001-5000' | '5001-10000' | '10001-20000' | '20001-50000' | '50000+';

export type FundingStage =
    | 'seed' | 'angel' | 'series_a' | 'series_b' | 'series_c'
    | 'series_d' | 'series_e' | 'series_f' | 'venture'
    | 'debt' | 'convertible' | 'pe' | 'other';

export type EmailQuality = 'validated' | 'not_validated' | 'unknown';

// Lead Search Preset Templates
export interface LeadSearchPreset {
    id: string;
    name: string;
    description: string;
    icon?: string;
    filters: LeadSearchFilters;
}

// Apify Lead Result (raw from API)
export interface ApifyLeadResult {
    // Person fields
    first_name?: string;
    last_name?: string;
    full_name?: string;
    job_title?: string;
    headline?: string;
    functional_level?: string;
    seniority_level?: string;
    email?: string;
    mobile_number?: string;
    personal_email?: string;
    linkedin?: string;
    city?: string;
    state?: string;
    country?: string;

    // Company fields
    company_name?: string;
    company_domain?: string;
    company_website?: string;
    company_linkedin?: string;
    company_linkedin_uid?: string;
    company_size?: string;
    industry?: string;
    company_description?: string;
    company_annual_revenue?: string;
    company_annual_revenue_clean?: number;
    company_total_funding?: string;
    company_total_funding_clean?: number;
    company_founded_year?: number;
    company_phone?: string;
    company_street_address?: string;
    company_city?: string;
    company_state?: string;
    company_country?: string;
    company_postal_code?: string;
    company_full_address?: string;
    company_market_cap?: string;

    // Context
    keywords?: string[];
    company_technologies?: string[];
}

// -----------------------------------------------------------------------------
// Bug Reports
// -----------------------------------------------------------------------------
export interface BugReport {
    id: string;
    organization_id: string | null;
    user_id: string | null;

    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';

    browser_info: Record<string, unknown> | null;
    screenshot_urls: string[];

    admin_notes: string | null;
    assigned_to: string | null;
    resolved_at: string | null;

    created_at: string;
    updated_at: string;
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------
export interface Notification {
    id: string;
    organization_id: string | null; // null = broadcast to all
    user_id: string | null;

    type: 'system' | 'campaign' | 'alert' | 'reply' | 'admin' | 'bug_update';
    title: string;
    message: string;

    read: boolean;
    read_at: string | null;

    metadata: Record<string, unknown>;

    created_at: string;
}

// -----------------------------------------------------------------------------
// Dashboard Stats
// -----------------------------------------------------------------------------
export interface DashboardStats {
    activeCampaigns: number;
    totalLeads: number;
    emailsSent: number;
    openRate: number;
    replyRate: number;
    bounceRate: number;
}

export interface LeadBreakdown {
    new: number;
    contacted: number;
    opened: number;
    replied: number;
    noReply: number;
    bounced: number;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
