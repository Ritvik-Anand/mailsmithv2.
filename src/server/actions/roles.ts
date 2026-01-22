'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// =============================================================================
// ROLE-BASED ACCESS CONTROL - Server Actions
// =============================================================================

export type UserRole = 'super_admin' | 'admin' | 'operator' | 'customer'

export interface UserWithRole {
    id: string
    email: string
    role: UserRole
    organizationId: string | null
    fullName: string | null
}

// -----------------------------------------------------------------------------
// Get Current User with Role
// -----------------------------------------------------------------------------
export async function getCurrentUserWithRole(): Promise<{
    success: boolean
    user?: UserWithRole
    error?: string
}> {
    const supabase = await createClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
        return { success: false, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, organization_id, full_name')
        .eq('id', authUser.id)
        .single()

    if (userError || !userData) {
        return { success: false, error: 'User not found in database' }
    }

    return {
        success: true,
        user: {
            id: userData.id,
            email: userData.email,
            role: (userData.role as UserRole) || 'customer',
            organizationId: userData.organization_id,
            fullName: userData.full_name,
        }
    }
}

// -----------------------------------------------------------------------------
// Get Redirect Path based on role
// -----------------------------------------------------------------------------
export async function getRedirectPath(role: UserRole | undefined): Promise<string> {
    if (!role) return '/login'

    switch (role) {
        case 'super_admin':
            return '/admin-console'
        case 'operator':
            return '/operator'
        case 'customer':
            return '/portal'
        default:
            return '/portal'
    }
}

// -----------------------------------------------------------------------------
// Role Check Helpers
// -----------------------------------------------------------------------------

export async function requireSuperAdmin(): Promise<UserWithRole> {
    const result = await getCurrentUserWithRole()

    if (!result.success || !result.user) {
        redirect('/admin')
    }

    if (result.user.role !== 'super_admin') {
        redirect('/unauthorized')
    }

    return result.user
}

export async function requireOperator(): Promise<UserWithRole> {
    const result = await getCurrentUserWithRole()

    if (!result.success || !result.user) {
        redirect('/admin')
    }

    if (result.user.role !== 'operator' && result.user.role !== 'super_admin') {
        const path = await getRedirectPath(result.user?.role)
        redirect(path === '/operator' || path === '/admin-console' ? '/unauthorized' : path)
    }

    return result.user
}

export async function requireCustomer(): Promise<UserWithRole> {
    const result = await getCurrentUserWithRole()

    if (!result.success || !result.user) {
        redirect('/login')
    }

    // Customers, operators, and super_admins can all access customer portal
    // (operators/admins might be impersonating or previewing)
    return result.user
}

// -----------------------------------------------------------------------------
// Operator Assignment Checks
// -----------------------------------------------------------------------------

export async function isOperatorForOrganization(organizationId: string): Promise<boolean> {
    const result = await getCurrentUserWithRole()

    if (!result.success || !result.user) {
        return false
    }

    // Super admins can access all organizations
    if (result.user.role === 'super_admin') {
        return true
    }

    // Check if operator is assigned to this organization
    if (result.user.role === 'operator') {
        const supabase = await createClient()
        const { data } = await supabase
            .from('operator_assignments')
            .select('id')
            .eq('operator_user_id', result.user.id)
            .eq('organization_id', organizationId)
            .single()

        return !!data
    }

    return false
}

export async function getOperatorAssignments(): Promise<{
    success: boolean
    organizations?: Array<{
        id: string
        name: string
        slug: string
        healthScore: number
        isPrimary: boolean
    }>
    error?: string
}> {
    const result = await getCurrentUserWithRole()

    if (!result.success || !result.user) {
        return { success: false, error: 'Not authenticated' }
    }

    if (result.user.role !== 'operator' && result.user.role !== 'super_admin') {
        return { success: false, error: 'Not an operator' }
    }

    const supabase = await createClient()

    // Super admins see all organizations
    if (result.user.role === 'super_admin') {
        const { data, error } = await supabase
            .from('organizations')
            .select('id, name, slug, health_score')
            .order('name')

        if (error) {
            return { success: false, error: error.message }
        }

        return {
            success: true,
            organizations: data.map(org => ({
                id: org.id,
                name: org.name,
                slug: org.slug,
                healthScore: org.health_score || 100,
                isPrimary: true,
            }))
        }
    }

    // Operators see only assigned organizations
    const { data, error } = await supabase
        .from('operator_assignments')
        .select(`
            is_primary,
            organizations (
                id,
                name,
                slug,
                health_score
            )
        `)
        .eq('operator_user_id', result.user.id)

    if (error) {
        return { success: false, error: error.message }
    }

    return {
        success: true,
        organizations: data.map(assignment => ({
            id: (assignment.organizations as any).id,
            name: (assignment.organizations as any).name,
            slug: (assignment.organizations as any).slug,
            healthScore: (assignment.organizations as any).health_score || 100,
            isPrimary: assignment.is_primary,
        }))
    }
}

// -----------------------------------------------------------------------------
// Update User Role (Super Admin Only)
// -----------------------------------------------------------------------------

export async function updateUserRole(
    userId: string,
    newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
    await requireSuperAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

// -----------------------------------------------------------------------------
// Assign Operator to Organization (Super Admin Only)
// -----------------------------------------------------------------------------

export async function assignOperatorToOrganization(
    operatorUserId: string,
    organizationId: string,
    isPrimary: boolean = false
): Promise<{ success: boolean; error?: string }> {
    await requireSuperAdmin()

    const supabase = await createClient()

    // Verify the user is an operator
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', operatorUserId)
        .single()

    if (!userData || userData.role !== 'operator') {
        return { success: false, error: 'User is not an operator' }
    }

    // Create assignment
    const { error } = await supabase
        .from('operator_assignments')
        .upsert({
            operator_user_id: operatorUserId,
            organization_id: organizationId,
            is_primary: isPrimary,
        }, {
            onConflict: 'operator_user_id,organization_id'
        })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

// -----------------------------------------------------------------------------
// Remove Operator Assignment (Super Admin Only)
// -----------------------------------------------------------------------------

export async function removeOperatorAssignment(
    operatorUserId: string,
    organizationId: string
): Promise<{ success: boolean; error?: string }> {
    await requireSuperAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('operator_assignments')
        .delete()
        .eq('operator_user_id', operatorUserId)
        .eq('organization_id', organizationId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

// -----------------------------------------------------------------------------
// Get All Operators (Super Admin Only)
// -----------------------------------------------------------------------------

export async function getAllOperators(): Promise<{
    success: boolean
    operators?: Array<{
        id: string
        email: string
        fullName: string | null
        assignedCustomers: number
    }>
    error?: string
}> {
    await requireSuperAdmin()

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            email,
            full_name,
            operator_assignments (id)
        `)
        .eq('role', 'operator')

    if (error) {
        return { success: false, error: error.message }
    }

    return {
        success: true,
        operators: data.map(op => ({
            id: op.id,
            email: op.email,
            fullName: op.full_name,
            assignedCustomers: (op.operator_assignments as any[])?.length || 0,
        }))
    }
}
