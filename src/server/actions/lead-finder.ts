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
import { startLeadSearch, getLeadSearchStatus, fetchLeadSearchResults, abortLeadSearch, runSyncLeadSearch } from '@/lib/lead-finder/apify-client'
import { DEFAULT_FETCH_COUNT, MAX_FETCH_COUNT } from '@/lib/lead-finder/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import { transformToLeads } from '@/lib/lead-finder/processor'

// Internal actor identifier (hidden from users)
const ACTOR_ID = 'code_crafter~leads-finder'
const ACTOR_DISPLAY_NAME = 'MailSmith Lead Finder'

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get current user's organization ID and role
 */
async function getCurrentUserContext(): Promise<{
    organizationId: string | null
    userId: string | null
    role: string | null
    error?: string
}> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
        console.error('Auth check failed:', authError)
        return { organizationId: null, userId: null, role: null, error: 'Authentication check failed' }
    }

    if (!user) {
        return { organizationId: null, userId: null, role: null, error: 'No active session found' }
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    if (userError || !userData) {
        console.error('User data fetch failed:', userError)
        return { organizationId: null, userId: user.id, role: null, error: 'User profile not found' }
    }

    return {
        organizationId: userData.organization_id,
        userId: user.id,
        role: userData.role
    }
}

/**
 * Robustly find an email address in an Apify result.
 * Handles variations like 'email', 'personal_email', 'work_email', 'emails' array, etc.
 */
// Logic moved to src/lib/lead-finder/processor.ts

// -----------------------------------------------------------------------------
// Public Server Actions
// -----------------------------------------------------------------------------

/**
 * Start a new lead search job
 */
