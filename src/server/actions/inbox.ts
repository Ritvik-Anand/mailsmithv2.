'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/server/actions/roles'
import { instantly } from '@/lib/instantly/client'
import type { InstantlyEmail, InstantlyLeadLabel } from '@/lib/instantly/client'

// =============================================================================
// INBOX SERVER ACTIONS
// =============================================================================


export interface InboxEmail {
    id: string
    fromAddress: string
    fromName: string
    toAddresses: string[]
    subject: string
    body: string
    bodyPreview: string
    timestamp: string
    isReply: boolean
    isRead: boolean
    campaignId: string | null
    eaccount: string          // which of our accounts received this
    interestLabel: string | null
    interestColor: string | null  // hex color from Instantly label definition
    replyToId: string | null
}

// Build a lookup map from Instantly label list
export type LabelMap = Map<number, { name: string; color: string | null }>

// -----------------------------------------------------------------------------
// Helper: get current user's org ID
// -----------------------------------------------------------------------------
async function getCustomerOrgId(): Promise<string | null> {
    const result = await getCurrentUserWithRole()
    if (!result.success || !result.user) return null
    return result.user.organizationId
}

// -----------------------------------------------------------------------------
// Helper: safely extract string from body object
// -----------------------------------------------------------------------------
function extractBodyText(body: any): string {
    if (!body) return ''
    if (typeof body === 'string') return body
    if (typeof body === 'object') {
        if (typeof body.html === 'string' && body.html) return body.html
        if (typeof body.text === 'string' && body.text) return body.text
    }
    try { return String(body) } catch { return '' }
}

// Fallback hardcoded labels used when Instantly API returns no label definitions
const FALLBACK_LABELS: LabelMap = new Map([
    [0, { name: 'Not Interested', color: '#ef4444' }],
    [1, { name: 'Interested', color: '#22c55e' }],
    [2, { name: 'Meeting Booked', color: '#3b82f6' }],
    [3, { name: 'Out of Office', color: '#f59e0b' }],
    [4, { name: 'Do Not Contact', color: '#dc2626' }],
    [5, { name: 'Wrong Person', color: '#6b7280' }],
])

// Build a LabelMap from Instantly's /lead-labels response
function buildLabelMap(labels: InstantlyLeadLabel[]): LabelMap {
    if (!labels.length) return FALLBACK_LABELS
    const map: LabelMap = new Map()
    for (const l of labels) {
        map.set(l.id, { name: l.name, color: l.color })
    }
    return map
}

// -----------------------------------------------------------------------------
// Helper: normalise a raw Instantly email to our InboxEmail shape
// Uses the CONFIRMED field names from the /api/v2/emails response.
// labelMap comes from the live Instantly /lead-labels API (with fallback).
// -----------------------------------------------------------------------------
function normaliseEmail(raw: InstantlyEmail, labelMap: LabelMap): InboxEmail {
    const bodyText = extractBodyText(raw.body)
    const cleanBody = bodyText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const preview = raw.content_preview ?? cleanBody.slice(0, 200)

    const fromJson = raw.from_address_json?.[0]
    const fromName = fromJson?.name || raw.from_address_email || 'Unknown'
    const fromAddress = fromJson?.address || raw.from_address_email || raw.lead || ''
    const toAddress = raw.to_address_json?.[0]?.address ?? raw.to_address_email_list ?? ''

    // Resolve interest label from live map (falls back to hardcoded)
    let labelEntry = raw.ai_interest_value != null ? labelMap.get(raw.ai_interest_value) : null

    // HEURISTIC: Catch Out of Office if Instantly AI missed it (returns 0 or null)
    // We check for common OOO keywords in the body/subject
    const lowerBody = bodyText.toLowerCase()
    const lowerSub = (raw.subject || '').toLowerCase()
    const isOOO = lowerBody.includes('out of office') ||
        lowerBody.includes('automatic reply') ||
        lowerSub.includes('out of office') ||
        lowerSub.includes('automatic reply')

    if (isOOO && (raw.ai_interest_value === 0 || raw.ai_interest_value == null)) {
        // Force the OOO label from our map if possible, or use fallback
        labelEntry = labelMap.get(3) || { name: 'Out of Office', color: '#f59e0b' }
    }

    return {
        id: raw.id ?? '',
        fromAddress,
        fromName,
        toAddresses: toAddress ? [toAddress] : [],
        subject: raw.subject ?? '(no subject)',
        body: bodyText,
        bodyPreview: preview,
        timestamp: raw.timestamp_email ?? raw.timestamp_created ?? new Date().toISOString(),
        isReply: raw.ue_type === 2,
        isRead: raw.is_unread === 0,
        campaignId: raw.campaign_id ?? null,
        eaccount: raw.eaccount ?? '',
        interestLabel: labelEntry?.name ?? null,
        interestColor: labelEntry?.color ?? null,
        replyToId: raw.thread_id ?? null,
    }
}

