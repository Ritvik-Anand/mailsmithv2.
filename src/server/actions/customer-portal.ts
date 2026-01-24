'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithRole } from './roles'

// =============================================================================
// CUSTOMER PORTAL SERVER ACTIONS
// =============================================================================

export interface PortalMetrics {
    totalLeads: number
    leadsChange: number  // % change from last period
    emailsSent: number
    emailsChange: number
    openRate: number
    openRateChange: number
    replyRate: number
    replyRateChange: number
}

export interface CampaignSummary {
    id: string
    name: string
    status: string
    progress: number
    totalLeads: number
    emailsSent: number
    openRate: number
    replyRate: number
    createdAt: string
}

export interface ActivityItem {
    id: string
    type: 'reply' | 'open' | 'lead' | 'campaign' | 'icebreaker'
    title: string
    description?: string
    time: string
    timestamp: Date
    highlight: boolean
}

// -----------------------------------------------------------------------------
// Get Customer's Organization ID
// -----------------------------------------------------------------------------
async function getCustomerOrgId(): Promise<string | null> {
    const result = await getCurrentUserWithRole()

    if (!result.success || !result.user) {
        return null
    }

    // If user has an organization_id, use it
    if (result.user.organizationId) {
        return result.user.organizationId
    }

    // For operators/admins, check if they have an active customer context in session
    // For now, return null if no org
    return null
}

