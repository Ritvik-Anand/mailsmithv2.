import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithRole } from '@/server/actions/roles'

/**
 * GET /api/notifications/unread
 * Returns the number of unread system/alert notifications for the current user/org.
 */
export async function GET() {
    try {
        const supabase = await createClient()
        const result = await getCurrentUserWithRole()

        if (!result.success || !result.user) {
            return NextResponse.json({ count: 0 })
        }

        const orgId = result.user.organizationId

        // Query unread notifications
        // Includes: 
        // 1. Specific to this org
        // 2. Specific to this user
        // 3. Global broadcasts (org_id and user_id are null)
        const query = supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('read', false)

        if (orgId) {
            query.or(`organization_id.eq.${orgId},organization_id.is.null`)
        } else {
            query.is('organization_id', null)
        }

        const { count, error } = await query

        if (error) {
            console.error('[Notifications] Error fetching unread count:', error)
            return NextResponse.json({ count: 0 })
        }

        return NextResponse.json({ count: count || 0 })
    } catch (error) {
        console.error('[Notifications] Unread API error:', error)
        return NextResponse.json({ count: 0 })
    }
}
