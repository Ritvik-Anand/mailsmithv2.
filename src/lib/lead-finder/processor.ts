/**
 * Centralized logic for processing and transforming lead data from external sources (Apify)
 */

import { ApifyLeadResult, Lead } from '@/types'

/**
 * Robustly find an email address in an Apify result.
 * Handles variations like 'email', 'personal_email', 'work_email', 'emails' array, etc.
 * Scans nested objects and all string fields as a fallback.
 */
export function findEmail(r: any): string | null {
    if (!r) return null;

    // 1. Check known standard keys first for speed/accuracy
    const standardKeys = [
        'email', 'personal_email', 'work_email', 'contact_email',
        'email_address', 'primary_email', 'business_email', 'emails',
        'personalEmail', 'workEmail', 'contactEmail', 'emailAddress', 'primaryEmail'
    ];

    for (const key of standardKeys) {
        const val = r[key];
        if (!val) continue;

        // String format - use regex to find email anywhere in the string
        if (typeof val === 'string' && val.includes('@')) {
            const match = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (match) return match[0];
            // Fallback: if it has @ but doesn't perfectly match standard email regex, just trim it
            const trimmed = val.trim();
            if (trimmed.includes('@') && !trimmed.includes(' ')) return trimmed;
        }

        // Array format
        if (Array.isArray(val)) {
            for (const item of val) {
                if (typeof item === 'string' && item.includes('@')) {
                    const match = item.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    if (match) return match[0];
                }
                if (typeof item === 'object') {
                    const found = findEmail(item);
                    if (found) return found;
                }
            }
        }
    }

    // 2. Comprehensive crawl of all keys
    for (const key in r) {
        const val = r[key];
        if (!val) continue;

        if (typeof val === 'string' && val.includes('@') && val.length > 5) {
            const match = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (match) return match[0];
        }

        if (typeof val === 'object') {
            const found = findEmail(val);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Transforms raw Apify results into our internal Lead format.
 */
export function transformToLeads(
    results: any[],
    organizationId: string,
    scrapeJobId: string
): Partial<Lead>[] {
    const leads: Partial<Lead>[] = [];

    for (const r of results) {
        const email = findEmail(r);
        if (!email) continue;

        leads.push({
            organization_id: organizationId,
            first_name: r.first_name || r.firstName || null,
            last_name: r.last_name || r.lastName || null,
            email: email,
            phone: r.mobile_number || r.phone || r.phoneNumber || null,
            linkedin_url: r.linkedin || r.linkedin_url || r.linkedinUrl || null,
            company_name: r.company_name || r.companyName || r.company?.name || null,
            company_domain: r.company_domain || r.company_website || r.website || null,
            job_title: r.job_title || r.jobTitle || r.title || null,
            industry: r.industry || r.company_industry || null,
            company_size: r.company_size || r.size || null,
            location: [r.city, r.state, r.country].filter(Boolean).join(', ') || r.location || null,
            raw_scraped_data: r as Record<string, unknown>,
            enrichment_data: {
                headline: r.headline,
                functional_level: r.functional_level,
                seniority_level: r.seniority_level,
                personal_email: r.personal_email,
                company_linkedin: r.company_linkedin,
                company_description: r.company_description,
                company_funding: r.company_total_funding,
                company_revenue: r.company_annual_revenue,
                company_founded: r.company_founded_year,
                technologies: r.company_technologies,
            },
            source: 'apify_leads_finder' as any,
            scrape_job_id: scrapeJobId as any,
            icebreaker_status: 'pending' as any,
            campaign_status: 'not_added' as any,
        });
    }

    return leads;
}
