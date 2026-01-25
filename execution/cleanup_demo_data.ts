/**
 * =============================================================================
 * DEMO DATA CLEANUP FOR MAILSMITH
 * =============================================================================
 * 
 * This script removes all demo data created by seed_demo_data.ts
 * - Removes demo organization and all related data
 * - Removes demo customer auth user
 * 
 * Run with: npm run demo:cleanup
 * 
 * IMPORTANT: Set your Supabase credentials in .env before running
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials. Check your .env file.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Must match the seed script
const DEMO_SLUG = 'xassure-demo-2026'
const DEMO_CUSTOMER_EMAIL = 'demo@xassure.co'

async function cleanupDemoData() {
    console.log('🧹 Starting Mailsmith Demo Data Cleanup...\n')

    try {
        // Find the demo organization
        const { data: org, error: fetchError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('slug', DEMO_SLUG)
            .single()

        if (fetchError || !org) {
            console.log('ℹ️  No demo organization found.')
        } else {
            console.log(`📦 Found demo organization: ${org.name} (${org.id})`)

            // Count related data before deletion
            const { count: leadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', org.id)

            const { count: campaignsCount } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', org.id)

            const { count: usersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', org.id)

            console.log(`\n📊 Data to be deleted:`)
            console.log(`   • Leads: ${leadsCount || 0}`)
            console.log(`   • Campaigns: ${campaignsCount || 0}`)
            console.log(`   • Users: ${usersCount || 0}`)
            console.log(`   • Organization: 1`)

            // Delete leads first
            console.log('\n🗑️  Deleting leads...')
            const { error: leadsError } = await supabase
                .from('leads')
                .delete()
                .eq('organization_id', org.id)

            if (leadsError) {
                console.warn(`   ⚠️ Error deleting leads: ${leadsError.message}`)
            } else {
                console.log(`   ✓ Leads deleted`)
            }

            // Delete campaigns
            console.log('🗑️  Deleting campaigns...')
            const { error: campaignsError } = await supabase
                .from('campaigns')
                .delete()
                .eq('organization_id', org.id)

            if (campaignsError) {
                console.warn(`   ⚠️ Error deleting campaigns: ${campaignsError.message}`)
            } else {
                console.log(`   ✓ Campaigns deleted`)
            }

            // Delete related data that might exist
            console.log('🗑️  Deleting related data (activity feed, reports, etc.)...')

            // Activity feed
            await supabase.from('activity_feed').delete().eq('organization_id', org.id)

            // Customer reports
            await supabase.from('customer_reports').delete().eq('organization_id', org.id)

            // AI chat sessions
            await supabase.from('ai_chat_sessions').delete().eq('organization_id', org.id)

            // Scrape jobs
            await supabase.from('scrape_jobs').delete().eq('organization_id', org.id)

            // Operator assignments
            await supabase.from('operator_assignments').delete().eq('organization_id', org.id)

            console.log(`   ✓ Related data cleaned up`)

            // Delete users linked to this organization
            console.log('🗑️  Deleting organization users...')
            const { error: usersError } = await supabase
                .from('users')
                .delete()
                .eq('organization_id', org.id)

            if (usersError) {
                console.warn(`   ⚠️ Error deleting users: ${usersError.message}`)
            } else {
                console.log(`   ✓ Users deleted`)
            }

            // Finally, delete the organization
            console.log('🗑️  Deleting organization...')
            const { error: orgError } = await supabase
                .from('organizations')
                .delete()
                .eq('id', org.id)

            if (orgError) {
                throw new Error(`Failed to delete organization: ${orgError.message}`)
            }

            console.log(`   ✓ Organization deleted`)
        }

        // Delete demo auth user
        console.log('\n🔐 Cleaning up demo auth user...')
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const demoUser = existingUsers?.users?.find(u => u.email === DEMO_CUSTOMER_EMAIL)

        if (demoUser) {
            const { error: authDeleteError } = await supabase.auth.admin.deleteUser(demoUser.id)
            if (authDeleteError) {
                console.warn(`   ⚠️ Error deleting auth user: ${authDeleteError.message}`)
            } else {
                console.log(`   ✓ Demo auth user (${DEMO_CUSTOMER_EMAIL}) deleted`)
            }
        } else {
            console.log('   ℹ️  No demo auth user found')
        }

        console.log('\n' + '='.repeat(60))
        console.log('✅ DEMO DATA CLEANUP COMPLETE!')
        console.log('='.repeat(60))
        console.log(`
All demo data has been removed.

To recreate demo data, run:
   npm run demo:seed
`)

    } catch (error) {
        console.error('\n❌ Error cleaning up demo data:', error)
        process.exit(1)
    }
}

// Run cleanup
cleanupDemoData()
