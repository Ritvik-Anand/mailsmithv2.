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
    features: OrganizationFeatures;
    settings: Record<string, unknown>;
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

export interface SystemAdmin {
    id: string;
    user_id: string;
    role: 'super_admin' | 'admin' | 'support';
    created_at: string;
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
    source: 'apify_linkedin' | 'apify_apollo' | 'manual' | 'csv_import';
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
// Scrape Jobs
// -----------------------------------------------------------------------------
export interface ScrapeJob {
    id: string;
    organization_id: string;

    actor_id: string;
    actor_name: string | null;
    input_params: Record<string, unknown>;

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
