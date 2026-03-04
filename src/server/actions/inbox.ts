'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/server/actions/roles'
import { instantly } from '@/lib/instantly/client'
import type { InstantlyEmail } from '@/lib/instantly/client'

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
    replyToId: string | null
}

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

// -----------------------------------------------------------------------------
// Helper: normalise a raw Instantly email to our InboxEmail shape
// Uses the CONFIRMED field names from the /api/v2/emails response.
// -----------------------------------------------------------------------------
function normaliseEmail(raw: InstantlyEmail): InboxEmail {
    const bodyText = extractBodyText(raw.body)
    // Strip HTML tags for the preview
    const cleanBody = bodyText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const preview = raw.content_preview ?? cleanBody.slice(0, 200)

    // Sender name — from_address_json is only present on inbound emails
    const fromJson = raw.from_address_json?.[0]
    const fromName = fromJson?.name || raw.from_address_email || 'Unknown'
    const fromAddress = fromJson?.address || raw.from_address_email || raw.lead || ''

    // Recipient — to_address_email_list is a plain string in Instantly's response
    const toAddress = raw.to_address_json?.[0]?.address
        ?? raw.to_address_email_list
        ?? ''

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
        interestLabel: raw.ai_interest_value != null
            ? mapInterestValue(raw.ai_interest_value)
            : null,
        replyToId: raw.thread_id ?? null,
    }
}

// Instantly stores interest as a numeric value — map to label
function mapInterestValue(val: number): string | null {
    const map: Record<number, string> = {
        0: 'Not Interested',
        1: 'Interested',
        2: 'Meeting Booked',
        3: 'Out of Office',
        4: 'Do Not Contact',
        5: 'Wrong Person',
    }
    return map[val] ?? null
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

        // 2. Fetch all emails from Instantly for the org's accounts.
        // We omit the 'type' param — Instantly appears to ignore it.
        const rawEmails = await instantly.getEmailsForAccounts(accountEmails, {
            limit: params.limit ?? 100,
            campaign_id: params.campaignId,
        })

        // ── THE definitive filter: ue_type === 2 means inbound reply ──────────
        // Confirmed from raw API data:
        //   ue_type 1 = outbound email we sent to a lead
        //   ue_type 2 = inbound reply from a lead
        const emails = rawEmails
            .filter(e => e.ue_type === 2)
            .map(normaliseEmail)

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
        const raw = await instantly.getEmail(emailId)
        return { success: true, email: normaliseEmail(raw) }
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
