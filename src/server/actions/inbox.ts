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
// Helper: safely extract a string from whatever shape the Instantly API returns
// for the body field (string | { html, text } | { text } | unknown)
// -----------------------------------------------------------------------------
function extractBodyText(raw: any): string {
    if (!raw) return ''
    if (typeof raw === 'string') return raw
    // Object with html/text keys (Instantly Unibox format)
    if (typeof raw === 'object') {
        if (typeof raw.html === 'string' && raw.html) return raw.html
        if (typeof raw.text === 'string' && raw.text) return raw.text
        if (typeof raw.body === 'string' && raw.body) return raw.body
    }
    // Fallback: stringify whatever we got
    try { return String(raw) } catch { return '' }
}

// -----------------------------------------------------------------------------
// Helper: normalise a raw Instantly email to our InboxEmail shape
// -----------------------------------------------------------------------------
function normaliseEmail(raw: InstantlyEmail): InboxEmail {
    const id = raw.id ?? raw.uuid ?? ''
    const bodyText = extractBodyText(raw.body)
    const preview = typeof raw.body_preview === 'string'
        ? raw.body_preview
        : bodyText.replace(/<[^>]*>/g, ' ').slice(0, 200).trim()

    return {
        id,
        fromAddress: raw.from_address ?? '',
        fromName: raw.from_name ?? raw.from_address ?? 'Unknown',
        toAddresses: raw.to_address_list ?? [],
        subject: raw.subject ?? '(no subject)',
        body: bodyText,
        bodyPreview: preview,
        timestamp: raw.timestamp ?? raw.created_at ?? new Date().toISOString(),
        isReply: raw.is_reply ?? false,
        isRead: raw.is_read ?? false,
        campaignId: raw.campaign_id ?? null,
        eaccount: raw.eaccount ?? '',
        interestLabel: raw.interest_value ?? null,
        replyToId: raw.reply_to_uuid ?? null,
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

        // 2. Fetch replies from Instantly for all accounts in parallel.
        // type: 'reply' ensures we only get inbound replies from leads,
        // not the outbound campaign emails we sent.
        const rawEmails = await instantly.getEmailsForAccounts(accountEmails, {
            limit: params.limit ?? 50,
            campaign_id: params.campaignId,
            type: params.type ?? 'reply',
        })

        // Secondary guard: filter out any outbound emails the API may still return
        const emails = rawEmails
            .filter(e => e.is_reply !== false)  // keep is_reply=true or undefined (API inconsistency)
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
