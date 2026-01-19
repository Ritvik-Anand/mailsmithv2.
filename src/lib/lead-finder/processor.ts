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

    // 1. Check standard keys (case-insensitive-ish)
    const standardKeys = [
        'email', 'personal_email', 'work_email', 'contact_email',
        'email_address', 'primary_email', 'business_email', 'emails'
    ];

    for (const key of standardKeys) {
        const val = r[key];
        if (typeof val === 'string' && val.includes('@')) return val.trim();
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && val[0].includes('@')) return val[0].trim();
    }

    // 2. Scan all top-level keys for any string that looks like an email
    for (const key in r) {
        const val = r[key];
        if (typeof val === 'string' && val.length > 5 && val.includes('@')) {
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
                return val.trim();
            }
        }
    }

    // 3. Deep scan common nested objects
    const nestedObjects = ['contact', 'enrichment', 'profile', 'company', 'person'];
    for (const objKey of nestedObjects) {
        if (r[objKey] && typeof r[objKey] === 'object') {
            const nestedEmail = findEmail(r[objKey]);
            if (nestedEmail) return nestedEmail;
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
