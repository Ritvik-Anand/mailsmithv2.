import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/server/actions/roles'
import { instantly } from '@/lib/instantly/client'

export async function GET() {
    const result = await getCurrentUserWithRole()
    if (!result.success || !result.user?.organizationId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: accountRows } = await supabase
        .from('instantly_email_accounts')
        .select('email_address')
        .eq('organization_id', result.user.organizationId)
        .eq('status', 'active')

    const accountEmails = (accountRows ?? []).map(r => r.email_address)

    // Test 1: Fetch WITHOUT email_account filter (global unibox)
    let globalEmails: any[] = []
    let globalError: string | null = null
    try {
        globalEmails = await instantly.getEmails({ limit: 100 }) as any[]
    } catch (e: any) { globalError = e.message }

    // Test 2: Per-account fetch (what the inbox currently does)
    let perAccountEmails: any[] = []
    let perAccountError: string | null = null
    try {
        perAccountEmails = await instantly.getEmailsForAccounts(accountEmails, { limit: 50 }) as any[]
    } catch (e: any) { perAccountError = e.message }

    const countByType = (emails: any[]) => ({
        total: emails.length,
        outbound_ue1: emails.filter(e => e.ue_type === 1).length,
        inbound_ue2: emails.filter(e => e.ue_type === 2).length,
        other: emails.filter(e => e.ue_type !== 1 && e.ue_type !== 2).length,
        inbound_emails: emails.filter(e => e.ue_type === 2).map(e => ({
            id: e.id,
            from: e.from_address_email,
            subject: e.subject,
            ue_type: e.ue_type,
            eaccount: e.eaccount,
            timestamp: e.timestamp_created,
        })),
    })

    return NextResponse.json({
        accounts: accountEmails,
        globalFetch: { error: globalError, ...countByType(globalEmails) },
        perAccountFetch: { error: perAccountError, ...countByType(perAccountEmails) },
    })
}
