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

    try {
        // Get campaign with Instantly ID
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('instantly_campaign_id, name')
            .eq('id', campaignId)
            .single()

        if (fetchError || !campaign) {
            console.error('Campaign fetch error:', fetchError)
            return { success: false, error: 'Campaign not found in database' }
        }

        if (!campaign.instantly_campaign_id) {
            return { success: false, error: `Campaign "${campaign.name}" is not linked to Instantly yet. Launch it first.` }
        }

        // Fetch from Instantly (V2 Overview returns an array of campaign stats)
        const response = await instantly.getCampaignAnalytics(campaign.instantly_campaign_id)

        // Ensure we have an array to work with
        const statsList = Array.isArray(response) ? response : [response]

        // Find by ID match (most reliable)
        let stats = statsList.find((s: any) =>
            String(s?.campaign_id) === String(campaign.instantly_campaign_id) ||
            String(s?.id) === String(campaign.instantly_campaign_id)
        )

        // Robust Fallback: Try to find by NAME if ID doesn't match perfectly
        // (V2 IDs can sometimes differ slightly in case or format between endpoints)
        if (!stats) {
            stats = statsList.find((s: any) =>
                s?.campaign_name?.toLowerCase() === campaign.name?.toLowerCase() ||
                s?.name?.toLowerCase() === campaign.name?.toLowerCase()
            )
        }

        if (!stats) {
            const available = statsList.map(s => `[${s.id || s.campaign_id}: ${s.name || s.campaign_name}]`).join(', ')
            const errorMsg = `No analytics match for ID ${campaign.instantly_campaign_id}. Available: ${available}`

            await supabase
                .from('campaigns')
                .update({ sync_error: errorMsg } as any)
                .eq('id', campaignId)

            return { success: false, error: errorMsg }
        }

        // SMART MAPPING helper for all known V2 field variations
        const getVal = (fields: string[]) => {
            for (const f of fields) {
                if (stats[f] !== undefined && stats[f] !== null) {
                    return Number(stats[f])
                }
            }
            return 0
        }

        // Update local stats with robust V2 field mapping
        const { error: updateError } = await supabase
            .from('campaigns')
            .update({
                emails_sent: getVal(['total_sent', 'sent_count', 'sent', 'emails_sent']),
                emails_opened: getVal(['total_opened', 'open_count_unique', 'unique_opens', 'open_count', 'opened']),
                emails_replied: getVal(['total_replied', 'reply_count_unique', 'unique_replies', 'reply_count', 'replied']),
                emails_bounced: getVal(['total_bounced', 'bounced_count', 'bounced']),
                emails_clicked: getVal(['total_clicked', 'link_click_count_unique', 'unique_clicks', 'link_click_count']),
                emails_interested: getVal(['total_interested', 'total_opportunities', 'interested_count', 'interested']),
                emails_uninterested: getVal(['total_uninterested', 'uninterested_count', 'uninterested']),
                emails_unsubscribed: getVal(['total_unsubscribed', 'unsubscribed_count', 'unsubscribed']),
                last_synced_at: new Date().toISOString(),
                last_stats_sync_at: new Date().toISOString(),
                sync_error: null // Clear previous errors
            } as any)
            .eq('id', campaignId)

        if (updateError) throw updateError

        revalidatePath(`/operator/campaigns/${campaignId}`)
        revalidatePath('/operator/campaigns')
        return { success: true, stats }
    } catch (error: any) {
        console.error('Error syncing campaign stats:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Sync stats for all campaigns across all customers
 */
export async function syncAllCampaignsLiveStats() {
    const supabaseClient = await createClient()
    const supabase = createAdminClient() // Use admin for bulk update

    try {
        console.log('Starting bulk campaign stats sync using Analytics Overview...')

        // Fetch ALL analytics (Batch)
        const allStats = await instantly.getAnalyticsOverview()

        if (!allStats || !Array.isArray(allStats)) {
            throw new Error('Failed to fetch analytics from Instantly')
        }

        console.log(`Received analytics for ${allStats.length} campaigns. Syncing to database...`)

        // Batch update our DB
        let successCount = 0
        const promises = allStats.map(async (stats) => {
            const extId = stats.campaign_id || stats.id
            if (!extId) return

            // Helper for mapping
            const getVal = (fields: string[]) => {
                for (const f of fields) {
                    if (stats[f] !== undefined && stats[f] !== null) return Number(stats[f])
                }
                return 0
            }

            const { data, error } = await supabase
                .from('campaigns')
                .update({
                    emails_sent: getVal(['total_sent', 'sent_count', 'sent', 'emails_sent']),
                    emails_opened: getVal(['total_opened', 'open_count_unique', 'unique_opens', 'open_count', 'opened']),
                    emails_replied: getVal(['total_replied', 'reply_count_unique', 'unique_replies', 'reply_count', 'replied']),
                    emails_bounced: getVal(['total_bounced', 'bounced_count', 'bounced']),
                    emails_clicked: getVal(['total_clicked', 'link_click_count_unique', 'unique_clicks', 'link_click_count']),
                    emails_interested: getVal(['total_interested', 'total_opportunities', 'interested_count', 'interested']),
                    last_synced_at: new Date().toISOString(),
                    last_stats_sync_at: new Date().toISOString()
                } as any)
                .eq('instantly_campaign_id', extId)
                .select('id')

            if (!error && data && data.length > 0) {
                successCount++
            }
        })

        await Promise.all(promises)

        // Also sync status from the campaigns list (optional but good for consistency)
        try {
            const campaignList = await instantly.getSummaryStats()
            const campaigns = Array.isArray(campaignList) ? campaignList : (campaignList?.data || [])
            if (Array.isArray(campaigns)) {
                for (const c of campaigns) {
                    await supabase
                        .from('campaigns')
                        .update({ instantly_status: c.status === 1 ? 'active' : 'paused' })
                        .eq('instantly_campaign_id', c.id)
                }
            }
        } catch (statusErr) {
            console.warn('Failed to sync campaign statuses:', statusErr)
        }

        revalidatePath('/operator/campaigns')
        console.log(`Bulk sync complete. Updated ${successCount} campaigns.`)

        return {
            success: true,
            total: allStats.length,
            updated: successCount
        }
    } catch (error: any) {
        console.error('Error in syncAllCampaignsLiveStats:', error)
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

        // Filter valid sequences for Instantly (one variant per step)
        const uniqueSteps = sequences.reduce((acc: any[], current: any) => {
            const exists = acc.find(item => item.step_number === current.step_number)
            if (!exists) {
                acc.push(current)
            } else if (current.variant_label === 'A' && exists.variant_label !== 'A') {
                const index = acc.indexOf(exists)
                acc[index] = current
            }
            return acc
        }, [])

        // Push to Instantly
        await instantly.updateCampaignSequences(campaign.instantly_campaign_id, uniqueSteps)

        return { success: true }
    } catch (error: any) {
        console.error('Error pushing sequences to Instantly:', error)
        return { success: false, error: error.message }
    }
}
