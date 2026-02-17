'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { instantly, InstantlyCampaignOptions } from '@/lib/instantly/client'
import { revalidatePath } from 'next/cache'

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
export async function launchCampaign(data: {
    organizationId: string
    name: string
    subject: string
    body: string
    outreachNodeIds: string[] // Internal IDs of our instantly_email_accounts
    startImmediately?: boolean
}) {
    const supabase = await createClient()

    try {
        // 1. Get the remote Instantly account IDs for the selected nodes
        const { data: nodes, error: nodesError } = await supabase
            .from('instantly_email_accounts')
            .select('instantly_account_id, email_address')
            .in('id', data.outreachNodeIds)

        if (nodesError || !nodes || nodes.length === 0) {
            throw new Error('No valid outreach nodes selected.')
        }

        const outreachEmails = nodes.map(n => n.email_address)

        // 2. Create the campaign in Instantly
        const remoteCampaign = await instantly.createCampaign(data.name)
        const instantlyCampaignId = remoteCampaign.id

        // 3. Assign the email accounts (nodes) to the campaign in Instantly
        await instantly.addAccountsToCampaign(instantlyCampaignId, outreachEmails)

        // 4. Save the campaign in our local database
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert({
                organization_id: data.organizationId,
                name: data.name,
                subject_template: data.subject,
                body_template: data.body,
                instantly_campaign_id: instantlyCampaignId,
                status: data.startImmediately ? 'active' : 'draft',
                instantly_status: data.startImmediately ? 'active' : 'paused'
            })
            .select()
            .single()

        if (campaignError) {
            console.error('Local campaign save error:', campaignError)
            // Note: We don't throw here because it's already live in Instantly
        }

        // 5. Start the campaign if requested
        if (data.startImmediately) {
            await instantly.updateCampaignStatus(instantlyCampaignId, 1) // 1 = active
        }

        revalidatePath('/operator/campaigns')
        revalidatePath('/portal/campaigns')

        return { success: true, campaignId: campaign?.id, instantlyId: instantlyCampaignId }
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
 * Update assigned accounts for a campaign in Instantly
 */
export async function updateCampaignAccountsInInstantly(campaignId: string, emails: string[]) {
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

        // Update in Instantly
        await instantly.addAccountsToCampaign(campaign.instantly_campaign_id, emails)

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

        await instantly.updateCampaignOptions(campaign.instantly_campaign_id, options)

        revalidatePath(`/operator/campaigns/${campaignId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Error updating campaign options:', error)
        return { success: false, error: error.message }
    }
}
