'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { instantly } from '@/lib/instantly/client'
import { revalidatePath } from 'next/cache'

// ============================================================================
// CAMPAIGN CRUD OPERATIONS
// ============================================================================

/**
 * Get a single campaign by ID with all related data
 */
export async function getCampaignById(campaignId: string) {
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // Use admin client for operators and super_admins to bypass RLS
    if (user) {
        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role === 'operator' || userData?.role === 'super_admin') {
            supabase = createAdminClient()
        }
    }

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(`
            *,
            organization:organizations(id, name)
        `)
        .eq('id', campaignId)
        .single()

    if (error) {
        console.error('Error fetching campaign:', error)
        return { success: false, error: error.message }
    }

    return { success: true, campaign }
}

/**
 * Update campaign basic info
 */
export async function updateCampaign(
    campaignId: string,
    updates: {
        name?: string
        description?: string
        status?: string
        daily_limit?: number
        stop_on_reply?: boolean
        open_tracking?: boolean
        link_tracking?: boolean
        send_as_text?: boolean
    }
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('campaigns')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

    if (error) {
        console.error('Error updating campaign:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/operator/campaigns')
    revalidatePath(`/operator/campaigns/${campaignId}`)
    return { success: true }
}

/**
 * Toggle campaign status (pause/resume)
 */
export async function toggleCampaignStatus(campaignId: string) {
    const supabase = await createClient()

    // Get current campaign
    const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('status, instantly_campaign_id')
        .eq('id', campaignId)
        .single()

    if (fetchError || !campaign) {
        return { success: false, error: 'Campaign not found' }
    }

    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    const instantlyStatus = newStatus === 'active' ? 1 : 0

    try {
        // Update in Instantly if linked
        if (campaign.instantly_campaign_id) {
            await instantly.updateCampaignStatus(campaign.instantly_campaign_id, instantlyStatus)
        }

        // Update locally
        const { error: updateError } = await supabase
            .from('campaigns')
            .update({
                status: newStatus,
                instantly_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', campaignId)

        if (updateError) throw updateError

        revalidatePath('/operator/campaigns')
        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true, status: newStatus }
    } catch (error: any) {
        console.error('Error toggling campaign status:', error)
        return { success: false, error: error.message }
    }
}

// ============================================================================
// CAMPAIGN SEQUENCES (Email Steps)
// ============================================================================

/**
 * Get sequences for a campaign
 */
export async function getCampaignSequences(campaignId: string) {
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // Use admin client for operators and super_admins to bypass RLS
    if (user) {
        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role === 'operator' || userData?.role === 'super_admin') {
            supabase = createAdminClient()
        }
    }

    const { data, error } = await supabase
        .from('campaign_sequences')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('step_number', { ascending: true })

    if (error) {
        console.error('Error fetching sequences:', error)
        return []
    }

    return data
}

/**
 * Create or update a sequence step
 */
export async function upsertSequenceStep(
    campaignId: string,
    step: {
        id?: string
        step_number: number
        subject: string
        body: string
        delay_days: number
        variant_label?: string
    }
) {
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // Use admin client for operators and super_admins to bypass RLS
    if (user) {
        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role === 'operator' || userData?.role === 'super_admin') {
            supabase = createAdminClient()
        }
    }

    if (step.id) {
        // Update existing
        const { data, error } = await supabase
            .from('campaign_sequences')
            .update({
                subject: step.subject,
                body: step.body,
                delay_days: step.delay_days,
                variant_label: step.variant_label,
                updated_at: new Date().toISOString()
            })
            .eq('id', step.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating sequence:', error)
            return { success: false, error: error.message }
        }

        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true, data }
    } else {
        // Create new
        const { data, error } = await supabase
            .from('campaign_sequences')
            .insert({
                campaign_id: campaignId,
                step_number: step.step_number,
                subject: step.subject,
                body: step.body,
                delay_days: step.delay_days,
                variant_label: step.variant_label || 'A'
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating sequence:', error)
            return { success: false, error: error.message }
        }

        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true, data }
    }
}

/**
 * Delete a sequence step
 */
export async function deleteSequenceStep(stepId: string, campaignId: string) {
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // Use admin client for operators and super_admins to bypass RLS
    if (user) {
        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role === 'operator' || userData?.role === 'super_admin') {
            supabase = createAdminClient()
        }
    }

    const { error } = await supabase
        .from('campaign_sequences')
        .delete()
        .eq('id', stepId)

    if (error) {
        console.error('Error deleting sequence:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/operator/campaigns/${campaignId}`)
    return { success: true }
}

// ============================================================================
// CAMPAIGN SCHEDULES
// ============================================================================

/**
 * Get schedules for a campaign
 */
export async function getCampaignSchedules(campaignId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('campaign_schedules')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching schedules:', error)
        return []
    }

    return data
}

