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
