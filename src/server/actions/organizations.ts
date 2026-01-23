'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Organization, OrganizationWithStats } from '@/types'


/**
 * Fetches all organizations with their core stats.
 */
export async function getOrganizations() {
    const supabase = await createClient()

    // In a real Supabase/Postgres environment, we might use a view or a complex query
    // For now, we'll fetch the orgs and then hydrate counts or use a simplified approach
    const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
            *,
            users:users(count),
            leads:leads(count),
            campaigns:campaigns(count)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching organizations:', error)
        return []
    }

    return orgs.map(org => ({
        ...org,
        _count: {
            users: org.users?.[0]?.count || 0,
            leads: org.leads?.[0]?.count || 0,
            campaigns: org.campaigns?.[0]?.count || 0
        },
        monthly_lead_limit: org.monthly_lead_limit || 1000
    })) as OrganizationWithStats[]
}

/**
 * Updates an organization's plan or settings.
 */
export async function updateOrganization(id: string, updates: Partial<Organization>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('organizations')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating organization:', error)
        throw new Error(`Failed to update organization: ${error.message}`)
    }

    revalidatePath('/admin/customers')
    revalidatePath(`/admin/customers/${id}`)
    return { success: true }
}

/**
 * Suspends or activates an organization.
 */
export async function toggleOrganizationStatus(id: string, status: 'active' | 'suspended') {
    const supabase = await createClient()

    const { error } = await supabase
        .from('organizations')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Error toggling organization status:', error)
        throw new Error(`Failed to update status: ${error.message}`)
    }

    revalidatePath('/admin/customers')
    return { success: true }
}

/**
 * Fetches full details for a single organization.
 * Works for both admin users and operators.
 */
export async function getOrganizationDetails(id: string) {
    const supabase = await createClient()

    // 1. Fetch organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select(`
            *,
            users:users(*),
            leads:leads(count),
            campaigns:campaigns(count)
        `)
        .eq('id', id)
        .single()

    if (orgError) {
        console.error('Error fetching org details:', orgError)
        return { success: false, error: 'Organization not found' }
    }

    // 2. Fetch recent activity logs
    const { data: activity } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

    return {
        success: true,
        organization: {
            ...org,
            _count: {
                leads: org.leads?.[0]?.count || 0,
                campaigns: org.campaigns?.[0]?.count || 0,
                users: org.users?.length || 0
            },
            activity: activity || []
        }
    }
}

/**
 * Fetches high-level stats for the admin dashboard.
 */
export async function getAdminDashboardStats() {
    const supabase = await createClient()

    const { count: totalOrgs } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true })

    // Fetch recent organizations
    const { data: recentOrgs } = await supabase
        .from('organizations')
        .select(`
            *,
            users:users(count),
            leads:leads(count)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        totalOrganizations: totalOrgs || 0,
        totalUsers: totalUsers || 0,
        totalLeads: totalLeads || 0,
        recentOrganizations: (recentOrgs || []).map(org => ({
            ...org,
            _count: {
                users: org.users?.[0]?.count || 0,
                leads: org.leads?.[0]?.count || 0
            }
        }))
    }
}

/**
 * Updates the icebreaker context for an organization.
 * This context is used by the AI to generate personalized icebreakers.
 */
export async function updateOrganizationIcebreakerContext(
    organizationId: string,
    context: {
        description: string
        industry_focus?: string
        services?: string
        experience?: string
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('organizations')
        .update({
            icebreaker_context: context,
            updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)

    if (error) {
        console.error('Error updating icebreaker context:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/operator/customers/${organizationId}`)
    revalidatePath(`/operator/customers/${organizationId}/icebreaker`)
    return { success: true }
}