/**
 * Create or update a schedule
 */
export async function upsertSchedule(
    campaignId: string,
    schedule: {
        id?: string
        name: string
        send_from_hour: number
        send_from_minute?: number
        send_to_hour: number
        send_to_minute?: number
        timezone: string
        monday?: boolean
        tuesday?: boolean
        wednesday?: boolean
        thursday?: boolean
        friday?: boolean
        saturday?: boolean
        sunday?: boolean
    }
) {
    const supabase = await createClient()

    const scheduleData = {
        name: schedule.name,
        send_from_hour: schedule.send_from_hour,
        send_from_minute: schedule.send_from_minute || 0,
        send_to_hour: schedule.send_to_hour,
        send_to_minute: schedule.send_to_minute || 0,
        timezone: schedule.timezone,
        monday: schedule.monday ?? true,
        tuesday: schedule.tuesday ?? true,
        wednesday: schedule.wednesday ?? true,
        thursday: schedule.thursday ?? true,
        friday: schedule.friday ?? true,
        saturday: schedule.saturday ?? false,
        sunday: schedule.sunday ?? false,
        updated_at: new Date().toISOString()
    }

    if (schedule.id) {
        const { error } = await supabase
            .from('campaign_schedules')
            .update(scheduleData)
            .eq('id', schedule.id)

        if (error) {
            console.error('Error updating schedule:', error)
            return { success: false, error: error.message }
        }
    } else {
        const { error } = await supabase
            .from('campaign_schedules')
            .insert({
                campaign_id: campaignId,
                ...scheduleData
            })

        if (error) {
            console.error('Error creating schedule:', error)
            return { success: false, error: error.message }
        }
    }

    revalidatePath(`/operator/campaigns/${campaignId}`)
    return { success: true }
}

// ============================================================================
// CAMPAIGN LEADS
// ============================================================================

/**
 * Get leads attached to a campaign
 */
export async function getCampaignLeads(campaignId: string, page: number = 1, limit: number = 50) {
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // Use admin client for operators and super_admins to bypass RLS
    if (user) {
        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role === 'operator' || userData?.role === 'super_admin') {
            supabase = createAdminClient()
        }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching campaign leads:', error)
        return { leads: [], total: 0 }
    }

    return { leads: data, total: count || 0 }
}

/**
 * Add leads to a campaign
 */
export async function addLeadsToCampaign(campaignId: string, leadIds: string[]) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('leads')
        .update({
            campaign_id: campaignId,
            campaign_status: 'queued'
        })
        .in('id', leadIds)

    if (error) {
        console.error('Error adding leads to campaign:', error)
        return { success: false, error: error.message }
    }

    // Update campaign lead count
    await supabase.rpc('increment_campaign_leads', {
        p_campaign_id: campaignId,
        p_count: leadIds.length
    })

    revalidatePath(`/operator/campaigns/${campaignId}`)
    return { success: true, count: leadIds.length }
}

// ============================================================================
// SYNC WITH INSTANTLY
// ============================================================================

/**
 * Sync campaign stats from Instantly
 */
export async function syncCampaignStats(campaignId: string) {
    const supabase = await createClient()

    try {
        // Get campaign with Instantly ID
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('instantly_campaign_id')
            .eq('id', campaignId)
            .single()

        if (fetchError || !campaign?.instantly_campaign_id) {
            return { success: false, error: 'Campaign not linked to Instantly' }
        }

        // Fetch from Instantly
        const stats = await instantly.getCampaignAnalytics(campaign.instantly_campaign_id)

        // Update local stats
        const { error: updateError } = await supabase
            .from('campaigns')
            .update({
                emails_sent: stats.sent || 0,
                emails_opened: stats.opened || 0,
                emails_replied: stats.replied || 0,
                emails_bounced: stats.bounced || 0,
                last_synced_at: new Date().toISOString()
            })
            .eq('id', campaignId)

        if (updateError) throw updateError

        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true, stats }
    } catch (error: any) {
        console.error('Error syncing campaign stats:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Push sequences to Instantly
 */
export async function pushSequencesToInstantly(campaignId: string) {
    const supabase = await createClient()

    try {
        // Get campaign with Instantly ID and sequences
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('instantly_campaign_id')
            .eq('id', campaignId)
            .single()

        if (fetchError || !campaign?.instantly_campaign_id) {
            return { success: false, error: 'Campaign not linked to Instantly' }
        }

        // Get sequences
        const sequences = await getCampaignSequences(campaignId)

        if (sequences.length === 0) {
            return { success: false, error: 'No sequences to push' }
        }

        // Push to Instantly
        await instantly.updateCampaignSequences(campaign.instantly_campaign_id, sequences)

        return { success: true }
    } catch (error: any) {
        console.error('Error pushing sequences to Instantly:', error)
        return { success: false, error: error.message }
    }
}
