import { NextRequest, NextResponse } from 'next/server'
import { getNewInboxEmails } from '@/server/actions/inbox'

/**
 * GET /api/inbox?since=<ISO timestamp>
 * Returns emails received after `since`.
 * Called every 30s by the InboxLayout client component for live updates.
 */
export async function GET(request: NextRequest) {
    const since = request.nextUrl.searchParams.get('since')

    if (!since) {
        return NextResponse.json({ success: false, error: 'Missing `since` param' }, { status: 400 })
    }

    const result = await getNewInboxEmails(since)

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        emails: result.emails ?? [],
        count: result.emails?.length ?? 0,
    })
}
