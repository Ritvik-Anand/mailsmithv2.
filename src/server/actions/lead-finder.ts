'use server'

// =============================================================================
// LEAD FINDER - Server Actions
// =============================================================================
// Public-facing server actions for the Lead Finder feature.
// Users interact with these - they don't know about Apify.

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
    LeadSearchFilters,
    ScrapeJob,
    Lead,
    ApifyLeadResult
} from '@/types'
import {
    startLeadSearch,
    getLeadSearchStatus,
    fetchLeadSearchResults,
    abortLeadSearch,
    runSyncLeadSearch
} from '@/lib/lead-finder/apify-client'
import { DEFAULT_FETCH_COUNT, MAX_FETCH_COUNT } from '@/lib/lead-finder/constants'

// Internal actor identifier (hidden from users)
const ACTOR_ID = 'code_crafter~leads-finder'
const ACTOR_DISPLAY_NAME = 'MailSmith Lead Finder'

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get current user's organization ID
 */
async function getCurrentOrganizationId(): Promise<{ organizationId: string | null, error?: string }> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
        console.error('Auth check failed:', authError)
        return { organizationId: null, error: 'Authentication check failed' }
    }

    if (!user) {
        return { organizationId: null, error: 'No active session found' }
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (userError || !userData) {
        console.error('User data fetch failed:', userError)
        return { organizationId: null, error: 'User profile or organization not found' }
    }

    if (!userData.organization_id) {
        return { organizationId: null, error: 'User is not assigned to an organization' }
    }

    return { organizationId: userData.organization_id }
}

/**
 * Transform Apify results to Lead format
 */
function transformToLeads(
    results: ApifyLeadResult[],
    organizationId: string,
    scrapeJobId: string
): Partial<Lead>[] {
    return results
        .filter(r => r.email) // Must have email
        .map(r => ({
            organization_id: organizationId,
            first_name: r.first_name || null,
            last_name: r.last_name || null,
            email: r.email!,
            phone: r.mobile_number || null,
            linkedin_url: r.linkedin || null,
            company_name: r.company_name || null,
            company_domain: r.company_domain || null,
            job_title: r.job_title || null,
            industry: r.industry || null,
            company_size: r.company_size || null,
            location: [r.city, r.state, r.country].filter(Boolean).join(', ') || null,
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
            source: 'apify_leads_finder' as const,
            scrape_job_id: scrapeJobId,
            icebreaker_status: 'pending' as const,
            campaign_status: 'not_added' as const,
        }))
}

// -----------------------------------------------------------------------------
// Public Server Actions
// -----------------------------------------------------------------------------

/**
 * Start a new lead search job
 */
export async function startLeadSearchJob(filters: LeadSearchFilters): Promise<{
    success: boolean
    jobId?: string
    error?: string
}> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) {
            return { success: false, error: authError || 'Not authenticated' }
        }

        const supabase = await createClient()

        // 1. Check Usage & Limit
        const usage = await getLeadUsage()
        if (!usage.success) return { success: false, error: usage.error }

        const fetchCount = Math.min(
            filters.fetch_count || DEFAULT_FETCH_COUNT,
            MAX_FETCH_COUNT
        )

        if (usage.usage! + fetchCount > usage.limit!) {
            return {
                success: false,
                error: `Monthly lead limit exceeded. You have ${usage.limit! - usage.usage!} leads remaining. Request an increase in the settings tab.`
            }
        }

        // 2. Create scrape job record
        const searchFilters: LeadSearchFilters = {
            ...filters,
            fetch_count: fetchCount,
            email_status: filters.email_status || ['validated'],
        }

        const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .insert({
                organization_id: organizationId,
                actor_id: ACTOR_ID,
                actor_name: ACTOR_DISPLAY_NAME,
                input_params: searchFilters,
                status: 'pending',
            })
            .select()
            .single()

        if (jobError || !job) {
            console.error('Failed to create job:', jobError)
            return { success: false, error: 'Failed to create search job' }
        }

        // Get the webhook URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const webhookUrl = `${appUrl}/api/webhooks/lead-finder?jobId=${job.id}`

        // Start the search
        const { runId } = await startLeadSearch(searchFilters, webhookUrl)

        // Update job with run ID
        await supabase
            .from('scrape_jobs')
            .update({
                apify_run_id: runId,
                status: 'running',
                started_at: new Date().toISOString(),
            })
            .eq('id', job.id)

        // Log activity
        await supabase.from('activity_logs').insert({
            organization_id: organizationId,
            action: 'lead_search_started',
            resource_type: 'scrape_job',
            resource_id: job.id,
            metadata: { filters: searchFilters, runId },
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/dashboard/lead-finder')

        return { success: true, jobId: job.id }
    } catch (error: any) {
        console.error('Start lead search error:', error)
        return {
            success: false,
            error: error.message || 'Failed to start lead search'
        }
    }
}

