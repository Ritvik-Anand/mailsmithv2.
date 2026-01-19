// =============================================================================
// LEAD FINDER - Constants & Configuration
// =============================================================================
// This module provides configuration for the Lead Finder feature.
// Abstracting away the underlying Apify integration from the user.

import {
    LeadSearchPreset,
    SeniorityLevel,
    FunctionalLevel,
    CompanySize,
    FundingStage,
    EmailQuality
} from '@/types';

// -----------------------------------------------------------------------------
// Filter Options
// -----------------------------------------------------------------------------

export const SENIORITY_LEVELS: { value: SeniorityLevel; label: string }[] = [
    { value: 'founder', label: 'Founder' },
    { value: 'owner', label: 'Owner' },
    { value: 'c_suite', label: 'C-Level Executive' },
    { value: 'director', label: 'Director' },
    { value: 'partner', label: 'Partner' },
    { value: 'vp', label: 'Vice President' },
    { value: 'head', label: 'Head of Department' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior', label: 'Senior Individual Contributor' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'trainee', label: 'Trainee / Intern' },
];

export const FUNCTIONAL_LEVELS: { value: FunctionalLevel; label: string }[] = [
    { value: 'c_suite', label: 'Executive / C-Suite' },
    { value: 'finance', label: 'Finance & Accounting' },
    { value: 'product', label: 'Product Management' },
    { value: 'engineering', label: 'Engineering & Development' },
    { value: 'design', label: 'Design & Creative' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'it', label: 'IT & Infrastructure' },
    { value: 'legal', label: 'Legal & Compliance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'sales', label: 'Sales & Business Development' },
    { value: 'support', label: 'Customer Support' },
];

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
    { value: '1-10', label: 'Small (1-10)' },
    { value: '11-20', label: 'Small-Medium (11-20)' },
    { value: '21-50', label: 'Medium (21-50)' },
    { value: '51-100', label: 'Medium-Large (51-100)' },
    { value: '101-200', label: 'Large (101-200)' },
    { value: '201-500', label: 'Very Large (201-500)' },
    { value: '501-1000', label: 'Enterprise (501-1000)' },
    { value: '1001-2000', label: 'Enterprise+ (1001-2000)' },
    { value: '2001-5000', label: 'Large Enterprise (2001-5000)' },
    { value: '5001-10000', label: 'Major Corporation (5001-10000)' },
    { value: '10001-20000', label: 'Global Enterprise (10001-20000)' },
    { value: '20001-50000', label: 'Global Enterprise+ (20001-50000)' },
    { value: '50000+', label: 'Multinational (50000+)' },
];

export const FUNDING_STAGES: { value: FundingStage; label: string }[] = [
    { value: 'seed', label: 'Seed' },
    { value: 'angel', label: 'Angel' },
    { value: 'series_a', label: 'Series A' },
    { value: 'series_b', label: 'Series B' },
    { value: 'series_c', label: 'Series C' },
    { value: 'series_d', label: 'Series D' },
    { value: 'series_e', label: 'Series E' },
    { value: 'series_f', label: 'Series F' },
    { value: 'venture', label: 'Venture' },
    { value: 'debt', label: 'Debt Financing' },
    { value: 'convertible', label: 'Convertible Note' },
    { value: 'pe', label: 'Private Equity' },
    { value: 'other', label: 'Other' },
];

export const REVENUE_RANGES: { value: string; label: string }[] = [
    { value: '100K', label: '$100K' },
    { value: '500K', label: '$500K' },
    { value: '1M', label: '$1M' },
    { value: '5M', label: '$5M' },
    { value: '10M', label: '$10M' },
    { value: '25M', label: '$25M' },
    { value: '50M', label: '$50M' },
    { value: '100M', label: '$100M' },
    { value: '250M', label: '$250M' },
    { value: '500M', label: '$500M' },
    { value: '1B', label: '$1B' },
    { value: '5B', label: '$5B' },
    { value: '10B', label: '$10B+' },
];

export const EMAIL_QUALITY_OPTIONS: { value: EmailQuality; label: string; description: string }[] = [
    {
        value: 'validated',
        label: 'Verified Only',
        description: 'Highest quality, verified deliverable emails'
    },
    {
        value: 'not_validated',
        label: 'Unverified',
        description: 'Emails that have not been verified'
    },
    {
        value: 'unknown',
        label: 'Unknown Status',
        description: 'Emails with uncertain deliverability'
    },
];

// -----------------------------------------------------------------------------
// Popular Industries
// -----------------------------------------------------------------------------

export const POPULAR_INDUSTRIES: string[] = [
    'computer software',
    'internet',
    'information technology & services',
    'marketing & advertising',
    'saas',
    'financial services',
    'e-commerce',
    'retail',
    'healthcare',
    'biotechnology',
    'pharmaceuticals',
    'real estate',
    'construction',
    'manufacturing',
    'automotive',
    'telecommunications',
    'media & entertainment',
    'education',
    'professional services',
    'consulting',
    'legal services',
    'accounting',
    'human resources',
    'logistics & supply chain',
    'energy',
    'oil & gas',
    'agriculture',
    'food & beverage',
    'hospitality',
    'travel & tourism',
    'non-profit',
    'government',
];

// -----------------------------------------------------------------------------
// Search Presets
// -----------------------------------------------------------------------------

export const SEARCH_PRESETS: LeadSearchPreset[] = [
    {
        id: 'saas-decision-makers',
        name: 'SaaS Decision Makers',
        description: 'C-Level and VPs at SaaS companies in the US',
        icon: '🚀',
        filters: {
            seniority_level: ['c_suite', 'vp', 'director'],
            contact_location: ['united states'],
            company_industry: ['computer software', 'saas', 'internet'],
            email_status: ['validated'],
            fetch_count: 1000,
        },
    },
    {
        id: 'startup-founders',
        name: 'Startup Founders',
        description: 'Founders and CEOs at funded startups',
        icon: '💡',
        filters: {
            seniority_level: ['founder', 'owner', 'c_suite'],
            size: ['1-10', '11-20', '21-50', '51-100'],
            funding: ['seed', 'angel', 'series_a', 'series_b'],
            email_status: ['validated'],
            fetch_count: 1000,
        },
    },
    {
        id: 'marketing-leaders',
        name: 'Marketing Leaders',
        description: 'CMOs, VPs of Marketing, and Marketing Directors',
        icon: '📢',
        filters: {
            contact_job_title: ['CMO', 'VP Marketing', 'Head of Marketing', 'Marketing Director'],
            functional_level: ['marketing'],
            seniority_level: ['c_suite', 'vp', 'director', 'head'],
            email_status: ['validated'],
            fetch_count: 1000,
        },
    },
    {
        id: 'sales-leaders',
        name: 'Sales Leaders',
        description: 'CROs, VPs of Sales, and Sales Directors',
        icon: '💼',
        filters: {
            contact_job_title: ['CRO', 'VP Sales', 'Head of Sales', 'Sales Director'],
            functional_level: ['sales'],
            seniority_level: ['c_suite', 'vp', 'director', 'head'],
            email_status: ['validated'],
            fetch_count: 1000,
        },
    },
    {
        id: 'tech-leaders-uk',
        name: 'Tech Leaders (UK)',
        description: 'CTOs and Engineering leaders in the UK',
        icon: '🇬🇧',
        filters: {
            contact_job_title: ['CTO', 'VP Engineering', 'Head of Engineering'],
            functional_level: ['engineering'],
            contact_location: ['united kingdom'],
            email_status: ['validated', 'unknown'],
            fetch_count: 1000,
        },
    },
    {
        id: 'ecommerce-executives',
        name: 'E-commerce Executives',
        description: 'Decision makers at online retail companies',
        icon: '🛒',
        filters: {
            seniority_level: ['c_suite', 'vp', 'director'],
            company_industry: ['e-commerce', 'retail', 'consumer goods'],
            email_status: ['validated'],
            fetch_count: 1000,
        },
    },
    {
        id: 'fintech-leaders',
        name: 'Fintech Leaders',
        description: 'Executives at financial technology companies',
        icon: '🏦',
        filters: {
            seniority_level: ['c_suite', 'vp', 'director'],
            company_industry: ['financial services', 'fintech', 'banking'],
            funding: ['series_a', 'series_b', 'series_c', 'series_d'],
            email_status: ['validated'],
            fetch_count: 1000,
        },
    },
    {
        id: 'hr-tech-buyers',
        name: 'HR Tech Buyers',
        description: 'HR leaders who purchase HR software',
        icon: '👥',
        filters: {
            contact_job_title: ['CHRO', 'VP HR', 'Head of HR', 'HR Director', 'VP People'],
            functional_level: ['hr'],
            size: ['51-100', '101-200', '201-500', '501-1000'],
            email_status: ['validated'],
            fetch_count: 1000,
        },
    },
];

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

export const DEFAULT_FETCH_COUNT = 500;
export const MAX_FETCH_COUNT = 50000;
export const FREE_PLAN_LIMIT = 100;

// Pricing approximation (for UI display)
export const COST_PER_1000_LEADS = 1.5;
