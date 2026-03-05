import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/server/actions/roles'
import { instantly } from '@/lib/instantly/client'

/**
 * Tests whether Instantly cursor pagination actually works.
 * GET /api/inbox/debug
 */
export async function GET() {
    const result = await getCurrentUserWithRole()
    if (!result.success) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Fetch page 1
    const page1 = await instantly.getEmails({ limit: 10 }) as any[]

    // Wait a bit then fetch page 2 using the last ID as cursor
    await new Promise(r => setTimeout(r, 600))
    const lastId = page1[page1.length - 1]?.id
    const page2 = await instantly.getEmails({ limit: 10, starting_after: lastId }) as any[]

    const page1Ids = page1.map((e: any) => e.id)
    const page2Ids = page2.map((e: any) => e.id)
    const overlap = page1Ids.filter((id: string) => page2Ids.includes(id))

    // Count ue_type breakdown across both pages
    const allEmails = [...page1, ...page2]
    const ue1 = allEmails.filter((e: any) => e.ue_type === 1).length
    const ue2 = allEmails.filter((e: any) => e.ue_type === 2).length

    return NextResponse.json({
        pagination_works: overlap.length === 0,
        overlap_count: overlap.length,
        page1_count: page1.length,
        page2_count: page2.length,
        page1_first_id: page1[0]?.id,
        page1_last_id: lastId,
        page2_first_id: page2[0]?.id,
        cursor_used: lastId,
        ue_type_breakdown: { outbound_ue1: ue1, inbound_ue2: ue2 },
        page1_timestamps: page1.map((e: any) => e.timestamp_created),
        page2_timestamps: page2.map((e: any) => e.timestamp_created),
    })
}