// -----------------------------------------------------------------------------
// Get Portal Dashboard Metrics
// -----------------------------------------------------------------------------
export async function getPortalMetrics(): Promise<{
    success: boolean
    metrics?: PortalMetrics
    error?: string
}> {
    const supabase = await createClient()
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        // Return demo data if no org context
        return {
            success: true,
            metrics: {
                totalLeads: 0,
                leadsChange: 0,
                emailsSent: 0,
                emailsChange: 0,
                openRate: 0,
                openRateChange: 0,
                replyRate: 0,
                replyRateChange: 0
            }
        }
    }

    try {
        // Get total leads
        const { count: totalLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)

        // Get leads from last 7 days for change calculation
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { count: recentLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('created_at', sevenDaysAgo.toISOString())

        // Get campaign stats
        const { data: campaigns } = await supabase
            .from('campaigns')
            .select('emails_sent, emails_opened, emails_replied, total_leads')
            .eq('organization_id', orgId)

        // Calculate aggregate stats
        let emailsSent = 0
        let emailsOpened = 0
        let emailsReplied = 0

        campaigns?.forEach(c => {
            emailsSent += c.emails_sent || 0
            emailsOpened += c.emails_opened || 0
            emailsReplied += c.emails_replied || 0
        })

        const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100 * 10) / 10 : 0
        const replyRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100 * 10) / 10 : 0

        // Calculate changes (comparing to previous period)
        const leadsChange = totalLeads && totalLeads > 0
            ? Math.round(((recentLeads || 0) / totalLeads) * 100)
            : 0

        return {
            success: true,
            metrics: {
                totalLeads: totalLeads || 0,
                leadsChange,
                emailsSent,
                emailsChange: 0, // Would need historical data
                openRate,
                openRateChange: 0,
                replyRate,
                replyRateChange: 0
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// -----------------------------------------------------------------------------
// Get Campaign Summaries for Portal
// -----------------------------------------------------------------------------
export async function getPortalCampaigns(): Promise<{
    success: boolean
    campaigns?: CampaignSummary[]
    error?: string
}> {
    const supabase = await createClient()
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return { success: true, campaigns: [] }
    }

    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(5)

        if (error) throw error

        const campaigns: CampaignSummary[] = (data || []).map(c => {
            const emailsSent = c.emails_sent || 0
            const openRate = emailsSent > 0
                ? Math.round(((c.emails_opened || 0) / emailsSent) * 100)
                : 0
            const replyRate = emailsSent > 0
                ? Math.round(((c.emails_replied || 0) / emailsSent) * 100)
                : 0
            const progress = c.total_leads > 0
                ? Math.round((emailsSent / c.total_leads) * 100)
                : 0

            return {
                id: c.id,
                name: c.name,
                status: c.status || 'draft',
                progress,
                totalLeads: c.total_leads || 0,
                emailsSent,
                openRate,
                replyRate,
                createdAt: c.created_at
            }
        })

        return { success: true, campaigns }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// -----------------------------------------------------------------------------
// Get Recent Activity for Portal
// -----------------------------------------------------------------------------
export async function getPortalActivity(): Promise<{
    success: boolean
    activities?: ActivityItem[]
    error?: string
}> {
    const supabase = await createClient()
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return { success: true, activities: [] }
    }

    try {
        const activities: ActivityItem[] = []
        const now = new Date()

        // Get recent leads (last 24 hours)
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const { count: recentLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('created_at', yesterday.toISOString())

        if (recentLeads && recentLeads > 0) {
            activities.push({
                id: 'leads-today',
                type: 'lead',
                title: `${recentLeads} new leads added`,
                time: 'Last 24 hours',
                timestamp: yesterday,
                highlight: recentLeads > 50
            })
        }

        // Get recent icebreakers generated
        const { count: recentIcebreakers } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('icebreaker_status', 'completed')
            .gte('icebreaker_generated_at', yesterday.toISOString())

        if (recentIcebreakers && recentIcebreakers > 0) {
            activities.push({
                id: 'icebreakers-today',
                type: 'icebreaker',
                title: `${recentIcebreakers} icebreakers generated`,
                time: 'Last 24 hours',
                timestamp: yesterday,
                highlight: false
            })
        }

        // Get active campaigns
        const { data: activeCampaigns } = await supabase
            .from('campaigns')
            .select('id, name, emails_sent, emails_opened, emails_replied, updated_at')
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(3)

        activeCampaigns?.forEach(campaign => {
            if (campaign.emails_replied > 0) {
                activities.push({
                    id: `replies-${campaign.id}`,
                    type: 'reply',
                    title: `${campaign.emails_replied} replies on "${campaign.name}"`,
                    time: formatTimeAgo(new Date(campaign.updated_at)),
                    timestamp: new Date(campaign.updated_at),
                    highlight: campaign.emails_replied > 5
                })
            }

            if (campaign.emails_opened > 0) {
                activities.push({
                    id: `opens-${campaign.id}`,
                    type: 'open',
                    title: `${campaign.emails_opened} opens on "${campaign.name}"`,
                    time: formatTimeAgo(new Date(campaign.updated_at)),
                    timestamp: new Date(campaign.updated_at),
                    highlight: false
                })
            }
        })

        // Get recent scrape jobs
        const { data: recentJobs } = await supabase
            .from('scrape_jobs')
            .select('id, status, leads_found, completed_at')
            .eq('organization_id', orgId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(2)

        recentJobs?.forEach(job => {
            if (job.leads_found > 0) {
                activities.push({
                    id: `scrape-${job.id}`,
                    type: 'lead',
                    title: `Scrape completed: ${job.leads_found} leads found`,
                    time: formatTimeAgo(new Date(job.completed_at)),
                    timestamp: new Date(job.completed_at),
                    highlight: false
                })
            }
        })

        // Sort by timestamp desc and take top 6
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        return {
            success: true,
            activities: activities.slice(0, 6)
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// -----------------------------------------------------------------------------
// Get Customer's Leads Summary
// -----------------------------------------------------------------------------
export async function getPortalLeadsSummary(): Promise<{
    success: boolean
    summary?: {
        total: number
        withEmail: number
        withIcebreaker: number
        inCampaign: number
        byStatus: Record<string, number>
    }
    error?: string
}> {
    const supabase = await createClient()
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return {
            success: true,
            summary: {
                total: 0,
                withEmail: 0,
                withIcebreaker: 0,
                inCampaign: 0,
                byStatus: {}
            }
        }
    }

    try {
        // Get total leads
        const { count: total } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)

        // Get leads with icebreakers
        const { count: withIcebreaker } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('icebreaker_status', 'completed')

        // Get leads in campaigns
        const { count: inCampaign } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .not('campaign_id', 'is', null)

        // Get leads by campaign status
        const { data: statusData } = await supabase
            .from('leads')
            .select('campaign_status')
            .eq('organization_id', orgId)

        const byStatus: Record<string, number> = {}
        statusData?.forEach(lead => {
            const status = lead.campaign_status || 'not_added'
            byStatus[status] = (byStatus[status] || 0) + 1
        })

        return {
            success: true,
            summary: {
                total: total || 0,
                withEmail: total || 0, // All leads have emails
                withIcebreaker: withIcebreaker || 0,
                inCampaign: inCampaign || 0,
                byStatus
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// -----------------------------------------------------------------------------
// Get Customer's Recent Leads
// -----------------------------------------------------------------------------
export async function getPortalRecentLeads(limit: number = 10): Promise<{
    success: boolean
    leads?: Array<{
        id: string
        name: string
        email: string
        company: string
        hasIcebreaker: boolean
        status: string
        createdAt: string
    }>
    error?: string
}> {
    const supabase = await createClient()
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return { success: true, leads: [] }
    }

    try {
        const { data, error } = await supabase
            .from('leads')
            .select('id, first_name, last_name, email, company_name, icebreaker_status, campaign_status, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return {
            success: true,
            leads: (data || []).map(lead => ({
                id: lead.id,
                name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
                email: lead.email,
                company: lead.company_name || 'Unknown',
                hasIcebreaker: lead.icebreaker_status === 'completed',
                status: lead.campaign_status || 'not_added',
                createdAt: lead.created_at
            }))
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// -----------------------------------------------------------------------------
// Helper: Format time ago
// -----------------------------------------------------------------------------
function formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
}
