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
    { value: 'Founder', label: 'Founder' },
    { value: 'Owner', label: 'Owner' },
    { value: 'C-Level', label: 'C-Level Executive' },
    { value: 'Director', label: 'Director' },
    { value: 'VP', label: 'Vice President' },
    { value: 'Head', label: 'Head of Department' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Senior', label: 'Senior Individual Contributor' },
    { value: 'Entry', label: 'Entry Level' },
    { value: 'Trainee', label: 'Trainee / Intern' },
];

export const FUNCTIONAL_LEVELS: { value: FunctionalLevel; label: string }[] = [
    { value: 'C-Level', label: 'Executive / C-Suite' },
    { value: 'Finance', label: 'Finance & Accounting' },
    { value: 'Product', label: 'Product Management' },
    { value: 'Engineering', label: 'Engineering & Development' },
    { value: 'Design', label: 'Design & Creative' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'IT', label: 'IT & Infrastructure' },
    { value: 'Legal', label: 'Legal & Compliance' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Sales', label: 'Sales & Business Development' },
    { value: 'Support', label: 'Customer Support' },
];

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
    { value: '0-1', label: 'Solo (0-1)' },
    { value: '2-10', label: 'Micro (2-10)' },
    { value: '11-20', label: 'Small (11-20)' },
    { value: '21-50', label: 'Small-Medium (21-50)' },
    { value: '51-100', label: 'Medium (51-100)' },
    { value: '101-200', label: 'Medium-Large (101-200)' },
    { value: '201-500', label: 'Large (201-500)' },
    { value: '501-1000', label: 'Enterprise (501-1000)' },
    { value: '1001-2000', label: 'Enterprise+ (1001-2000)' },
    { value: '2001-5000', label: 'Large Enterprise (2001-5000)' },
    { value: '10000+', label: 'Global Enterprise (10000+)' },
];

export const FUNDING_STAGES: { value: FundingStage; label: string }[] = [
    { value: 'Seed', label: 'Seed' },
    { value: 'Angel', label: 'Angel' },
    { value: 'Series A', label: 'Series A' },
    { value: 'Series B', label: 'Series B' },
    { value: 'Series C', label: 'Series C' },
    { value: 'Series D', label: 'Series D' },
    { value: 'Series E', label: 'Series E' },
    { value: 'Series F', label: 'Series F' },
    { value: 'Venture', label: 'Venture' },
    { value: 'Debt', label: 'Debt Financing' },
    { value: 'Convertible', label: 'Convertible Note' },
    { value: 'PE', label: 'Private Equity' },
    { value: 'Other', label: 'Other' },
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
    'Computer Software',
    'Internet',
    'Information Technology & Services',
    'Marketing & Advertising',
    'SaaS',
    'Financial Services',
    'E-commerce',
    'Retail',
    'Healthcare',
    'Biotechnology',
    'Pharmaceuticals',
    'Real Estate',
    'Construction',
    'Manufacturing',
    'Automotive',
    'Telecommunications',
    'Media & Entertainment',
    'Education',
    'Professional Services',
    'Consulting',
    'Legal Services',
    'Accounting',
    'Human Resources',
    'Logistics & Supply Chain',
    'Energy',
    'Oil & Gas',
    'Agriculture',
    'Food & Beverage',
    'Hospitality',
    'Travel & Tourism',
    'Non-profit',
    'Government',
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
            seniority_level: ['C-Level', 'VP', 'Director'],
            contact_location: ['United States'],
            company_industry: ['Computer Software', 'SaaS', 'Internet'],
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
            seniority_level: ['Founder', 'Owner', 'C-Level'],
            size: ['2-10', '11-20', '21-50', '51-100'],
            funding: ['Seed', 'Angel', 'Series A', 'Series B'],
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
            functional_level: ['Marketing'],
            seniority_level: ['C-Level', 'VP', 'Director', 'Head'],
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
            functional_level: ['Sales'],
            seniority_level: ['C-Level', 'VP', 'Director', 'Head'],
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
            functional_level: ['Engineering'],
            contact_location: ['United Kingdom'],
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
            seniority_level: ['C-Level', 'VP', 'Director'],
            company_industry: ['E-commerce', 'Retail', 'Consumer Goods'],
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
            seniority_level: ['C-Level', 'VP', 'Director'],
            company_industry: ['Financial Services', 'Fintech', 'Banking'],
            funding: ['Series A', 'Series B', 'Series C', 'Series D'],
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
            functional_level: ['HR'],
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