// =============================================================================
// ACTION: Get Inbox Emails for current org
// =============================================================================
export async function getInboxEmails(params: {
    campaignId?: string
    type?: 'reply' | 'sent' | 'all'
    limit?: number
} = {}): Promise<{
    success: boolean
    emails?: InboxEmail[]
    accounts?: string[]
    totalCount?: number
    error?: string
}> {
    // Use admin client to bypass RLS when fetching org's accounts
    const supabase = createAdminClient()
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return { success: true, emails: [], accounts: [], totalCount: 0 }
    }

    try {
        // 1. Get the org's assigned email accounts
        const { data: accountRows, error: accountsError } = await supabase
            .from('instantly_email_accounts')
            .select('email_address')
            .eq('organization_id', orgId)
            .eq('status', 'active')

        if (accountsError) throw accountsError

        const accountEmails = (accountRows ?? []).map(r => r.email_address)

        if (accountEmails.length === 0) {
            return {
                success: true,
                emails: [],
                accounts: [],
                totalCount: 0,
            }
        }

        // 2. Fetch labels + emails in parallel — no added latency.
        // Labels come from the live Instantly /lead-labels API so names/colors
        // stay in sync with whatever the workspace admin has configured.
        const [rawEmails, rawLabels] = await Promise.all([
            instantly.getAllInboundEmails(accountEmails, { campaign_id: params.campaignId }),
            instantly.getLeadLabels(),
        ])

        const labelMap = buildLabelMap(rawLabels)
        const emails = rawEmails.map(e => normaliseEmail(e, labelMap))

        return {
            success: true,
            emails,
            accounts: accountEmails,
            totalCount: emails.length,
        }
    } catch (error: any) {
        console.error('[Inbox] getInboxEmails error:', error)
        return { success: false, error: error.message }
    }
}

// =============================================================================
// ACTION: Reply to an inbox email
// =============================================================================
export async function replyToInboxEmail(params: {
    replyToId: string       // ID of the email being replied to
    fromAccount: string     // must be one of the org's assigned accounts
    subject: string
    body: string
}): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient()
    const orgId = await getCustomerOrgId()

    if (!orgId) {
        return { success: false, error: 'Not authenticated or no organisation context.' }
    }

    try {
        // ── Security check: verify fromAccount belongs to this org ──
        const { data: account, error: accountError } = await supabase
            .from('instantly_email_accounts')
            .select('id, email_address')
            .eq('organization_id', orgId)
            .eq('email_address', params.fromAccount)
            .single()

        if (accountError || !account) {
            return {
                success: false,
                error: 'The from-account is not assigned to your organisation.',
            }
        }

        // ── Send the reply via Instantly ──
        await instantly.replyToEmail({
            reply_to_uuid: params.replyToId,
            eaccount: params.fromAccount,
            subject: params.subject,
            body: params.body,
        })

        return { success: true }
    } catch (error: any) {
        console.error('[Inbox] replyToInboxEmail error:', error)
        return { success: false, error: error.message }
    }
}

// =============================================================================
// ACTION: Get a single email by ID (for focused thread view)
// =============================================================================
export async function getInboxEmail(emailId: string): Promise<{
    success: boolean
    email?: InboxEmail
    error?: string
}> {
    const orgId = await getCustomerOrgId()
    if (!orgId) return { success: false, error: 'Not authenticated.' }

    try {
        const [raw, rawLabels] = await Promise.all([
            instantly.getEmail(emailId),
            instantly.getLeadLabels(),
        ])
        const labelMap = buildLabelMap(rawLabels)
        return { success: true, email: normaliseEmail(raw, labelMap) }
    } catch (error: any) {
        console.error('[Inbox] getInboxEmail error:', error)
        return { success: false, error: error.message }
    }
}

