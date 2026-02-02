'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateIcebreaker } from '@/lib/ai/anthropic'
import { revalidatePath } from 'next/cache'

/**
 * Generates icebreakers for a batch of leads
 */
export async function generateIcebreakersForBatch(leadIds: string[]) {
    const supabaseAdmin = createAdminClient()

    let successCount = 0
    let failureCount = 0

    for (const id of leadIds) {
        try {
            // 1. Get lead data
            const { data: lead, error: fetchError } = await supabaseAdmin
                .from('leads')
                .select('*')
                .eq('id', id)
                .single()

            if (fetchError || !lead) {
                console.error(`Failed to fetch lead ${id}:`, fetchError)
                failureCount++
                continue
            }

            // 2. Update status to generating
            await supabaseAdmin
                .from('leads')
                .update({ icebreaker_status: 'generating' })
                .eq('id', id)

            // 3. Generate icebreaker
            const icebreaker = await generateIcebreaker(lead)

            if (icebreaker) {
                // 4. Update lead with icebreaker
                const { error: updateError } = await supabaseAdmin
                    .from('leads')
                    .update({
                        icebreaker,
                        icebreaker_status: 'completed',
                        icebreaker_generated_at: new Date().toISOString()
                    })
                    .eq('id', id)

                if (updateError) throw updateError
                successCount++
            } else {
                throw new Error('No icebreaker generated')
            }

        } catch (error) {
            console.error(`Icebreaker generation failed for lead ${id}:`, error)
            await supabaseAdmin
                .from('leads')
                .update({ icebreaker_status: 'failed' })
                .eq('id', id)
            failureCount++
        }
    }

    revalidatePath('/operator/leads')
    return { success: true, successCount, failureCount }
}

/**
 * Generates a single icebreaker for a lead
 * @param leadId - ID of the lead
 * @param configOrgId - Optional organization ID to use for icebreaker config (overrides lead's org)
 */
export async function generateSingleIcebreaker(leadId: string, configOrgId?: string) {
    const supabaseAdmin = createAdminClient()

    try {
        // 1. Get lead data
        const { data: lead, error: fetchError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single()

        if (fetchError || !lead) {
            return { success: false, error: 'Lead not found' }
        }

        // 2. Update status to generating
        await supabaseAdmin
            .from('leads')
            .update({ icebreaker_status: 'generating' })
            .eq('id', leadId)

        // 3. Generate icebreaker
        // If configOrgId is provided, use it for icebreaker config lookup
        const icebreaker = configOrgId
            ? await generateIcebreaker({ ...lead, organization_id: configOrgId })
            : await generateIcebreaker(lead)

        if (icebreaker) {
            // 4. Update lead with icebreaker
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