export async function startLeadSearchJob(filters: LeadSearchFilters, targetOrganizationId?: string): Promise<{
    success: boolean
    jobId?: string
    error?: string
}> {
    try {
        const { organizationId: userOrgId, role, error: authError } = await getCurrentUserContext()

        // Authentication check
        if (authError && authError !== 'User profile not found') {
            return { success: false, error: authError }
        }

        // Determine which organization to use
        let organizationId: string | null = null

        // Operators and super_admins can specify a target organization
        if (role === 'super_admin' || role === 'operator') {
            if (targetOrganizationId) {
                organizationId = targetOrganizationId
            } else if (userOrgId) {
                organizationId = userOrgId
            } else {
                return { success: false, error: 'Please select a target customer for this scrape job' }
            }
        } else {
            // Regular customers must use their own organization
            if (!userOrgId) {
                return { success: false, error: 'User is not assigned to an organization' }
            }
            organizationId = userOrgId
        }

        const supabase = await createClient()

        // 1. Check Usage & Limit for the target organization
        const usage = await getLeadUsage(organizationId)
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

        // Use admin client for operators/admins to bypass RLS
        const dbClient = (role === 'super_admin' || role === 'operator')
            ? createAdminClient()
            : supabase

        const { data: job, error: jobError } = await dbClient
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

        // Update job with run ID (use dbClient to ensure RLS bypass for operators)
        const { error: updateError } = await dbClient
            .from('scrape_jobs')
            .update({
                apify_run_id: runId,
                status: 'running',
                started_at: new Date().toISOString(),
            })
            .eq('id', job.id)

        if (updateError) {
            console.error('Failed to update job with run ID:', updateError)
        }

        // Log activity
        await dbClient.from('activity_logs').insert({
            organization_id: organizationId,
            action: 'lead_search_started',
            resource_type: 'scrape_job',
            resource_id: job.id,
            metadata: { filters: searchFilters, runId },
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/dashboard/lead-finder')
        revalidatePath('/operator/jobs')

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
        const { organizationId, error: authError } = await getCurrentUserContext()
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
        const { organizationId: userOrgId, role, error: authError } = await getCurrentUserContext()

        // Use admin client for operators/admins
        const supabase = (role === 'super_admin' || role === 'operator')
            ? createAdminClient()
            : await createClient()

        let query = supabase
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)

        // Regular users can only see their own org's jobs
        if (role !== 'super_admin' && role !== 'operator') {
            if (!userOrgId) {
                return { success: false, error: authError || 'Not authenticated' }
            }
            query = query.eq('organization_id', userOrgId)
        }

        const { data: job, error } = await query.single()

        if (error || !job) {
            return { success: false, error: 'Job not found' }
        }

        // If running, pending, OR completed but not imported, check/fetch latest status from Apify
        if (job.apify_run_id && (job.status === 'running' || job.status === 'pending' || (job.status === 'completed' && (job.leads_imported || 0) === 0))) {
            const status = await getLeadSearchStatus(job.apify_run_id)

            // Update if finished
            if (status.status === 'SUCCEEDED') {
                console.log(`[Lead Finder] Job ${jobId} finished on Apify. Transitioning to processing...`);

                // Immediately set to completed so polling sees the change
                await supabase
                    .from('scrape_jobs')
                    .update({ status: 'completed' })
                    .eq('id', jobId)

                await processJobResults(jobId, status.datasetId)

                // Refetch job to get updated counts
                const { data: updatedJob } = await supabase
                    .from('scrape_jobs')
                    .select('*')
                    .eq('id', jobId)
                    .single()

                if (updatedJob) {
                    return { success: true, job: updatedJob as ScrapeJob }
                }
            } else if (status.status === 'FAILED' || status.status === 'ABORTED') {
                const newStatus = status.status === 'ABORTED' ? 'failed' : 'failed'
                await supabase
                    .from('scrape_jobs')
                    .update({
                        status: newStatus,
                        completed_at: status.finishedAt,
                        error_message: status.statusMessage || `Actor run ${status.status}`,
                    })
                    .eq('id', jobId)

                job.status = newStatus
                job.completed_at = status.finishedAt
                job.error_message = status.statusMessage || `Actor run ${status.status}`
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
 * Manually retry syncing job results from Apify
 */
export async function retrySyncFromApify(jobId: string): Promise<{
    success: boolean
    message?: string
    leadsImported?: number
    error?: string
}> {
    try {
        const { role } = await getCurrentUserContext()

        // Use admin client for this operation
        const supabase = (role === 'super_admin' || role === 'operator')
            ? createAdminClient()
            : await createClient()

        // Get the job
        const { data: job, error } = await supabase
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (error || !job) {
            return { success: false, error: 'Job not found' }
        }

        if (!job.apify_run_id) {
            return { success: false, error: 'No Apify run ID found for this job' }
        }

        // Check status on Apify
        const status = await getLeadSearchStatus(job.apify_run_id)

        if (status.status !== 'SUCCEEDED') {
            return {
                success: false,
                error: `Apify job status is ${status.status}. Cannot sync incomplete jobs.`
            }
        }

        // Process the results
        const result = await processJobResults(jobId, status.datasetId)

        if (result.success) {
            return {
                success: true,
                message: `Successfully synced ${result.leadsImported || 0} leads from Apify`,
                leadsImported: result.leadsImported
            }
        } else {
            return { success: false, error: result.error || 'Failed to process results' }
        }
    } catch (error: any) {
        console.error('Retry sync error:', error)
        return { success: false, error: error.message || 'Failed to sync from Apify' }
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
        const { organizationId, error: authError } = await getCurrentUserContext()
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
 * Get all search jobs for current organization or specified organization (for operators)
 */
export async function getSearchJobs(options: {
    limit?: number
    status?: string
    organizationId?: string
} = {}): Promise<{
    success: boolean
    jobs?: ScrapeJob[]
    error?: string
}> {
    try {
        const { organizationId: userOrgId, role, error: authError } = await getCurrentUserContext()

        // Determine which organization to query
        let targetOrgId: string | null = null

        if (role === 'super_admin' || role === 'operator') {
            // Operators can specify an org or see all jobs
            targetOrgId = options.organizationId || null
        } else {
            // Regular users can only see their own org
            if (!userOrgId) {
                return { success: false, error: authError || 'Not authenticated' }
            }
            targetOrgId = userOrgId
        }

        // Use admin client for operators/admins
        const supabase = (role === 'super_admin' || role === 'operator')
            ? createAdminClient()
            : await createClient()

        let query = supabase
            .from('scrape_jobs')
            .select('*')
            .order('created_at', { ascending: false })

        // Filter by org if specified
        if (targetOrgId) {
            query = query.eq('organization_id', targetOrgId)
        }

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
        console.log(`[Lead Finder] Processing results for job: ${jobId}, dataset: ${datasetId}`);
        const supabaseAdmin = createAdminClient();

        // Get the job
        const { data: job, error: jobError } = await supabaseAdmin
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            return { success: false, error: 'Job not found' }
        }

        // Fetch results from API
        const { items, total } = await fetchLeadSearchResults(datasetId)
        console.log(`[Lead Finder] Fetched ${items.length} items from Apify dataset ${datasetId}`);

        // Transform to leads
        const leads = transformToLeads(items, job.organization_id, jobId)
        console.log(`[Lead Finder] Successfully extracted emails from ${leads.length} out of ${items.length} items`);

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
            console.log(`[Lead Finder] Upserting ${uniqueLeads.length} unique leads`);

            // Explicitly map only the columns that exist in the database
            // This prevents TypeScript type fields from breaking the insert
            const leadsToInsert = uniqueLeads.map(l => ({
                organization_id: l.organization_id,
                email: l.email,
                first_name: l.first_name || null,
                last_name: l.last_name || null,
                phone: l.phone || null,
                linkedin_url: l.linkedin_url || null,
                company_name: l.company_name || null,
                job_title: l.job_title || null,
                raw_scraped_data: l.raw_scraped_data || {},
                source: l.source || 'apify_leads_finder',
                scrape_job_id: l.scrape_job_id || null,
                icebreaker_status: l.icebreaker_status || 'pending',
                campaign_status: l.campaign_status || 'not_added',
                updated_at: new Date().toISOString(),
            }));

            const { data: insertedLeads, error: insertError } = await supabaseAdmin
                .from('leads')
                .upsert(leadsToInsert, {
                    onConflict: 'organization_id,email',
                    ignoreDuplicates: false
                })
                .select('id')

            if (insertError) {
                console.error('[Lead Finder] Lead insert error:', insertError)
                return { success: false, error: `Database error: ${insertError.message}` }
            } else {
                imported = insertedLeads?.length || 0
                console.log(`[Lead Finder] Successfully imported ${imported} leads`);
            }
        } else if (items.length > 0) {
            console.warn('[Lead Finder] No leads were suitable for import (missing emails?) among ' + items.length + ' items');
            // Check if items actually have data
            if (items[0]) {
                console.log('[Lead Finder] Sample item keys:', Object.keys(items[0]));
            }
        }

        // Update job
        await supabaseAdmin
            .from('scrape_jobs')
            .update({
                status: 'completed',
                leads_found: total,
                leads_imported: imported,
                completed_at: new Date().toISOString(),
            })
            .eq('id', jobId)

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
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
        const { role } = await getCurrentUserContext()

        // Use admin client for operators/admins
        const supabase = (role === 'super_admin' || role === 'operator')
            ? createAdminClient()
            : await createClient()

        const { page = 1, pageSize = 50 } = options
        const offset = (page - 1) * pageSize

        // First get the job to find the organization_id
        const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .select('organization_id')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            return { success: false, error: 'Job not found' }
        }

        // Get total count
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('scrape_job_id', jobId)

        // Get paginated leads
        const { data, error } = await supabase
            .from('leads')
            .select('*')
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

export async function getLeadUsage(targetOrgId?: string): Promise<{
    success: boolean
    usage?: number
    limit?: number
    error?: string
}> {
    try {
        let organizationId = targetOrgId

        // If no org provided, try to get from user context
        if (!organizationId) {
            const { organizationId: userOrgId, error: authError } = await getCurrentUserContext()
            if (!userOrgId) return { success: false, error: authError || 'Not authenticated' }
            organizationId = userOrgId
        }

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
        const { organizationId, error: authError } = await getCurrentUserContext()
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

/**
 * Get all leads for a specific organization (for operators/admins)
 */
export async function getLeadsForOrganization(organizationId: string): Promise<{
    success: boolean
    leads?: Lead[]
    error?: string
}> {
    try {
        const { role, error: authError } = await getCurrentUserContext()
        if (authError && authError !== 'User profile not found') {
            return { success: false, error: authError }
        }

        // Only operators and super_admins can fetch leads for other organizations
        if (role !== 'super_admin' && role !== 'operator') {
            return { success: false, error: 'Unauthorized' }
        }

        const supabase = createAdminClient()

        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(500)

        if (error) throw error

        return { success: true, leads: leads || [] }
    } catch (error: any) {
        console.error('Get leads for organization error:', error)
        return { success: false, error: error.message || 'Failed to fetch leads' }
    }
}
