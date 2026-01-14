'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Ensures the authenticated user has a corresponding record in the public users 
 * and organizations tables. This is called on the first dashboard load.
 */
export async function syncUserOnboarding() {
    const supabase = await createClient()

    // 1. Get Auth User
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return { success: false, error: 'Not authenticated' }
    }

    // 2. Check if user already exists in public.users
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, organization_id')
        .eq('id', user.id)
        .maybeSingle()

    if (existingUser) {
        return { success: true, result: 'already_synced', organizationId: existingUser.organization_id }
    }

    // 3. User doesn't exist, start provisioning from metadata
    const metadata = user.user_metadata

    try {
        // Create Organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: metadata.company_name || 'My Organization',
                industry: metadata.industry || 'other',
                settings: {
                    website: metadata.website || '',
                    team_size: metadata.team_size || '1-10',
                    monthly_volume: metadata.monthly_volume || '< 500',
                    primary_goal: metadata.primary_goal || 'leads'
                }
            })
            .select()
            .single()

        if (orgError) throw orgError

        // Create User Profile
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                organization_id: org.id,
                email: user.email!,
                full_name: metadata.full_name || '',
                role: 'owner',
                status: 'active'
            })

        if (profileError) throw profileError

        revalidatePath('/dashboard')
        return { success: true, result: 'provisioned', organizationId: org.id }

    } catch (error: any) {
        console.error('Provisioning failed:', error)
        return { success: false, error: error.message }
    }
}
