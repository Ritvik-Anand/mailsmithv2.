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

        // 2. Fetch all emails from Instantly for the org's accounts.
        // We omit the 'type' param — Instantly appears to ignore it.
        const rawEmails = await instantly.getEmailsForAccounts(accountEmails, {
            limit: params.limit ?? 100,
            campaign_id: params.campaignId,
        })

        // ── Debug: log ALL keys + first 5 emails so we can see exact field names ──
        console.log('[Inbox] Total raw emails from Instantly:', rawEmails.length)
        if (rawEmails.length > 0) {
            console.log('[Inbox] All keys on email[0]:', Object.keys(rawEmails[0] as any).join(', '))
            rawEmails.slice(0, 5).forEach((e, i) => {
                console.log(`[Inbox] email[${i}]:`, JSON.stringify(e))
            })
        }

        // ── Filter strategy: to_address_list ──────────────────────────────────
        // from_address is null in Instantly's response (confirmed by 0-result test).
        // For INBOUND replies: the lead sends TO our account → to_address_list contains our account.
        // For OUTBOUND emails: we send TO the lead → to_address_list is the lead's email, not ours.
        const ownAccounts = new Set(accountEmails.map(e => e.toLowerCase()))

        const inbound = rawEmails.filter(e => {
            const raw = e as any
            // Collect the 'to' addresses — try all plausible field names
            const toList: any[] = (
                e.to_address_list ??
                raw.to_address ??
                raw.to ??
                raw.recipients ??
                []
            )
            return toList.some((addr: any) => {
                const str = typeof addr === 'string' ? addr : (addr?.email ?? addr?.address ?? '')
                return ownAccounts.has(str.toLowerCase())
            })
        })

        console.log('[Inbox] Inbound emails after to_address filter:', inbound.length)

        // If the to_address filter returns nothing (field might be named differently),
        // fall back to showing all so the inbox is never broken while we debug.
        const emails = (inbound.length > 0 ? inbound : rawEmails).map(normaliseEmail)

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
