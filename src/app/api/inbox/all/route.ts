import { NextResponse } from 'next/server'
import { getInboxEmails } from '@/server/actions/inbox'

/**
 * GET /api/inbox/all
 * Returns the full current inbox for the org.
 * Used by poll() and refresh() in InboxLayout — always returns the complete
 * list so the client-side state never drifts from reality.
 */
export async function GET() {
    const result = await getInboxEmails()

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        emails: result.emails ?? [],
        count: result.emails?.length ?? 0,
    })
}
