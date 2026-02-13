'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { instantly } from '@/lib/instantly/client'
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
    const supabase = await createClient()

    try {
        // 1. Get campaign details
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('instantly_campaign_id')
            .eq('id', campaignId)
            .single()

        if (campaignError || !campaign?.instantly_campaign_id) {
            throw new Error('Campaign not found or not linked to Instantly')
        }

        // 2. Get lead details
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .in('id', leadIds)

        if (leadsError || !leads || leads.length === 0) {
            throw new Error('No leads found to add')
        }

        // 3. Format leads for Instantly
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

        // 4. Call Instantly API
        await instantly.addLeadsToCampaign(campaign.instantly_campaign_id, formattedLeads)

        // 5. Update lead status in our DB
        await supabase
            .from('leads')
            .update({
                campaign_id: campaignId,
                campaign_status: 'queued'
            })
            .in('id', leadIds)

        revalidatePath('/operator/leads')
        return { success: true, count: leads.length }
    } catch (error: any) {
        console.error('Error adding leads to campaign:', error)
        return { success: false, error: error.message }
    }
}