/**
 * Quick search - synchronous, small batch (for preview)
 */
export async function quickLeadSearch(filters: LeadSearchFilters): Promise<{
    success: boolean
    leads?: ApifyLeadResult[]
    count?: number
    error?: string
}> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) {
            return { success: false, error: authError || 'Not authenticated' }
        }

        // Force small batch for quick search
        const quickFilters: LeadSearchFilters = {
            ...filters,
            fetch_count: 25, // Preview only
            email_status: filters.email_status || ['validated'],
        }

        const results = await runSyncLeadSearch(quickFilters)

        return {
            success: true,
            leads: results,
            count: results.length,
        }
    } catch (error) {
        console.error('Quick search error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Search failed',
        }
    }
}

/**
 * Get status of a search job
 */
export async function getSearchJobStatus(jobId: string): Promise<{
    success: boolean
    job?: ScrapeJob
    error?: string
}> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) {
            return { success: false, error: authError || 'Not authenticated' }
        }

        const supabase = await createClient()

        const { data: job, error } = await supabase
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .eq('organization_id', organizationId)
            .single()

        if (error || !job) {
            return { success: false, error: 'Job not found' }
        }

        // If running, check latest status
        if (job.status === 'running' && job.apify_run_id) {
            const status = await getLeadSearchStatus(job.apify_run_id)

            // Update if changed
            if (status.status === 'SUCCEEDED' || status.status === 'FAILED') {
                const newStatus = status.status === 'SUCCEEDED' ? 'completed' : 'failed'
                await supabase
                    .from('scrape_jobs')
                    .update({
                        status: newStatus,
                        completed_at: status.finishedAt,
                        error_message: status.status === 'FAILED' ? status.statusMessage : null,
                    })
                    .eq('id', jobId)

                job.status = newStatus
                job.completed_at = status.finishedAt
            }
        }

        return { success: true, job: job as ScrapeJob }
    } catch (error) {
        console.error('Get job status error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get status',
        }
    }
}

/**
 * Cancel a running search job
 */
export async function cancelSearchJob(jobId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) {
            return { success: false, error: authError || 'Not authenticated' }
        }

        const supabase = await createClient()

        const { data: job, error } = await supabase
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .eq('organization_id', organizationId)
            .single()

        if (error || !job) {
            return { success: false, error: 'Job not found' }
        }

        if (job.status !== 'running' || !job.apify_run_id) {
            return { success: false, error: 'Job is not running' }
        }

        await abortLeadSearch(job.apify_run_id)

        await supabase
            .from('scrape_jobs')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: 'Cancelled by user',
            })
            .eq('id', jobId)

        revalidatePath('/dashboard/lead-finder')

        return { success: true }
    } catch (error) {
        console.error('Cancel job error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel',
        }
    }
}

/**
 * Get all search jobs for current organization
 */
export async function getSearchJobs(options: {
    limit?: number
    status?: string
} = {}): Promise<{
    success: boolean
    jobs?: ScrapeJob[]
    error?: string
}> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) {
            return { success: false, error: authError || 'Not authenticated' }
        }

        const supabase = await createClient()

        let query = supabase
            .from('scrape_jobs')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (options.limit) {
            query = query.limit(options.limit)
        }

        if (options.status) {
            query = query.eq('status', options.status)
        }

        const { data, error } = await query

        if (error) {
            console.error('Get jobs error:', error)
            return { success: false, error: 'Failed to fetch jobs' }
        }

        return { success: true, jobs: data as ScrapeJob[] }
    } catch (error) {
        console.error('Get jobs error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch jobs',
        }
    }
}

/**
 * Process completed job results and import leads (called by webhook)
 */
