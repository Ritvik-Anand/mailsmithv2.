'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithRole } from './roles'
import Anthropic from '@anthropic-ai/sdk'

// =============================================================================
// AI ASSISTANT FOR CUSTOMER PORTAL
// =============================================================================

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

// Get customer's organization ID
async function getCustomerOrgId(): Promise<string | null> {
    const result = await getCurrentUserWithRole()

    if (!result.success || !result.user) {
        return null
    }

    return result.user.organizationId || null
}

// Fetch customer's data context for the AI
async function getCustomerContext(orgId: string): Promise<string> {
    const supabase = await createClient()

    // Get organization info
    const { data: org } = await supabase
        .from('organizations')
        .select('name, created_at')
        .eq('id', orgId)
        .single()

    // Get lead stats
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

    const { count: leadsWithIcebreaker } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('icebreaker_status', 'completed')

    const { count: leadsInCampaign } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .not('campaign_id', 'is', null)

    // Get campaign stats
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, status, total_leads, emails_sent, emails_opened, emails_replied, emails_bounced, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })

    // Get lead sources
    const { data: leadSources } = await supabase
        .from('leads')
        .select('source')
        .eq('organization_id', orgId)

    const sourceCount: Record<string, number> = {}
    leadSources?.forEach(l => {
        const source = l.source || 'unknown'
        sourceCount[source] = (sourceCount[source] || 0) + 1
    })

    // Get industry breakdown
    const { data: industries } = await supabase
        .from('leads')
        .select('industry')
        .eq('organization_id', orgId)

    const industryCount: Record<string, number> = {}
    industries?.forEach(l => {
        const industry = l.industry || 'Unknown'
        industryCount[industry] = (industryCount[industry] || 0) + 1
    })

    // Calculate aggregate stats
    let totalSent = 0
    let totalOpened = 0
    let totalReplied = 0
    let totalBounced = 0

    campaigns?.forEach(c => {
        totalSent += c.emails_sent || 0
        totalOpened += c.emails_opened || 0
        totalReplied += c.emails_replied || 0
        totalBounced += c.emails_bounced || 0
    })

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0'
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0'
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0'

    // Build context string
    let context = `
CUSTOMER ACCOUNT DATA:

Organization: ${org?.name || 'Unknown'}
Account Created: ${org?.created_at ? new Date(org.created_at).toLocaleDateString() : 'Unknown'}

LEAD STATISTICS:
- Total Leads: ${totalLeads || 0}
- Leads with AI Icebreaker: ${leadsWithIcebreaker || 0} (${totalLeads ? Math.round((leadsWithIcebreaker || 0) / totalLeads * 100) : 0}%)
- Leads in Campaigns: ${leadsInCampaign || 0}

LEAD SOURCES:
${Object.entries(sourceCount).map(([source, count]) => `- ${source}: ${count} leads`).join('\n') || '- No lead source data'}

INDUSTRY BREAKDOWN (Top 5):
${Object.entries(industryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([industry, count]) => `- ${industry}: ${count} leads`)
            .join('\n') || '- No industry data'}

CAMPAIGN SUMMARY:
- Total Campaigns: ${campaigns?.length || 0}
- Active Campaigns: ${campaigns?.filter(c => c.status === 'active').length || 0}

EMAIL PERFORMANCE (All Campaigns):
- Emails Sent: ${totalSent}
- Emails Opened: ${totalOpened} (${openRate}% open rate)
- Replies Received: ${totalReplied} (${replyRate}% reply rate)
- Bounces: ${totalBounced} (${bounceRate}% bounce rate)

INDIVIDUAL CAMPAIGNS:
${campaigns?.map(c => {
                const cOpenRate = c.emails_sent > 0 ? ((c.emails_opened / c.emails_sent) * 100).toFixed(1) : '0'
                const cReplyRate = c.emails_sent > 0 ? ((c.emails_replied / c.emails_sent) * 100).toFixed(1) : '0'
                return `- ${c.name} (${c.status}): ${c.total_leads} leads, ${c.emails_sent} sent, ${cOpenRate}% opens, ${cReplyRate}% replies`
            }).join('\n') || '- No campaigns yet'}
`

    return context
}

// Main AI Assistant function
export async function askAIAssistant(question: string): Promise<{
    success: boolean
    answer?: string
    error?: string
}> {
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return {
            success: true,
            answer: "I don't have access to your account data at the moment. Please make sure you're logged in with a customer account."
        }
    }

    try {
        const customerContext = await getCustomerContext(orgId)

        const systemPrompt = `You are MailSmith AI, a helpful assistant for a B2B email outreach platform.

Your role is to:
1. Answer questions about the customer's campaign performance, leads, and outreach metrics
2. Provide actionable insights and recommendations
3. Help interpret data and suggest improvements
4. Be encouraging and supportive while being honest about areas for improvement

Guidelines:
- Be concise and direct - no fluff
- Use specific numbers from the data when relevant
- If data is limited, acknowledge it and offer general best practices
- Focus on actionable advice, not just observations
- Keep responses under 200 words unless the question requires more detail
- Use bullet points for lists
- Be conversational and friendly

IMPORTANT: You have access to the customer's real account data below. Use it to provide personalized, accurate responses.

${customerContext}`

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            system: systemPrompt,
            messages: [
                { role: 'user', content: question }
            ]
        })

        const answer = response.content[0].type === 'text'
            ? response.content[0].text
            : "I couldn't generate a response. Please try again."

        return { success: true, answer }
    } catch (error: any) {
        console.error('AI Assistant error:', error)
        return {
            success: false,
            error: error.message || 'Failed to get AI response'
        }
    }
}

// Quick insights generation (for dashboard widgets)
export async function getQuickInsights(): Promise<{
    success: boolean
    insights?: string[]
    error?: string
}> {
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return { success: true, insights: [] }
    }

    try {
        const customerContext = await getCustomerContext(orgId)

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            system: `You are MailSmith AI. Based on the customer data, generate 3 brief, actionable insights.
            
Format: Return exactly 3 insights, one per line. Each should be under 15 words and actionable.
Example:
Your tech industry leads have 40% higher reply rates - focus there.
Campaign "Q1 Outreach" is underperforming - consider refreshing the subject line.
You have 200 leads without icebreakers - generate them to boost engagement.

${customerContext}`,
            messages: [
                { role: 'user', content: 'Generate 3 quick insights about my account performance.' }
            ]
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        const insights = text.split('\n').filter(line => line.trim()).slice(0, 3)

        return { success: true, insights }
    } catch (error: any) {
        console.error('Quick insights error:', error)
        return { success: false, error: error.message }
    }
}
