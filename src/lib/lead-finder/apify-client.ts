// =============================================================================
// LEAD FINDER - Apify Integration (Internal)
// =============================================================================
// This module handles all communication with the Apify API.
// This is an internal module - users should NOT know we use Apify.

import { LeadSearchFilters, ApifyLeadResult } from '@/types';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = 'code_crafter~leads-finder';
const APIFY_BASE_URL = 'https://api.apify.com/v2';

// Input interface for Apify (internal only)
interface ApifyActorInput extends LeadSearchFilters {
    // Any additional Apify-specific fields
}

// Run result from Apify
interface ApifyRunResult {
    id: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    defaultDatasetId: string;
    defaultKeyValueStoreId: string;
    exitCode: number | null;
    statusMessage: string | null;
}

// API response types
interface ApifyRunResponse {
    data: ApifyRunResult;
}

interface ApifyDatasetResponse {
    items: ApifyLeadResult[];
    count: number;
    offset: number;
    limit: number;
    total: number;
}

/**
 * Validates that Apify is configured
 */
function validateConfig(): void {
    if (!APIFY_API_TOKEN) {
        throw new Error('Lead search service is not configured. Please contact support.');
    }
}

/**
 * Start a new lead search job
 * Returns the run ID for tracking
 */
export async function startLeadSearch(
    filters: LeadSearchFilters,
    webhookUrl?: string
): Promise<{ runId: string; status: string }> {
    validateConfig();

    // Normalization: Apify actor is extremely strict about lowercase for enum-like fields
    const normalizedFilters = { ...filters };

    // Fields that MUST be lowercase
    const lowercaseFields: (keyof LeadSearchFilters)[] = [
        'contact_location',
        'contact_city',
        'company_industry',
        'company_location',
        'functional_level' as any,
        'funding' as any,
        'size' as any
    ];

    lowercaseFields.forEach(field => {
        const val = normalizedFilters[field];
        if (Array.isArray(val)) {
            (normalizedFilters[field] as any) = val.map(v => typeof v === 'string' ? v.toLowerCase() : v);
        }
    });

    const input: ApifyActorInput = {
        ...normalizedFilters,
        // Ensure validated emails by default
        email_status: filters.email_status || ['validated'],
    };

    const url = `${APIFY_BASE_URL}/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`;

    const body: Record<string, unknown> = {};

    // Add webhook if provided
    if (webhookUrl) {
        body.webhooks = [{
            eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED', 'ACTOR.RUN.ABORTED'],
            requestUrl: webhookUrl,
        }];
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...body,
            ...input,
        }),
    });

    if (!response.ok) {
        let errorDetail = 'Unknown error'
        try {
            const errorJson = await response.json()
            errorDetail = errorJson.error?.message || JSON.stringify(errorJson)
        } catch {
            errorDetail = await response.text()
        }
        console.error('Lead search start failed:', errorDetail)
        throw new Error(`Failed to start lead search: ${errorDetail}`)
    }

    const result: ApifyRunResponse = await response.json();

    return {
        runId: result.data.id,
        status: result.data.status,
    };
}

/**
 * Check the status of a running lead search
 */
export async function getLeadSearchStatus(runId: string): Promise<{
    status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'READY' | 'ABORTING';
    startedAt: string | null;
    finishedAt: string | null;
    datasetId: string;
    statusMessage: string | null;
}> {
    validateConfig();

    const url = `${APIFY_BASE_URL}/actor-runs/${runId}?token=${APIFY_API_TOKEN}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to check search status. Please try again.');
    }

    const result: ApifyRunResponse = await response.json();

    return {
        status: result.data.status as 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'READY' | 'ABORTING',
        startedAt: result.data.startedAt,
        finishedAt: result.data.finishedAt,
        datasetId: result.data.defaultDatasetId,
        statusMessage: result.data.statusMessage,
    };
}

/**
 * Fetch results from a completed lead search
 */
export async function fetchLeadSearchResults(
    datasetId: string,
    options: { limit?: number; offset?: number } = {}
): Promise<{ items: ApifyLeadResult[]; total: number }> {
    validateConfig();

    const { limit = 1000, offset = 0 } = options;
    const url = `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&limit=${limit}&offset=${offset}&format=json`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch search results. Please try again.');
    }

    // Apify returns items as a direct array when using /items endpoint
    const items: ApifyLeadResult[] = await response.json();

    // Get dataset info for total count
    const infoUrl = `${APIFY_BASE_URL}/datasets/${datasetId}?token=${APIFY_API_TOKEN}`;
    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();

    return {
        items,
        total: infoData.data?.itemCount || items.length,
    };
}

/**
 * Abort a running lead search
 */
export async function abortLeadSearch(runId: string): Promise<void> {
    validateConfig();

    const url = `${APIFY_BASE_URL}/actor-runs/${runId}/abort?token=${APIFY_API_TOKEN}`;

    const response = await fetch(url, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error('Failed to abort search. Please try again.');
    }
}

/**
 * Run a synchronous lead search (waits for completion)
 * Use for small searches only (< 100 leads)
 */
export async function runSyncLeadSearch(
    filters: LeadSearchFilters
): Promise<ApifyLeadResult[]> {
    validateConfig();

    // Force small batch for sync
    const input: ApifyActorInput = {
        ...filters,
        fetch_count: Math.min(filters.fetch_count || 100, 100),
        email_status: filters.email_status || ['validated'],
    };

    const url = `${APIFY_BASE_URL}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Sync lead search failed:', error);
        throw new Error('Lead search failed. Please try again.');
    }

    const items: ApifyLeadResult[] = await response.json();
    return items;
}
