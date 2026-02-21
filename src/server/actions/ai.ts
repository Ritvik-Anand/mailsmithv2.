'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { generateIcebreaker } from '@/lib/ai/deepseek'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND GENERATION (new — for large jobs 500+ leads)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Queues a scrape job for background icebreaker generation via Supabase Edge Function.
 * Setting status to 'queued' triggers the database webhook → Edge Function.
 */
export async function queueIcebreakerGeneration(
    jobId: string,
    configOrgId?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient()

    try {
        // Reset any previously 'generating' leads back to 'pending' so the
        // Edge Function picks them up cleanly (handles resume after interruption)
        await supabase
            .from('leads')
            .update({ icebreaker_status: 'pending' })
            .eq('scrape_job_id', jobId)
            .eq('icebreaker_status', 'generating')

        // Get the total lead count for progress tracking
        const { count: total } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('scrape_job_id', jobId)
            .in('icebreaker_status', ['pending', 'failed'])

        // Queue the job — this triggers the database webhook → Edge Function
        const { error } = await supabase
            .from('scrape_jobs')
            .update({
                icebreaker_generation_status: 'queued',
                icebreaker_config_org_id: configOrgId ?? null,
                icebreaker_generation_progress: { total: total ?? 0, completed: 0, failed: 0 },
                icebreaker_generation_started_at: new Date().toISOString(),
                icebreaker_generation_completed_at: null
            })
            .eq('id', jobId)

        if (error) throw error

        return { success: true }
    } catch (err: any) {
        console.error('[queueIcebreakerGeneration] Error:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Gets the current background generation progress for a scrape job.
 * Called by the UI every ~10 seconds to show a live progress bar.
 */
export async function getIcebreakerGenerationStatus(jobId: string): Promise<{
    success: boolean
    status?: 'idle' | 'queued' | 'running' | 'completed' | 'failed'
    progress?: { total: number; completed: number; failed: number }
    error?: string
}> {
    const supabase = createAdminClient()

    try {
        const { data, error } = await supabase
            .from('scrape_jobs')
            .select('icebreaker_generation_status, icebreaker_generation_progress')
            .eq('id', jobId)
            .single()

        if (error || !data) {
            return { success: false, error: 'Job not found' }
        }

        // Also get live counts from leads table for accurate real-time progress
        const [completedRes, failedRes, pendingRes] = await Promise.all([
            supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('scrape_job_id', jobId)
                .eq('icebreaker_status', 'completed'),
            supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('scrape_job_id', jobId)
                .eq('icebreaker_status', 'failed'),
            supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('scrape_job_id', jobId)
                .in('icebreaker_status', ['pending', 'generating'])
        ])

        const completed = completedRes.count ?? 0
        const failed = failedRes.count ?? 0
        const remaining = pendingRes.count ?? 0
        const total = completed + failed + remaining

        return {
            success: true,
            status: data.icebreaker_generation_status,
            progress: { total, completed, failed }
        }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE LEAD GENERATION (kept for manual re-generation from lead detail view)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a single icebreaker for a lead (used in lead detail view).
 * @param leadId - ID of the lead
 * @param configOrgId - Optional org ID to use for icebreaker config
 */
export async function generateSingleIcebreaker(leadId: string, configOrgId?: string) {
    const supabaseAdmin = createAdminClient()

    try {
        const { data: lead, error: fetchError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single()

        if (fetchError || !lead) {
            return { success: false, error: 'Lead not found' }
        }

        await supabaseAdmin
            .from('leads')
            .update({ icebreaker_status: 'generating' })
            .eq('id', leadId)

        const icebreaker = configOrgId
            ? await generateIcebreaker({ ...lead, organization_id: configOrgId })
            : await generateIcebreaker(lead)

        if (icebreaker) {
            const { error: updateError } = await supabaseAdmin
                .from('leads')
                .update({
                    icebreaker,
                    icebreaker_status: 'completed',
                    icebreaker_generated_at: new Date().toISOString()
                })
                .eq('id', leadId)

            if (updateError) throw updateError
            return { success: true, icebreaker }
        } else {
            throw new Error('No icebreaker generated')
        }

    } catch (error: any) {
        console.error(`Icebreaker generation failed for lead ${leadId}:`, error)
        await supabaseAdmin
            .from('leads')
            .update({ icebreaker_status: 'failed' })
            .eq('id', leadId)
        return { success: false, error: error.message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY (kept for compatibility — not actively used in new flow)
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use queueIcebreakerGeneration for large jobs instead */
export async function generateIcebreakersForBatch(leadIds: string[]) {
    const supabaseAdmin = createAdminClient()
    let successCount = 0
    let failureCount = 0

    for (const id of leadIds) {
        try {
            const { data: lead, error: fetchError } = await supabaseAdmin
                .from('leads').select('*').eq('id', id).single()

            if (fetchError || !lead) { failureCount++; continue }

            await supabaseAdmin.from('leads')
                .update({ icebreaker_status: 'generating' }).eq('id', id)

            const icebreaker = await generateIcebreaker(lead)

            if (icebreaker) {
                await supabaseAdmin.from('leads').update({
                    icebreaker,
                    icebreaker_status: 'completed',
                    icebreaker_generated_at: new Date().toISOString()
                }).eq('id', id)
                successCount++
            } else {
                throw new Error('No icebreaker generated')
            }
        } catch (error) {
            console.error(`Icebreaker generation failed for lead ${id}:`, error)
            await supabaseAdmin.from('leads')
                .update({ icebreaker_status: 'failed' }).eq('id', id)
            failureCount++
        }
    }

    revalidatePath('/operator/leads')
    return { success: true, successCount, failureCount }
}