// =============================================================================
// ACTION: Poll for new emails since a given timestamp (used by the polling route)
// =============================================================================
export async function getNewInboxEmails(since: string): Promise<{
    success: boolean
    emails?: InboxEmail[]
    error?: string
}> {
    const result = await getInboxEmails({ type: 'all', limit: 20 })
    if (!result.success) return result

    // Filter client-side to only emails newer than `since`
    const sinceMs = new Date(since).getTime()
    const newEmails = (result.emails ?? []).filter(e => {
        const t = new Date(e.timestamp).getTime()
        return t > sinceMs
    })

    return { success: true, emails: newEmails }
}

// =============================================================================
// ACTION: Mark an email as read in Instantly (clears unread dot + badge)
// =============================================================================
export async function markEmailRead(emailId: string): Promise<{ success: boolean }> {
    try {
        await instantly.markEmailRead(emailId)
        return { success: true }
    } catch {
        return { success: false }
    }
}

// =============================================================================
// ACTION: Update a lead's interest/intent status (one-click pipeline)
// =============================================================================
export async function updateLeadStatus(params: {
    leadEmail: string    // the lead's email address (from email.fromAddress)
    interestValue: number // 0=Not Interested, 1=Interested, 2=Meeting Booked, etc.
}): Promise<{ success: boolean; error?: string }> {
    const orgId = await getCustomerOrgId()
    if (!orgId) return { success: false, error: 'Not authenticated.' }

    try {
        await instantly.updateLeadInterestStatus({
            email: params.leadEmail,
            interest_value: params.interestValue,
        })
        return { success: true }
    } catch (error: any) {
        console.error('[Inbox] updateLeadStatus error:', error)
        return { success: false, error: error.message }
    }
}

// =============================================================================
// ACTION: Get unread email count (for sidebar badge)
// =============================================================================
export async function getInboxUnreadCount(): Promise<number> {
    const supabase = createAdminClient()
    const orgId = await getCustomerOrgId()
    if (!orgId) return 0

    try {
        const { data: accountRows } = await supabase
            .from('instantly_email_accounts')
            .select('email_address')
            .eq('organization_id', orgId)
            .eq('status', 'active')

        const accountEmails = (accountRows ?? []).map(r => r.email_address)
        if (!accountEmails.length) return 0

        // Fetch only first page of replies — unread count from recent replies is enough
        const rawEmails = await instantly.getEmails({ limit: 100, email_type: 'received', eaccount: accountEmails.slice(0, 20).join(',') })
        const ownAccounts = new Set(accountEmails.map(e => e.toLowerCase()))

        return rawEmails.filter(e =>
            e.ue_type === 2 &&
            e.eaccount && ownAccounts.has(e.eaccount.toLowerCase()) &&
            e.is_unread === 1
        ).length
    } catch {
        return 0
    }
}

// =============================================================================
// ACTION: Register Instantly webhook for real-time inbox (called once on setup)
// =============================================================================
export async function setupInstantlyWebhook(appBaseUrl: string): Promise<{
    success: boolean
    webhookId?: string
    error?: string
}> {
    const orgId = await getCustomerOrgId()
    if (!orgId) return { success: false, error: 'Not authenticated.' }

    try {
        const url = `${appBaseUrl}/api/webhooks/instantly`

        // Check if already registered to avoid duplicates
        const existing = await instantly.listWebhooks()
        const alreadyExists = existing.find((w: any) =>
            (w.url ?? w.endpoint) === url &&
            (w.event_type ?? w.event) === 'reply_received'
        )
        if (alreadyExists) {
            return { success: true, webhookId: alreadyExists.id }
        }

        const result = await instantly.registerWebhook({
            url,
            event_type: 'reply_received',
            name: 'MailSmith Inbox — reply_received',
        })

        return { success: true, webhookId: result?.id }
    } catch (error: any) {
        console.error('[Inbox] setupInstantlyWebhook error:', error)
        return { success: false, error: error.message }
    }
}