export async function processJobResults(
    jobId: string,
    datasetId: string
): Promise<{
    success: boolean
    leadsImported?: number
    error?: string
}> {
    try {
        const supabase = await createClient()

        // Get the job
        const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            return { success: false, error: 'Job not found' }
        }

        // Fetch results from API
        const { items, total } = await fetchLeadSearchResults(datasetId)

        // Transform to leads
        const leads = transformToLeads(items, job.organization_id, jobId)

        // Deduplicate by email within this batch
        const uniqueLeads = leads.reduce((acc, lead) => {
            if (!acc.find(l => l.email === lead.email)) {
                acc.push(lead)
            }
            return acc
        }, [] as Partial<Lead>[])

        // Insert leads (ignore duplicates based on org + email unique constraint)
        let imported = 0
        if (uniqueLeads.length > 0) {
            const { data: insertedLeads, error: insertError } = await supabase
                .from('leads')
                .upsert(
                    uniqueLeads.map(l => ({
                        ...l,
                        updated_at: new Date().toISOString(),
                    })),
                    {
                        onConflict: 'organization_id,email',
                        ignoreDuplicates: false
                    }
                )
                .select('id')

            if (insertError) {
                console.error('Lead insert error:', insertError)
            } else {
                imported = insertedLeads?.length || 0
            }
        }

        // Update job
        await supabase
            .from('scrape_jobs')
            .update({
                status: 'completed',
                leads_found: total,
                leads_imported: imported,
                completed_at: new Date().toISOString(),
            })
            .eq('id', jobId)

        // Log activity
        await supabase.from('activity_logs').insert({
            organization_id: job.organization_id,
            action: 'lead_search_completed',
            resource_type: 'scrape_job',
            resource_id: jobId,
            metadata: { leadsFound: total, leadsImported: imported },
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/dashboard/lead-finder')

        return { success: true, leadsImported: imported }
    } catch (error) {
        console.error('Process results error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process results',
        }
    }
}

/**
 * Get leads from a specific search job
 */
export async function getLeadsFromJob(
    jobId: string,
    options: { page?: number; pageSize?: number } = {}
): Promise<{
    success: boolean
    leads?: Lead[]
    total?: number
    error?: string
}> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) {
            return { success: false, error: authError || 'Not authenticated' }
        }

        const { page = 1, pageSize = 50 } = options
        const offset = (page - 1) * pageSize

        const supabase = await createClient()

        // Get total count
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('scrape_job_id', jobId)

        // Get paginated leads
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('scrape_job_id', jobId)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1)

        if (error) {
            console.error('Get leads error:', error)
            return { success: false, error: 'Failed to fetch leads' }
        }

        return {
            success: true,
            leads: data as Lead[],
            total: count || 0,
        }
    } catch (error) {
        console.error('Get leads error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch leads',
        }
    }
}

/**
 * Get current month usage and limit for organization
 */
export async function getLeadUsage(): Promise<{
    success: boolean
    usage?: number
    limit?: number
    error?: string
}> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) return { success: false, error: authError || 'Not authenticated' }

        const supabase = await createClient()

        // 1. Get org limit
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('monthly_lead_limit')
            .eq('id', organizationId)
            .single()

        if (orgError) throw orgError

        // 2. Sum up usage for current month
        const firstOfMonth = new Date()
        firstOfMonth.setDate(1)
        firstOfMonth.setHours(0, 0, 0, 0)

        const { data: jobs, error: usageError } = await supabase
            .from('scrape_jobs')
            .select('leads_imported')
            .eq('organization_id', organizationId)
            .eq('status', 'completed')
            .gte('created_at', firstOfMonth.toISOString())

        if (usageError) throw usageError

        const totalUsage = jobs.reduce((sum, job) => sum + (job.leads_imported || 0), 0)

        return {
            success: true,
            usage: totalUsage,
            limit: org.monthly_lead_limit || 1000
        }
    } catch (error: any) {
        console.error('Get lead usage error:', error)
        return { success: false, error: error.message || 'Failed to fetch usage statistics' }
    }
}

/**
 * Request an increase in lead finding limit
 */
export async function requestLeadLimitIncrease(params: {
    requestedLimit: number
    reason: string
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { organizationId, error: authError } = await getCurrentOrganizationId()
        if (!organizationId) return { success: false, error: authError || 'Not authenticated' }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const usage = await getLeadUsage()
        if (!usage.success) return { success: false, error: usage.error }

        const { error } = await supabase
            .from('lead_limit_requests')
            .insert({
                organization_id: organizationId,
                user_id: user.id,
                current_limit: usage.limit,
                requested_limit: params.requestedLimit,
                reason: params.reason,
                status: 'pending'
            })

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('Request limit increase error:', error)
        return { success: false, error: 'Failed to submit request' }
    }
}
