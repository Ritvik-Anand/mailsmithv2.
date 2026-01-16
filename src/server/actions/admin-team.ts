'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SystemAdmin, AdminRole, AdminPermission } from '@/types'

/**
 * Fetches all system administrators from the database.
 */
export async function getAdminTeam(): Promise<SystemAdmin[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('system_admins')
        .select('*')
        .order('role', { ascending: false })

    if (error) {
        console.error('Error fetching admin team:', error)
        // Return mock data if table doesn't exist yet for demo purposes
        // but in production we want to handle this error
        return []
    }

    return data as SystemAdmin[]
}

/**
 * Creates a new system administrator.
 */
export async function createAdmin(adminData: {
    email: string
    full_name: string
    role: AdminRole
    permissions: AdminPermission[]
    access_key: string
    avatar_url?: string | null
}) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('system_admins')
        .insert([
            {
                ...adminData,
                email: adminData.email.trim().toLowerCase(),
                access_key: adminData.access_key.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ])
        .select()
        .single()

    if (error) {
        console.error('Error creating admin:', error)
        throw new Error(`Failed to onboard admin: ${error.message}`)
    }

    revalidatePath('/admin/team')
    return { success: true, data }
}

/**
 * Deletes an admin record.
 */
export async function revokeAdminAccess(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('system_admins')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error revoking admin access:', error)
        throw new Error(`Failed to revoke access: ${error.message}`)
    }

    revalidatePath('/admin/team')
    return { success: true }
}

/**
 * Validates admin credentials against the system_admins table.
 */
export async function validateAdminCredentials(email: string, accessKey: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('system_admins')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('access_key', accessKey.trim())
        .single()

    if (error || !data) {
        console.error('Admin authentication failed:', {
            error: error?.message,
            email: email.trim().toLowerCase(),
            code: error?.code
        })
        return { success: false, error: 'Invalid credentials or unauthorized access' }
    }

    return {
        success: true,
        admin: data as SystemAdmin
    }
}
