/**
 * =============================================================================
 * PRODUCTION DATA CHECKER FOR MAILSMITH
 * =============================================================================
 * 
 * This script queries the production Supabase database and provides a
 * comprehensive overview of all real data in the system.
 * 
 * Run with: npx tsx execution/check_production_data.ts
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

async function checkProductionData() {
    console.log('🔍 MAILSMITH PRODUCTION DATA OVERVIEW')
    console.log('='.repeat(70))
    console.log(`Database: ${supabaseUrl}`)
    console.log('='.repeat(70))
    console.log('')

    try {
        // ----------------------------------------------------------------
        // 1. Organizations
        // ----------------------------------------------------------------
        console.log('📦 ORGANIZATIONS')
        console.log('-'.repeat(70))

        const { data: orgs, count: orgCount } = await supabase
            .from('organizations')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        console.log(`Total: ${orgCount || 0}`)

        if (orgs && orgs.length > 0) {
            orgs.forEach((org, idx) => {
                console.log(`\n${idx + 1}. ${org.name} (${org.slug})`)
                console.log(`   ID: ${org.id}`)
                console.log(`   Plan: ${org.plan || 'N/A'}`)
                console.log(`   Status: ${org.status || 'N/A'}`)
                console.log(`   Created: ${new Date(org.created_at).toLocaleDateString()}`)
                if (org.icebreaker_context) {
                    console.log(`   ✓ Icebreaker context configured`)
                }
            })
        } else {
            console.log('   ⚠️  No organizations found')
        }

        console.log('\n' + '='.repeat(70))

        // ----------------------------------------------------------------
        // 2. Users
        // ----------------------------------------------------------------
        console.log('👥 USERS')
        console.log('-'.repeat(70))

        const { data: users, count: userCount } = await supabase
            .from('users')
            .select('*, organizations(name)', { count: 'exact' })
            .order('created_at', { ascending: false })

        console.log(`Total: ${userCount || 0}`)

        if (users && users.length > 0) {
            users.forEach((user, idx) => {
                console.log(`\n${idx + 1}. ${user.full_name || user.email}`)
                console.log(`   Email: ${user.email}`)
                console.log(`   Role: ${user.role}`)
                console.log(`   Organization: ${(user as any).organizations?.name || 'None'}`)
                console.log(`   Status: ${user.status || 'active'}`)
            })
        } else {
            console.log('   ⚠️  No users found')
        }

        console.log('\n' + '='.repeat(70))

        // ----------------------------------------------------------------
        // 3. Leads
        // ----------------------------------------------------------------
        console.log('🎯 LEADS')
        console.log('-'.repeat(70))

        const { count: totalLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })

        const { count: withIcebreakers } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('icebreaker_status', 'completed')

        const { count: pendingIcebreakers } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('icebreaker_status', 'pending')

        console.log(`Total Leads: ${totalLeads || 0}`)
        console.log(`  ✓ With icebreakers: ${withIcebreakers || 0}`)
        console.log(`  ⏳ Pending icebreakers: ${pendingIcebreakers || 0}`)

        if (orgs && orgs.length > 0) {
            console.log('\nBreakdown by Organization:')
            for (const org of orgs) {
                const { count } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', org.id)

                if (count && count > 0) {
                    console.log(`  • ${org.name}: ${count} leads`)
                }
            }
        }

        console.log('\n' + '='.repeat(70))

        // ----------------------------------------------------------------
        // 4. Campaigns
        // ----------------------------------------------------------------
        console.log('📧 CAMPAIGNS')
        console.log('-'.repeat(70))

        const { data: campaigns, count: campaignCount } = await supabase
            .from('campaigns')
            .select('*, organizations(name)', { count: 'exact' })
            .order('created_at', { ascending: false })

        console.log(`Total: ${campaignCount || 0}`)

        if (campaigns && campaigns.length > 0) {
            campaigns.forEach((campaign, idx) => {
                console.log(`\n${idx + 1}. ${campaign.name}`)
                console.log(`   Organization: ${(campaign as any).organizations?.name || 'N/A'}`)
                console.log(`   Status: ${campaign.status}`)
                console.log(`   Leads: ${campaign.total_leads || 0}`)
                console.log(`   Sent: ${campaign.emails_sent || 0} | Opens: ${campaign.emails_opened || 0} | Replies: ${campaign.emails_replied || 0}`)
            })
        } else {
            console.log('   ⚠️  No campaigns found')
        }

        console.log('\n' + '='.repeat(70))

        // ----------------------------------------------------------------
        // 5. Scrape Jobs
        // ----------------------------------------------------------------
        console.log('🔍 SCRAPE JOBS')
        console.log('-'.repeat(70))

        const { data: jobs, count: jobCount } = await supabase
            .from('scrape_jobs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(10)

        console.log(`Total: ${jobCount || 0}`)

        if (jobs && jobs.length > 0) {
            console.log('\nRecent Jobs (last 10):')
            jobs.forEach((job, idx) => {
                console.log(`\n${idx + 1}. ${job.id.slice(0, 8)}...`)
                console.log(`   Status: ${job.status}`)
                console.log(`   Leads Found: ${job.leads_found || 0}`)
                console.log(`   Leads Imported: ${job.leads_imported || 0}`)
                console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`)
            })
        } else {
            console.log('   ⚠️  No scrape jobs found')
        }

        console.log('\n' + '='.repeat(70))

        // ----------------------------------------------------------------
        // 6. Activity Feed
        // ----------------------------------------------------------------
        console.log('📰 RECENT ACTIVITY')
        console.log('-'.repeat(70))

        const { data: activities, count: activityCount } = await supabase
            .from('activity_feed')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(5)

        console.log(`Total Activities: ${activityCount || 0}`)

        if (activities && activities.length > 0) {
            console.log('\nLatest 5 Activities:')
            activities.forEach((activity, idx) => {
                console.log(`\n${idx + 1}. [${activity.activity_type}] ${activity.title}`)
                if (activity.description) {
                    console.log(`   ${activity.description}`)
                }
                console.log(`   ${new Date(activity.created_at).toLocaleString()}`)
            })
        } else {
            console.log('   ℹ️  No recent activity')
        }

        console.log('\n' + '='.repeat(70))

        // ----------------------------------------------------------------
        // Summary
        // ----------------------------------------------------------------
        console.log('\n📊 SUMMARY')
        console.log('='.repeat(70))
        console.log(`✓ Organizations: ${orgCount || 0}`)
        console.log(`✓ Users: ${userCount || 0}`)
        console.log(`✓ Total Leads: ${totalLeads || 0}`)
        console.log(`✓ Leads with Icebreakers: ${withIcebreakers || 0}`)
        console.log(`✓ Campaigns: ${campaignCount || 0}`)
        console.log(`✓ Scrape Jobs: ${jobCount || 0}`)
        console.log(`✓ Activities: ${activityCount || 0}`)
        console.log('='.repeat(70))

        if ((orgCount || 0) === 0) {
            console.log('\n⚠️  DATABASE APPEARS EMPTY')
            console.log('')
            console.log('This could mean:')
            console.log('1. You haven\'t onboarded any customers yet')
            console.log('2. You\'re connected to a development database')
            console.log('3. The demo data cleanup removed all data')
            console.log('')
            console.log('Next steps:')
            console.log('• Verify you\'re connected to the production database')
            console.log('• Onboard a customer through the signup flow')
            console.log('• Or import existing customer data')
        } else {
            console.log('\n✅ PRODUCTION DATABASE IS POPULATED')
            console.log('Your system contains real customer data!')
        }

        console.log('')

    } catch (error) {
        console.error('\n❌ Error checking production data:', error)
        process.exit(1)
    }
}

// Run check
checkProductionData()
