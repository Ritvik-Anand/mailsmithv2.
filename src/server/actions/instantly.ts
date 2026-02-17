'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { instantly, InstantlyCampaignOptions } from '@/lib/instantly/client'
import { revalidatePath } from 'next/cache'
import { getCampaignById, getCampaignSchedules, getCampaignSequences, updateCampaign } from '@/server/actions/campaigns'

/**
 * Fetches all email accounts from the master Instantly account 
 * and syncs them to our internal database.
 */
export async function syncOutreachNodes() {
    // We use the ADMIN client here because newly synced nodes from Instantly
    // don't have an owner organization yet, so normal RLS would block the insert.
    const supabase = createAdminClient()

    try {
        const remoteAccounts = await instantly.getAccounts()
        const remoteCount = remoteAccounts?.length || 0
        console.log(`DEBUG: Found ${remoteCount} accounts in remote Instantly response`)

        let firstError: string | null = null
        let successCount = 0

        // Sync with database
        for (const account of (remoteAccounts || [])) {
            // V2 status can be numeric (1 = active) or string 'active'
            const isActive = String(account.status) === '1' || String(account.status).toLowerCase() === 'active';
            const isWarmupEnabled = String(account.warmup_status) === '1' || String(account.warmup_status).toLowerCase() === 'enabled';

            const { error: dbError } = await supabase
                .from('instantly_email_accounts')
                .upsert({
                    instantly_account_id: account.email, // In V2, email is the identifier
                    email_address: account.email,
                    first_name: account.first_name || null,
                    last_name: account.last_name || null,
                    status: isActive ? 'active' : 'paused',
                    warmup_enabled: isWarmupEnabled,
                    reputation_score: account.reputation || 100,
                    daily_limit: account.daily_limit || 50,
                    last_synced_at: new Date().toISOString()
                }, {
                    onConflict: 'instantly_account_id'
                })

            if (dbError) {
                console.error(`DB Error syncing node ${account.email}:`, dbError.message)
                if (!firstError) firstError = dbError.message
            } else {
                successCount++
            }
        }

        console.log(`DEBUG: Successfully synced ${successCount} nodes to database`)
        revalidatePath('/admin-console/infrastructure')
        return {
            success: true,
            count: successCount,
            remoteCount,
            error: firstError
        }
    } catch (error: any) {
        console.error('Error in syncOutreachNodes:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Assigns an outreach node to a specific organization.
 */
export async function assignNodeToOrganization(nodeId: string, organizationId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('instantly_email_accounts')
        .update({ organization_id: organizationId === 'unassigned' ? null : organizationId })
        .eq('id', nodeId)

    if (error) {
        console.error('Error assigning node:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin-console/infrastructure')
    return { success: true }
}

/**
 * Fetches outreach nodes for a specific organization.
 */
export async function getOrganizationNodes(organizationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('instantly_email_accounts')
        .select('*')
        .eq('organization_id', organizationId)

    if (error) {
        console.error('Error fetching org nodes:', error)
        return []
    }

    return data
}

/**
 * End-to-end action to launch a campaign in Instantly.
 */
/**
 * Enhanced action to create/launch a campaign.
 * 1. Creates campaign locally in DB.
 * 2. Saves sequences, schedule, and options locally.
 * 3. If startImmediately is true, syncs to Instantly and activates.
 */
export async function launchCampaign(data: {
    organizationId: string
    name: string
    sequences: any[]
    schedule: any
    options: any
    outreachNodeIds: string[]
    startImmediately?: boolean
}) {
    const supabase = await createClient()

    try {
        // 1. Create Campaign in Local DB
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert({
                organization_id: data.organizationId,
                name: data.name,
                // Legacy fields for backward compatibility or simple view
                subject_template: data.sequences[0]?.subject,
                body_template: data.sequences[0]?.body,
                status: 'draft', // Always start as draft locally
                instantly_status: 'paused',
                // Map options to columns
                daily_limit: data.options.dailyLimit,
                stop_on_reply: data.options.stopOnReply,
                open_tracking: data.options.openTracking,
                link_tracking: data.options.linkTracking,
                send_as_text: data.options.sendAsText
            })
            .select()
            .single()

        if (campaignError || !campaign) {
            throw new Error('Failed to create local campaign: ' + campaignError?.message)
        }

        const campaignId = campaign.id

        // 2. Save Sequences Locally
        if (data.sequences && data.sequences.length > 0) {
            const sequenceInserts = data.sequences.map((seq: any, index: number) => ({
                campaign_id: campaignId,
                step_number: index + 1,
                subject: seq.subject,
                body: seq.body,
                delay_days: seq.delayDays,
                order_index: index
            }))

            const { error: seqError } = await supabase
                .from('campaign_sequences')
                .insert(sequenceInserts)

            if (seqError) console.error('Error saving sequences:', seqError)
        }

        // 3. Save Schedule Locally
        if (data.schedule) {
            const { error: schedError } = await supabase
                .from('campaign_schedules')
                .insert({
                    campaign_id: campaignId,
                    name: 'Default Schedule',
                    send_from_hour: data.schedule.sendFromHour,
                    send_to_hour: data.schedule.sendToHour,
                    timezone: data.schedule.timezone,
                    monday: data.schedule.days.monday,
                    tuesday: data.schedule.days.tuesday,
                    wednesday: data.schedule.days.wednesday,
                    thursday: data.schedule.days.thursday,
                    friday: data.schedule.days.friday,
                    saturday: data.schedule.days.saturday,
                    sunday: data.schedule.days.sunday
                })

            if (schedError) console.error('Error saving schedule:', schedError)
        }

        // 4. If Launching or just want to sync (Instantly creation happens on first sync)
        // If startImmediately is FALSE, we just leave it as a local draft.
        // User said: "So once I create a campaign now, it'll be created on instantly as well?"
        // Implementing: Only create on Instantly if "Launch" is clicked OR if user explicitly interacts with Instantly features later.
        // But to assign accounts, we need it in Instantly?
        // Wait, `updateCampaignAccountsInInstantly` triggers `ensureInstantlyCampaignExists`.
        // So if we want to save the selected accounts, we should assign them now.

        // If we want to assign accounts, we MUST create in Instantly now, because we can't assign accounts to a non-existent campaign in Instantly.
        // And we don't have a local `campaign_accounts` table? We check `getCampaignAccountsFromInstantly` which calls API.
        // So: If we want to persist "Selected Accounts", we HAVE to create the campaign in Instantly.

        // HOWEVER, "Save Draft" implies just saving locally. But we lose the selected accounts info if we don't save it somewhere.
        // We *could* save selected accounts in a local table or array column, but currently our architecture relies on Instantly for account mapping.

        // COMPROMISE: If "Save Draft" is clicked, we create the campaign in Instantly but leave it PAUSED.
        // This ensures accounts are saved and everything is ready.
        // Unless user strictly wants "Offline Drafts". But "Draft" usually just means "Not Active".

        // Let's stick to the user's implicit request: enable creation.
        // But `startImmediately` controls the STATUS.

        // SO: We ALWAYS sync to instantly to persist the Accounts assignment.
        // UNLESS we want to support purely local drafts.
        // Let's support purely local drafts, but then we can't save the accounts selection easily without a schema change.
        // Given constraints, I will create it in Instantly but keep it PAUSED if startImmediately is false.

        // Actually, let's look at `updateCampaignAccountsInInstantly`. It calls `ensureInstantlyCampaignExists`.
        // So I can just call that.

        const instantlyId = await ensureInstantlyCampaignExists(campaignId)

        // Assign Accounts
        if (data.outreachNodeIds && data.outreachNodeIds.length > 0) {
            // We need email addresses, not IDs
            const { data: nodes } = await supabase
                .from('instantly_email_accounts')
                .select('email_address')
                .in('id', data.outreachNodeIds)

            if (nodes) {
                const emails = nodes.map(n => n.email_address)
                await instantly.addAccountsToCampaign(instantlyId, emails)
            }
        }

        // Sync Advanced Options (that aren't columns)
        await instantly.updateCampaignOptions(instantlyId, {
            prioritize_new_leads: data.options.prioritizeNewLeads,
            stop_on_auto_reply: true, // defaulting for now based on typical needs or add to options state
            // ... other advanced options from `data.options`
            stop_on_reply: data.options.stopOnReply,
            daily_limit: data.options.dailyLimit
        })

        // 5. Activate if requested
        if (data.startImmediately) {
            await instantly.updateCampaignStatus(instantlyId, 1) // 1 = active

            await supabase
                .from('campaigns')
                .update({ status: 'active', instantly_status: 'active' })
                .eq('id', campaignId)
        }

        revalidatePath('/operator/campaigns')
        revalidatePath('/portal/campaigns')

        return { success: true, campaignId: campaign?.id, instantlyId: instantlyId }
    } catch (error: any) {
        console.error('Error in launchCampaign:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Fetches campaigns for a specific organization.
 */
export async function getOrganizationCampaigns(organizationId: string) {
    // Check if the current user is an operator/admin
    // This is a simple check - we can improve it later with proper auth context
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // If user exists, check their role
    if (user) {
        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        // Use admin client for operators and super_admins to bypass RLS
        if (userData?.role === 'operator' || userData?.role === 'super_admin') {
            supabase = createAdminClient()
        }
    }

    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching org campaigns:', error)
        return []
    }

    return data
}

/**
 * Assigns a campaign to a specific organization.
 */
export async function assignCampaignToOrganization(campaignId: string, organizationId: string) {
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
        .from('campaigns')
        .update({ organization_id: organizationId })
        .eq('id', campaignId)

    if (error) {
        console.error('Error assigning campaign:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/operator/campaigns')
    revalidatePath(`/operator/campaigns/${campaignId}`)
    return { success: true }
}

/**
 * Deletes a campaign
 */
export async function deleteCampaign(campaignId: string) {
    // Check if the current user is an operator/admin
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // If user exists, check their role
    if (user) {
        const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        // Use admin client for operators and super_admins to bypass RLS
        if (userData?.role === 'operator' || userData?.role === 'super_admin') {
            supabase = createAdminClient()
        }
    }

    try {
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId)

        if (error) throw error

        revalidatePath('/operator/campaigns')
        revalidatePath('/portal/campaigns')

        return { success: true }
    } catch (error: any) {
        console.error('Error deleting campaign:', error)
        return { success: false, error: error.message }
    }
}


/**
 * Fetches all outreach nodes from the local database.
 * Usually called by super admins to see system-wide capacity.
 */
export async function getAllOutreachNodes() {
    const supabase = await createClient()

    // We fetch all nodes. The server-side client obeys RLS unless bypass is used,
    // but here we just want to ensure we're getting everything available to the admin.
    const { data, error } = await supabase
        .from('instantly_email_accounts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all nodes:', error)
        return []
    }

    return data
}

/**
 * Pushes MailSmith leads to an Instantly campaign
 */
export async function addLeadsToInstantlyCampaign(
    campaignId: string, // Internal ID of campaign in our DB
    leadIds: string[]
) {
    // Check user role to determine which client to use
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    let supabase = supabaseClient

    // Use admin client for operators/admins to bypass RLS
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
        // 1. Get campaign details
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('instantly_campaign_id, name')
            .eq('id', campaignId)
            .single()

        if (campaignError || !campaign) {
            throw new Error('Campaign not found')
        }

        // 2. Get lead details
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .in('id', leadIds)

        if (leadsError || !leads || leads.length === 0) {
            throw new Error('No leads found to add')
        }

        // 3. If campaign is linked to Instantly, push leads there
        if (campaign.instantly_campaign_id) {
            // Format leads for Instantly
            const formattedLeads = leads.map(lead => ({
                email: lead.email,
                first_name: lead.first_name,
                last_name: lead.last_name,
                company_name: lead.company_name,
                job_title: lead.job_title,
                linkedin_url: lead.linkedin_url,
                custom_variables: {
                    icebreaker: lead.icebreaker || '',
                    // Add any other custom variables here
                    ...(lead.enrichment_data || {})
                }
            }))

            // Call Instantly API
            await instantly.addLeadsToCampaign(campaign.instantly_campaign_id, formattedLeads)
        }

        // 4. Update lead status in our DB (whether or not it's linked to Instantly)
        await supabase
            .from('leads')
            .update({
                campaign_id: campaignId,
                campaign_status: campaign.instantly_campaign_id ? 'queued' : 'not_added'
            })
            .in('id', leadIds)

        revalidatePath('/operator/leads')
        return {
            success: true,
            count: leads.length,
            message: campaign.instantly_campaign_id
                ? `Added ${leads.length} leads to campaign`
                : `Assigned ${leads.length} leads to draft campaign. Link to Instantly to send emails.`
        }
    } catch (error: any) {
        console.error('Error adding leads to campaign:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get accounts assigned to a campaign in Instantly
 */
export async function getCampaignAccountsFromInstantly(campaignId: string) {
    const supabase = await createClient()

    try {
        // Get local campaign to find Instantly ID
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('instantly_campaign_id')
            .eq('id', campaignId)
            .single()

        if (fetchError || !campaign?.instantly_campaign_id) {
            return { success: false, error: 'Campaign not linked to Instantly' }
        }

        // Fetch from Instantly
        const remoteCampaign: any = await instantly.getCampaign(campaign.instantly_campaign_id)

        // V2 API structure needs to be checked, but typically it returns 'accounts' or 'email_list'
        // Based on client usage, we look for accounts
        const accounts = remoteCampaign.accounts || remoteCampaign.email_list || []

        // Return email addresses
        const emails = accounts.map((acc: any) => typeof acc === 'string' ? acc : acc.email)

        return { success: true, emails }
    } catch (error: any) {
        console.error('Error fetching campaign accounts:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Helper to ensure a campaign exists in Instantly.
 * If not, it creates it and syncs initial data.
 */
async function ensureInstantlyCampaignExists(campaignId: string) {
    const supabase = await createClient()

    // 1. Get local campaign
    const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (fetchError || !campaign) {
        throw new Error('Campaign not found')
    }

    // If already linked, return the ID
    if (campaign.instantly_campaign_id) {
        return campaign.instantly_campaign_id
    }

    // 2. Create in Instantly
    const remoteCampaign = await instantly.createCampaign(campaign.name)
    const instantlyId = remoteCampaign.id

    // 3. Update local DB with ID
    await supabase
        .from('campaigns')
        .update({ instantly_campaign_id: instantlyId })
        .eq('id', campaignId)

    // 4. Sync initial data (Schedules, Sequences, Basic Options)
    // Sync Options
    await instantly.updateCampaignOptions(instantlyId, {
        daily_limit: campaign.daily_limit,
        stop_on_reply: campaign.stop_on_reply,
        open_tracking: campaign.open_tracking,
        link_tracking: campaign.link_tracking,
        send_as_text: campaign.send_as_text
    })

    // Sync Schedules
    const schedules = await getCampaignSchedules(campaignId)
    if (schedules && schedules.length > 0) {
        // Instantly V2 usually takes one schedule or specific format.
        // Assuming the first one for now or merging days.
        const schedule = schedules[0]
        const days = []
        if (schedule.monday) days.push(1)
        if (schedule.tuesday) days.push(2)
        if (schedule.wednesday) days.push(3)
        if (schedule.thursday) days.push(4)
        if (schedule.friday) days.push(5)
        if (schedule.saturday) days.push(6)
        if (schedule.sunday) days.push(0)

        await instantly.updateCampaignSchedule(instantlyId, {
            from_hour: schedule.send_from_hour,
            to_hour: schedule.send_to_hour,
            timezone: schedule.timezone,
            days: days
        })
    }

    // Sync Sequences
    const sequences = await getCampaignSequences(campaignId)
    if (sequences && sequences.length > 0) {
        await instantly.updateCampaignSequences(instantlyId, sequences)
    }

    return instantlyId
}

/**
 * Update assigned accounts for a campaign in Instantly
 */
export async function updateCampaignAccountsInInstantly(campaignId: string, emails: string[]) {
    try {
        const instantlyId = await ensureInstantlyCampaignExists(campaignId)

        // Update in Instantly
        await instantly.addAccountsToCampaign(instantlyId, emails)

        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Error updating campaign accounts:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get advanced options for a campaign from Instantly
 */
export async function getCampaignAdvancedOptionsFromInstantly(campaignId: string) {
    const supabase = await createClient()

    try {
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('instantly_campaign_id')
            .eq('id', campaignId)
            .single()

        if (fetchError || !campaign?.instantly_campaign_id) {
            return { success: false, error: 'Campaign not linked to Instantly' }
        }

        const remoteCampaign: any = await instantly.getCampaign(campaign.instantly_campaign_id)

        // Extract options based on our interface
        const options: InstantlyCampaignOptions = {
            daily_limit: remoteCampaign.daily_limit,
            stop_on_reply: remoteCampaign.stop_on_reply,
            stop_on_auto_reply: remoteCampaign.stop_on_auto_reply,
            open_tracking: remoteCampaign.open_tracking,
            link_tracking: remoteCampaign.link_tracking,
            delivery_optimization: remoteCampaign.delivery_optimization,
            prioritize_new_leads: remoteCampaign.prioritize_new_leads,
            first_email_text_only: remoteCampaign.first_email_text_only,
            show_unsubscribe: remoteCampaign.show_unsubscribe || remoteCampaign.insert_unsubscribe_header,
            minimum_wait_time: remoteCampaign.email_gap || remoteCampaign.minimum_wait_time,
            random_variance: remoteCampaign.random_wait_max || remoteCampaign.random_variance,
            cc_email_list: remoteCampaign.cc_email_list || remoteCampaign.cc_list,
            bcc_email_list: remoteCampaign.bcc_email_list || remoteCampaign.bcc_list
        }

        return { success: true, options }
    } catch (error: any) {
        console.error('Error fetching campaign options:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update advanced options for a campaign in Instantly
 */
export async function updateCampaignAdvancedOptionsInInstantly(campaignId: string, options: InstantlyCampaignOptions) {
    try {
        const instantlyId = await ensureInstantlyCampaignExists(campaignId)

        await instantly.updateCampaignOptions(instantlyId, options)

        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Error updating campaign options:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Toggle campaign status (Active/Paused)
 */
export async function toggleCampaignStatus(campaignId: string, status: 'active' | 'paused') {
    const supabase = await createClient()

    try {
        const instantlyId = await ensureInstantlyCampaignExists(campaignId)

        // Update Instantly (1=active, 0=paused for V2 usually, or use string?)
        // The client method updateCampaignStatus uses 0 | 1
        await instantly.updateCampaignStatus(instantlyId, status === 'active' ? 1 : 0)

        // Update local DB
        await supabase
            .from('campaigns')
            .update({
                status: status,
                instantly_status: status // keep consistent
            })
            .eq('id', campaignId)

        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Error toggling campaign status:', error)
        return { success: false, error: error.message }
    }
}
