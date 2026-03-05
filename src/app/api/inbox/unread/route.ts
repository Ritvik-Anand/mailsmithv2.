import { NextResponse } from 'next/server'
import { getInboxUnreadCount } from '@/server/actions/inbox'

/**
 * GET /api/inbox/unread
 * Returns the number of unread inbound replies for the current org.
 * Used by the sidebar badge to show a red pill without opening the inbox.
 */
export async function GET() {
    const count = await getInboxUnreadCount()
    return NextResponse.json({ count })
}
