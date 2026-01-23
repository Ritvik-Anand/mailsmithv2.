/**
 * Centralized logic for processing and transforming lead data from external sources (Apify)
 * 
 * DESIGN PRINCIPLE: Apify returns dynamic, variable data. We:
 * 1. Store ALL raw data in a JSONB column (raw_scraped_data) for maximum flexibility
 * 2. Only extract essential indexed fields as columns (email, name, company)
 * 3. Use the raw JSONB data for icebreaker generation and AI enrichment
 */

import { Lead } from '@/types'

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
 * Safely extract a string value from various possible field names
 */
function extractField(r: any, ...keys: string[]): string | null {
    for (const key of keys) {
        if (r[key] && typeof r[key] === 'string') {
            return r[key];
        }
    }
    return null;
}

/**
 * Transforms raw Apify results into our internal Lead format.
 * 
 * FLEXIBLE DESIGN:
 * - Only extracts CORE indexed fields as columns (for querying/filtering)
 * - Stores EVERYTHING in raw_scraped_data JSONB (for icebreaker generation)
 * - The AI icebreaker generator reads from raw_scraped_data, not individual columns
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

        // Extract ONLY essential indexed fields
        // Everything else stays in raw_scraped_data JSONB
        leads.push({
            // Required fields
            organization_id: organizationId,
            email: email,

            // Core contact info (indexed for search/filtering)
            first_name: extractField(r, 'first_name', 'firstName'),
            last_name: extractField(r, 'last_name', 'lastName'),
            phone: extractField(r, 'mobile_number', 'phone', 'phoneNumber'),
            linkedin_url: extractField(r, 'linkedin', 'linkedin_url', 'linkedinUrl'),

            // Core company info (indexed for search/filtering)
            company_name: extractField(r, 'company_name', 'companyName') || r.company?.name || null,
            job_title: extractField(r, 'job_title', 'jobTitle', 'title'),

            // ALL raw Apify data stored here for AI/icebreaker use
            // This is the source of truth for icebreaker generation
            raw_scraped_data: r as Record<string, unknown>,

            // Status tracking
            source: 'apify_leads_finder' as any,
            scrape_job_id: scrapeJobId as any,
            icebreaker_status: 'pending' as any,
            campaign_status: 'not_added' as any,
        });
    }

    return leads;
}
