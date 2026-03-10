'use server'

import { createClient } from '@/lib/supabase/server'
import { Notification } from '@/types'

/**
 * Fetches notifications for the current authenticated user/org.
 * Includes global broadcasts (org_id is null).
 */
export async function getNotifications() {
    const supabase = await createClient()

    // In a real app, we'd get the current user's org_id
    // For now, we fetch global broadcasts and any notifications where organization_id is null
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or('organization_id.is.null') // This would be broadened to include user's org
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Fetch Notifications Error:', error)
        return []
    }

    return data as Notification[]
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsRead(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Mark Read Error:', error)
        throw new Error('Failed to update notification')
    }

    return { success: true }
}
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Fetches the latest high-priority broadcast for the popup.
 */
export async function getLatestBroadcast() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'admin')
        .is('organization_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        if (error.code !== 'PGRST116') { // Ignore "no rows found"
            console.error('Fetch Latest Broadcast Error:', error)
        }
        return null
    }

    // Only return if it's marked as a broadcast in metadata
    const metadata = data.metadata as any
    if (metadata?.broadcast && metadata?.priority === 'high') {
        return data as Notification
    }

    return null
}
