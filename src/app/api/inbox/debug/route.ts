import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/server/actions/roles'
import { instantly } from '@/lib/instantly/client'

/**
 * TEMPORARY DEBUG ENDPOINT — remove after diagnosing field names.
 * GET /api/inbox/debug
 * Returns the raw Instantly email objects so we can inspect actual field names.
 */
export async function GET() {
    const result = await getCurrentUserWithRole()
    if (!result.success || !result.user?.organizationId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const orgId = result.user.organizationId
    const supabase = createAdminClient()

    // Get org's accounts
    const { data: accountRows } = await supabase
        .from('instantly_email_accounts')
        .select('email_address')
        .eq('organization_id', orgId)
        .eq('status', 'active')

    const accountEmails = (accountRows ?? []).map(r => r.email_address)

    if (accountEmails.length === 0) {
        return NextResponse.json({ error: 'No accounts found', orgId })
    }

    // Fetch raw emails from ONE account only (to keep response small)
    const firstAccount = accountEmails[0]
    let rawEmails: any[] = []
    let fetchError: string | null = null

    try {
        rawEmails = await instantly.getEmails({ email_account: firstAccount, limit: 5 })
    } catch (e: any) {
        fetchError = e.message
    }

    return NextResponse.json({
        orgId,
        accounts: accountEmails,
        fetchedFrom: firstAccount,
        emailCount: rawEmails.length,
        fetchError,
        // Show the ALL fields on each email - this is what we need to see
        rawEmails,
        // Also show just the keys of the first email for quick reference
        firstEmailKeys: rawEmails[0] ? Object.keys(rawEmails[0]) : [],
    }, { status: 200 })
}
