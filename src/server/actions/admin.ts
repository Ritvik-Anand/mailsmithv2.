'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Checks the real status of the platform infrastructure.
 * This performs actual pings where possible and simulates others.
 */
export async function getSystemHealth() {
    const supabase = await createClient()

    // Check Supabase connection
    const startTime = Date.now()
    const { data: dbCheck, error: dbError } = await supabase.from('organizations').select('id').limit(1)
    const dbLatency = Date.now() - startTime

    return {
        database: {
            status: !dbError ? 'operational' : 'degraded',
            latency: `${dbLatency}ms`,
            error: dbError?.message || null
        },
        // Simulated for now, in a real env these would ping specific internal health endpoints
        search: {
            status: 'operational' as const,
            latency: '154ms'
        },
        scraper: {
            status: Math.random() > 0.9 ? 'degraded' : 'operational' as const,
            latency: '1.2s'
        },
        smtp: {
            status: 'operational' as const,
            latency: '89ms'
        }
    }
}

/**
 * Deploys a global announcement to all customers.
 * Inserts a notification into Supabase with no specific user/org ID.
 */
export async function deployBroadcast(title: string, message: string) {
    const supabase = await createClient()

    // Create the notification record
    // Note: We assume a 'notifications' table exists matching our Type definition
    const { data, error } = await supabase
        .from('notifications')
        .insert([
            {
                type: 'admin',
                title,
                message,
                read: false,
                metadata: {
                    broadcast: true,
                    deployed_at: new Date().toISOString(),
                    priority: 'high'
                }
            }
        ])
        .select()

    if (error) {
        console.error('Broadcast Deployment Error:', error)
        throw new Error(`Failed to deploy broadcast: ${error.message}`)
    }

    revalidatePath('/admin/notifications')
    return { success: true, data }
}
