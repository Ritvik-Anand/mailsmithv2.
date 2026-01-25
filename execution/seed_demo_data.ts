/**
 * =============================================================================
 * DEMO DATA SEEDER FOR MAILSMITH (SCALED VERSION)
 * =============================================================================
 * 
 * This script creates a complete demo environment for X Assure / Tasksurance
 * - Creates demo organization with icebreaker context
 * - Generates 2000 realistic insurance agency leads (1950 with icebreakers)
 * - Creates 2 sample campaigns with sequences
 * - Creates a demo customer user for portal access
 * - Populates activity feed for realistic portal view
 * 
 * Run with: npm run demo:seed
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

// ============================================================================
// DEMO DATA CONSTANTS
// ============================================================================

const DEMO_SLUG = 'xassure-demo-2026'
const DEMO_ORG_NAME = 'X Assure'
const TOTAL_LEADS = 2000
const LEADS_WITH_ICEBREAKERS = 1950
const BATCH_SIZE = 100 // Insert in batches for performance

// Demo customer credentials
const DEMO_CUSTOMER_EMAIL = 'demo@xassure.co'
const DEMO_CUSTOMER_PASSWORD = 'XAssure2026!'
const DEMO_CUSTOMER_NAME = 'Alex Rivera'

// X Assure icebreaker context
const XASSURE_ICEBREAKER_CONTEXT = {
    description: `I'm the founder of X Assure (Tasksurance), where People and AI deliver agency solutions. We provide four powerful solutions working together to transform agency operations:

1. X Assure VA - Part-time or full-time virtual assistants specialized in insurance workflows
2. AI-powered tools for quotes, renewals, compliance, and carrier work
3. Full dashboard visibility for complete transparency
4. Training on the software agencies already use: AMS 360, EzLynx, HawkSoft, Applied Epic, NowCerts, QQ Catalyst

We handle Commercial Lines, Personal Lines, Benefits, Accounting, and Claims. Our VAs can handle 80+ workflows including agency bill payments, commission reconciliation, accounts receivable/payable, premium finance, and financial reporting.

We're 5-star rated on Trustpilot and agencies can choose human support, self-service AI, or both - their agency, their way.`,
    industry_focus: 'Independent insurance agencies and brokerages',
    services: 'Virtual assistants, AI-powered insurance tools, workflow automation, agency management support',
    experience: 'Trained on major insurance platforms with proven workflows for 80+ tasks',
    example_format: '{"icebreaker":"Hey {name}, \\n\\n love what you\'re building at {company} - growing an indie agency is no joke. Wanted to run something by you that might help with the operational load."}'
}

// ============================================================================
// LEAD GENERATION DATA
// ============================================================================

const FIRST_NAMES = [
    'Michael', 'Sarah', 'David', 'Jennifer', 'Robert', 'Amanda', 'Kevin', 'Lisa',
    'James', 'Patricia', 'Thomas', 'Rachel', 'Mark', 'Nicole', 'Christopher',
    'Emily', 'Daniel', 'Jessica', 'Matthew', 'Ashley', 'Andrew', 'Stephanie',
    'Joshua', 'Lauren', 'Ryan', 'Megan', 'Brandon', 'Elizabeth', 'Justin', 'Heather',
    'Brian', 'Michelle', 'Eric', 'Kimberly', 'Steven', 'Rebecca', 'Timothy', 'Melissa',
    'Anthony', 'Amy', 'Jonathan', 'Christina', 'Jason', 'Brittany', 'Jeffrey', 'Samantha',
    'Benjamin', 'Katherine', 'Gregory', 'Danielle', 'Nicholas', 'Angela', 'Aaron', 'Laura',
    'Scott', 'Victoria', 'Derek', 'Hannah', 'Kyle', 'Natalie', 'Patrick', 'Allison',
    'William', 'Maria', 'Richard', 'Andrea', 'Charles', 'Diana', 'Joseph', 'Catherine',
    'Alexander', 'Sandra', 'Trevor', 'Carolyn', 'Ethan', 'Monica', 'Nathan', 'Crystal'
]

const LAST_NAMES = [
    'Thornton', 'Chen', 'Morrison', 'Patel', 'Williams', 'Rodriguez', 'OBrien', 'Thompson',
    'Mitchell', 'Garcia', 'Anderson', 'Kim', 'Sullivan', 'Davis', 'Lee', 'Martinez',
    'Wilson', 'Moore', 'Taylor', 'Brown', 'Johnson', 'Jones', 'Miller', 'Smith',
    'Jackson', 'White', 'Harris', 'Martin', 'Thomas', 'Robinson', 'Clark', 'Lewis',
    'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green',
    'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Carter', 'Roberts', 'Turner',
    'Phillips', 'Evans', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Sanchez', 'Morris',
    'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera',
    'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray',
    'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett'
]

const COMPANY_PREFIXES = [
    '', 'Premier', 'Coastal', 'Summit', 'Heritage', 'Liberty', 'Guardian', 'Trusted',
    'Pacific', 'Atlantic', 'Mountain', 'Valley', 'Capital', 'National', 'Regional',
    'United', 'American', 'Continental', 'Central', 'Midwest', 'Southern', 'Northern',
    'Western', 'Eastern', 'Golden', 'Silver', 'Elite', 'Prime', 'First', 'Apex'
]

const COMPANY_SUFFIXES = [
    'Insurance Group', 'Insurance Agency', 'Insurance Associates', 'Insurance Solutions',
    'Risk Advisors', 'Coverage', 'Insurance Partners', 'Insurance Services',
    'Brokerage', 'Insurance Brokers', 'Risk Management', 'Benefits Group',
    'Insurance Consultants', 'Coverage Solutions', 'Protection Group'
]

const JOB_TITLES = [
    'Agency Owner', 'Principal Agent', 'Managing Partner', 'President', 'CEO',
    'Founder & CEO', 'Managing Director', 'Owner & Lead Agent', 'Founding Partner',
    'Agency Principal', 'Senior Partner', 'President & CEO', 'Chief Executive',
    'Owner & Managing Director', 'Lead Principal'
]

const CITIES = [
    { city: 'Austin', state: 'Texas', abbr: 'TX' },
    { city: 'San Francisco', state: 'California', abbr: 'CA' },
    { city: 'Phoenix', state: 'Arizona', abbr: 'AZ' },
    { city: 'Chicago', state: 'Illinois', abbr: 'IL' },
    { city: 'Atlanta', state: 'Georgia', abbr: 'GA' },
    { city: 'Miami', state: 'Florida', abbr: 'FL' },
    { city: 'Boston', state: 'Massachusetts', abbr: 'MA' },
    { city: 'Kansas City', state: 'Missouri', abbr: 'MO' },
    { city: 'Seattle', state: 'Washington', abbr: 'WA' },
    { city: 'Dallas', state: 'Texas', abbr: 'TX' },
    { city: 'Denver', state: 'Colorado', abbr: 'CO' },
    { city: 'Irvine', state: 'California', abbr: 'CA' },
    { city: 'Philadelphia', state: 'Pennsylvania', abbr: 'PA' },
    { city: 'Raleigh', state: 'North Carolina', abbr: 'NC' },
    { city: 'Las Vegas', state: 'Nevada', abbr: 'NV' },
    { city: 'Portland', state: 'Oregon', abbr: 'OR' },
    { city: 'Nashville', state: 'Tennessee', abbr: 'TN' },
    { city: 'Charlotte', state: 'North Carolina', abbr: 'NC' },
    { city: 'Indianapolis', state: 'Indiana', abbr: 'IN' },
    { city: 'Columbus', state: 'Ohio', abbr: 'OH' },
    { city: 'San Diego', state: 'California', abbr: 'CA' },
    { city: 'Sacramento', state: 'California', abbr: 'CA' },
    { city: 'Minneapolis', state: 'Minnesota', abbr: 'MN' },
    { city: 'Detroit', state: 'Michigan', abbr: 'MI' },
    { city: 'Tampa', state: 'Florida', abbr: 'FL' },
    { city: 'Orlando', state: 'Florida', abbr: 'FL' },
    { city: 'Jacksonville', state: 'Florida', abbr: 'FL' },
    { city: 'San Antonio', state: 'Texas', abbr: 'TX' },
    { city: 'Houston', state: 'Texas', abbr: 'TX' },
    { city: 'New York', state: 'New York', abbr: 'NY' },
    { city: 'Los Angeles', state: 'California', abbr: 'CA' },
    { city: 'Cleveland', state: 'Ohio', abbr: 'OH' },
    { city: 'Pittsburgh', state: 'Pennsylvania', abbr: 'PA' },
    { city: 'Baltimore', state: 'Maryland', abbr: 'MD' },
    { city: 'St. Louis', state: 'Missouri', abbr: 'MO' },
    { city: 'Salt Lake City', state: 'Utah', abbr: 'UT' },
    { city: 'Albuquerque', state: 'New Mexico', abbr: 'NM' },
    { city: 'Tucson', state: 'Arizona', abbr: 'AZ' },
    { city: 'Oklahoma City', state: 'Oklahoma', abbr: 'OK' },
    { city: 'Memphis', state: 'Tennessee', abbr: 'TN' }
]

const COMPANY_SIZES = ['2-10', '11-50', '51-200', '11-50', '2-10', '11-50'] // Weighted distribution

const HEADLINES = [
    'Building the future of independent insurance',
    'Helping families protect what matters most',
    'Third-generation insurance professional',
    'Scaling insurance agencies through technology',
    'Protecting businesses for over 20 years',
    'Full-service insurance solutions',
    'Making insurance make sense',
    'Tech industry insurance specialist',
    'Bilingual insurance services',
    'Employee benefits specialist',
    'Trusted coverage advisor',
    'Community-focused insurance',
    'Enterprise risk management',
    'Personal and commercial lines expert',
    'Growing agencies with smart solutions'
]

const COMPANY_DESCRIPTIONS = [
    'Full-service independent insurance agency',
    'Personal and commercial lines insurance',
    'Family-owned independent agency specializing in commercial lines',
    'Multi-state insurance brokerage with focus on commercial and employee benefits',
    'Commercial insurance specialists',
    'Trusted source for coastal property and flood insurance',
    'Personal lines specialist',
    'Commercial insurance for tech companies',
    'Personal and commercial insurance with bilingual service',
    'Full-service employee benefits and group insurance agency',
    'Independent agency specializing in personal and commercial coverage',
    'Commercial insurance and risk consulting'
]

const ICEBREAKER_TEMPLATES = [
    "Hey {firstName}, \n\n love what you're building at {companyShort} - growing an indie agency is no joke. Wanted to run something by you that might help with the operational load.",
    "Hey {firstName}, \n\n really respect the growth you've achieved at {companyShort}. Wanted to run something by you.",
    "Hey {firstName}, \n\n love the {location} focus at {companyShort} - that local expertise is huge. Wanted to run something by you.",
    "Hey {firstName}, \n\n really respect what you've built at {companyShort} - serving your community with that personal touch is huge. Wanted to run something by you.",
    "Hey {firstName}, \n\n love the niche focus at {companyShort} - that's a huge need. Wanted to run something by you.",
    "Hey {firstName}, \n\n really respect the scale you've achieved at {companyShort}. Wanted to run something by you about scaling the operational side.",
    "Hey {firstName}, \n\n love what you're doing at {companyShort} - building an agency the right way. Wanted to run something by you.",
    "Hey {firstName}, \n\n really impressed by {companyShort}'s reputation in {location}. Wanted to run something by you that might help with the day-to-day.",
    "Hey {firstName}, \n\n love the community focus at {companyShort}. Wanted to run something by you that might help with the operational load.",
    "Hey {firstName}, \n\n really respect the independent agency model you've built at {companyShort}. Wanted to chat about operational efficiency."
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randomPhone(): string {
    const area = Math.floor(Math.random() * 900) + 100
    const prefix = Math.floor(Math.random() * 900) + 100
    const suffix = Math.floor(Math.random() * 9000) + 1000
    return `(${area}) ${prefix}-${suffix}`
}

function generateCompanyName(lastName: string): string {
    const usePrefix = Math.random() > 0.5
    const prefix = usePrefix ? randomItem(COMPANY_PREFIXES) + ' ' : ''
    const suffix = randomItem(COMPANY_SUFFIXES)

    // Sometimes use last name, sometimes use prefix-based name
    if (Math.random() > 0.3) {
        return `${lastName} ${suffix}`
    } else {
        return `${prefix}${suffix}`.trim()
    }
}

function generateDomain(companyName: string): string {
    return companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 20) + '.com'
}

function shortenCompanyName(companyName: string): string {
    // Remove common suffixes for icebreakers
    return companyName
        .replace(/ Insurance Group$/, '')
        .replace(/ Insurance Agency$/, '')
        .replace(/ Insurance Associates$/, '')
        .replace(/ Insurance Solutions$/, '')
        .replace(/ Risk Advisors$/, '')
        .replace(/ Insurance Partners$/, '')
        .replace(/ Insurance Services$/, '')
        .replace(/ Insurance Brokers$/, '')
        .replace(/ Insurance$/, '')
        .replace(/ Brokerage$/, '')
        .replace(/ Group$/, '')
        .trim()
}

function generateIcebreaker(firstName: string, companyName: string, city: string): string {
    const template = randomItem(ICEBREAKER_TEMPLATES)
    const companyShort = shortenCompanyName(companyName)

    return template
        .replace('{firstName}', firstName)
        .replace('{companyShort}', companyShort)
        .replace('{location}', city)
}

function generateLead(index: number, organizationId: string, withIcebreaker: boolean) {
    const firstName = randomItem(FIRST_NAMES)
    const lastName = randomItem(LAST_NAMES)
    const location = randomItem(CITIES)
    const companyName = generateCompanyName(lastName)
    const domain = generateDomain(companyName)
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`

    // Only include columns that exist in the database leads table
    const lead: any = {
        organization_id: organizationId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: randomPhone(),
        linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`,
        company_name: companyName,
        job_title: randomItem(JOB_TITLES),
        raw_scraped_data: {
            headline: randomItem(HEADLINES),
            company_description: randomItem(COMPANY_DESCRIPTIONS),
            company_industry: 'Insurance',
            company_linkedin: `https://linkedin.com/company/${domain.replace('.com', '')}`,
            company_website: domain,
            company_domain: domain,
            company_size: randomItem(COMPANY_SIZES),
            company_founded_year: String(2000 + Math.floor(Math.random() * 24)),
            seniority_level: 'Executive',
            functional_level: 'Executive',
            city: location.city,
            state: location.state,
            location: `${location.city}, ${location.abbr}`,
            country: 'USA'
        },
        source: 'demo_seed',
        icebreaker_status: 'pending',
        campaign_status: 'not_added'
    }

    if (withIcebreaker) {
        lead.icebreaker = generateIcebreaker(firstName, companyName, location.city)
        lead.icebreaker_status = 'completed'
        lead.icebreaker_generated_at = new Date().toISOString()
    }

    return lead
}

function getTimeAgo(minutes: number): Date {
    return new Date(Date.now() - minutes * 60 * 1000)
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedDemoData() {
    console.log('🚀 Starting Mailsmith Demo Data Seeder (SCALED VERSION)...\n')
    console.log(`   Target: ${TOTAL_LEADS} leads (${LEADS_WITH_ICEBREAKERS} with icebreakers)\n`)

    try {
        // ----------------------------------------------------------------
        // Step 1: Clean up any existing demo data
        // ----------------------------------------------------------------
        console.log('🧹 Cleaning up existing demo data...')

        const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', DEMO_SLUG)
            .single()

        if (existingOrg) {
            // Clean up related data
            await supabase.from('leads').delete().eq('organization_id', existingOrg.id)
            await supabase.from('campaign_sequences').delete().match({ campaign_id: existingOrg.id })
            await supabase.from('campaigns').delete().eq('organization_id', existingOrg.id)
            await supabase.from('activity_feed').delete().eq('organization_id', existingOrg.id)
            await supabase.from('users').delete().eq('organization_id', existingOrg.id)
            await supabase.from('organizations').delete().eq('id', existingOrg.id)
            console.log('   ✓ Removed existing demo organization and related data')
        } else {
            console.log('   ✓ No existing demo data found')
        }

        // Clean up existing demo auth user if exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingDemoUser = existingUsers?.users?.find(u => u.email === DEMO_CUSTOMER_EMAIL)
        if (existingDemoUser) {
            await supabase.auth.admin.deleteUser(existingDemoUser.id)
            console.log('   ✓ Removed existing demo auth user')
        }

        // ----------------------------------------------------------------
        // Step 2: Create the demo organization
        // ----------------------------------------------------------------
        console.log('\n📦 Creating demo organization: X Assure...')

        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: DEMO_ORG_NAME,
                slug: DEMO_SLUG,
                plan: 'pro',
                status: 'active',
                features: {
                    lead_finder: true,
                    ai_icebreakers: true,
                    campaigns: true,
                    instantly_integration: true
                },
                settings: {
                    timezone: 'America/New_York',
                    currency: 'USD'
                }
            })
            .select()
            .single()

        if (orgError) {
            throw new Error(`Failed to create organization: ${orgError.message}`)
        }

        console.log(`   ✓ Created organization: ${org.name} (${org.id})`)

        // ----------------------------------------------------------------
        // Step 3: Create demo customer user
        // ----------------------------------------------------------------
        console.log('\n👤 Creating demo customer user...')

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: DEMO_CUSTOMER_EMAIL,
            password: DEMO_CUSTOMER_PASSWORD,
            email_confirm: true,
            user_metadata: {
                full_name: DEMO_CUSTOMER_NAME
            }
        })

        if (authError) {
            console.warn(`   ⚠️ Could not create auth user: ${authError.message}`)
            console.log('   (You may need to create one manually in Supabase dashboard)')
        } else {
            // Create user record linked to organization
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: DEMO_CUSTOMER_EMAIL,
                    full_name: DEMO_CUSTOMER_NAME,
                    organization_id: org.id,
                    role: 'customer',
                    status: 'active'
                })

            if (userError) {
                console.warn(`   ⚠️ Could not create user record: ${userError.message}`)
            } else {
                console.log(`   ✓ Created demo customer: ${DEMO_CUSTOMER_EMAIL}`)
                console.log(`   📧 Email: ${DEMO_CUSTOMER_EMAIL}`)
                console.log(`   🔑 Password: ${DEMO_CUSTOMER_PASSWORD}`)
            }
        }

        // ----------------------------------------------------------------
        // Step 4: Add icebreaker context
        // ----------------------------------------------------------------
        console.log('\n🧊 Setting up icebreaker context...')

        const { error: contextError } = await supabase
            .from('organizations')
            .update({ icebreaker_context: XASSURE_ICEBREAKER_CONTEXT })
            .eq('id', org.id)

        if (contextError) {
            console.warn(`   ⚠️ Could not set icebreaker context: ${contextError.message}`)
        } else {
            console.log('   ✓ Icebreaker context configured')
        }

        // ----------------------------------------------------------------
        // Step 5: Add health tracking fields
        // ----------------------------------------------------------------
        console.log('\n📊 Setting organization health metrics...')

        await supabase
            .from('organizations')
            .update({
                health_score: 95,
                last_activity_at: new Date().toISOString(),
                account_manager_notes: 'Demo account for X Assure. Ready for video recording. 2000 leads loaded.',
                primary_contact_email: 'hello@xassure.co'
            })
            .eq('id', org.id)

        console.log('   ✓ Health metrics set')

        // ----------------------------------------------------------------
        // Step 6: Generate and insert leads in batches
        // ----------------------------------------------------------------
        console.log(`\n👥 Generating ${TOTAL_LEADS} leads...`)

        let totalInserted = 0
        const batches = Math.ceil(TOTAL_LEADS / BATCH_SIZE)

        for (let batch = 0; batch < batches; batch++) {
            const startIdx = batch * BATCH_SIZE
            const endIdx = Math.min(startIdx + BATCH_SIZE, TOTAL_LEADS)
            const batchLeads = []

            for (let i = startIdx; i < endIdx; i++) {
                // First LEADS_WITH_ICEBREAKERS get icebreakers, rest are pending
                const withIcebreaker = i < LEADS_WITH_ICEBREAKERS
                batchLeads.push(generateLead(i, org.id, withIcebreaker))
            }

            const { data: inserted, error: insertError } = await supabase
                .from('leads')
                .insert(batchLeads)
                .select('id')

            if (insertError) {
                console.error(`   ❌ Batch ${batch + 1} failed:`, insertError.message)
            } else {
                totalInserted += inserted?.length || 0
                const progress = Math.round((totalInserted / TOTAL_LEADS) * 100)
                process.stdout.write(`\r   📥 Inserting leads: ${totalInserted}/${TOTAL_LEADS} (${progress}%)`)
            }
        }

        console.log(`\n   ✓ Inserted ${totalInserted} leads`)
        console.log(`     - ${LEADS_WITH_ICEBREAKERS} with icebreakers`)
        console.log(`     - ${TOTAL_LEADS - LEADS_WITH_ICEBREAKERS} pending icebreaker generation`)

        // ----------------------------------------------------------------
        // Step 7: Create 2 sample campaigns (without sequences column)
        // ----------------------------------------------------------------
        console.log('\n📧 Creating sample campaigns...')

        // Campaign 1: VA Services (Active with stats)
        const { data: campaign1, error: c1Error } = await supabase
            .from('campaigns')
            .insert({
                organization_id: org.id,
                name: 'Insurance Agency VA Outreach - Q1 2026',
                description: 'Initial outreach to independent insurance agencies about virtual assistant services',
                status: 'active',
                total_leads: 1000,
                emails_sent: 847,
                emails_opened: 312,
                emails_replied: 67,
                emails_bounced: 23
            })
            .select()
            .single()

        if (c1Error) {
            console.warn(`   ⚠️ Campaign 1 failed: ${c1Error.message}`)
        } else {
            console.log(`   ✓ Created campaign: "${campaign1.name}"`)

            // Create sequences for campaign 1
            await supabase.from('campaign_sequences').insert([
                {
                    campaign_id: campaign1.id,
                    step_number: 1,
                    subject: '{{icebreaker}} | Quick question about your agency',
                    body: `Hi {{first_name}},

{{icebreaker}}

At X Assure, we provide trained virtual assistants who specialize in insurance workflows. They're trained on the software you already use (AMS 360, EzLynx, HawkSoft, Applied Epic, NowCerts, QQ Catalyst).

Would love to show you how agencies like {{company_name}} are using our VAs to handle quotes, renewals, and carrier work.

Open to a quick 15-min call this week?

Best,
The X Assure Team`,
                    delay_days: 0,
                    variant_label: 'A'
                },
                {
                    campaign_id: campaign1.id,
                    step_number: 2,
                    subject: 'Re: Following up on VA support for {{company_name}}',
                    body: `Hi {{first_name}},

Just wanted to bump this to the top of your inbox. We've helped dozens of agencies like yours save 15-20 hours per week on operational tasks.

Would a quick 10-minute call work next week?

Best,
The X Assure Team`,
                    delay_days: 3,
                    variant_label: 'A'
                },
                {
                    campaign_id: campaign1.id,
                    step_number: 3,
                    subject: 'Last touch - VA support for {{company_name}}',
                    body: `Hi {{first_name}},

I know you're busy running {{company_name}}, so I'll keep this brief.

If you ever need help with operational tasks like quotes, renewals, or carrier work - we're here. Our trained insurance VAs work on your schedule.

Feel free to reply whenever it makes sense!

Best,
The X Assure Team`,
                    delay_days: 5,
                    variant_label: 'A'
                }
            ])
            console.log('   ✓ Added 3 sequences to campaign 1')
        }

        // Campaign 2: AI Tools (Draft)
        const { data: campaign2, error: c2Error } = await supabase
            .from('campaigns')
            .insert({
                organization_id: org.id,
                name: 'AI-Powered Agency Tools - Q1 2026',
                description: 'Promoting AI-powered tools for agency automation and efficiency',
                status: 'draft',
                total_leads: 0,
                emails_sent: 0,
                emails_opened: 0,
                emails_replied: 0,
                emails_bounced: 0
            })
            .select()
            .single()

        if (c2Error) {
            console.warn(`   ⚠️ Campaign 2 failed: ${c2Error.message}`)
        } else {
            console.log(`   ✓ Created campaign: "${campaign2.name}"`)

            // Create sequences for campaign 2
            await supabase.from('campaign_sequences').insert([
                {
                    campaign_id: campaign2.id,
                    step_number: 1,
                    subject: 'AI tools for {{company_name}}? Quick question',
                    body: `Hi {{first_name}},

Hope this finds you well!

I'm curious - how much time does your team spend on repetitive tasks like quote comparisons, renewal processing, and carrier submissions?

At X Assure, we've built AI-powered tools specifically for insurance agencies that can automate a lot of that work. Our clients typically save 15-20 hours per week per employee.

Would it make sense to show you a quick demo?

Best,
The X Assure Team`,
                    delay_days: 0,
                    variant_label: 'A'
                },
                {
                    campaign_id: campaign2.id,
                    step_number: 2,
                    subject: 'Re: Automation for your agency',
                    body: `Hi {{first_name}},

Quick follow-up - we just released some new AI features that agencies are loving:

• Auto-quote comparison across 20+ carriers
• Smart renewal reminders with AI-drafted emails
• Automated commission reconciliation

Happy to show you a 10-minute demo whenever works.

Best,
The X Assure Team`,
                    delay_days: 4,
                    variant_label: 'A'
                }
            ])
            console.log('   ✓ Added 2 sequences to campaign 2')
        }

        // ----------------------------------------------------------------
        // Step 7.5: Assign leads to Campaign 1 with realistic statuses
        // ----------------------------------------------------------------
        console.log('\n📋 Assigning leads to campaigns...')

        if (campaign1) {
            // Get first 1000 leads to assign to Campaign 1
            const { data: leadsToAssign, error: fetchLeadsError } = await supabase
                .from('leads')
                .select('id')
                .eq('organization_id', org.id)
                .order('created_at', { ascending: true })
                .limit(1000)

            if (fetchLeadsError) {
                console.warn(`   ⚠️ Failed to fetch leads: ${fetchLeadsError.message}`)
            } else if (leadsToAssign && leadsToAssign.length > 0) {
                const leadIds = leadsToAssign.map(l => l.id)
                console.log(`   Found ${leadIds.length} leads to assign`)

                // Batch update in groups of 100 to avoid database limits
                const batchSize = 100
                for (let i = 0; i < leadIds.length; i += batchSize) {
                    const batch = leadIds.slice(i, i + batchSize)
                    const { error: updateError } = await supabase
                        .from('leads')
                        .update({ campaign_id: campaign1.id, campaign_status: 'queued' })
                        .in('id', batch)

                    if (updateError) {
                        console.warn(`   ⚠️ Batch ${i / batchSize + 1} failed: ${updateError.message}`)
                    }
                }

                // Now update statuses in batches
                // 847 as 'sent'
                const sentIds = leadIds.slice(0, 847)
                for (let i = 0; i < sentIds.length; i += batchSize) {
                    const batch = sentIds.slice(i, i + batchSize)
                    await supabase.from('leads').update({ campaign_status: 'sent' }).in('id', batch)
                }

                // 67 as 'replied' 
                const repliedIds = sentIds.slice(0, 67)
                await supabase.from('leads').update({ campaign_status: 'replied' }).in('id', repliedIds)

                // 23 as 'bounced'
                const bouncedIds = sentIds.slice(67, 90)
                await supabase.from('leads').update({ campaign_status: 'bounced' }).in('id', bouncedIds)

                // Verify the updates
                const { count: verifyInCampaign } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .not('campaign_id', 'is', null)

                const { count: verifyReplied } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .eq('campaign_status', 'replied')

                console.log('   ✓ Assigned leads to Campaign 1')
                console.log(`     - In campaign: ${verifyInCampaign}`)
                console.log(`     - Replied: ${verifyReplied}`)
                console.log('     - 23 marked as bounced')
                console.log('     - 757 marked as sent (awaiting response)')
                console.log('     - 153 queued for sending')
            }
        }

        // ----------------------------------------------------------------
        // Step 8: Populate activity feed for realistic portal
        // ----------------------------------------------------------------
        console.log('\n📰 Populating activity feed...')


        const activities = [
            {
                organization_id: org.id,
                activity_type: 'reply',
                title: 'Reply received from Michael Thornton at Thornton Insurance Group',
                description: 'Interested in learning more about VA services',
                is_highlight: true,
                created_at: getTimeAgo(15).toISOString()
            },
            {
                organization_id: org.id,
                activity_type: 'reply',
                title: 'Reply received from Sarah Chen at Chen & Partners',
                description: 'Wants to schedule a demo call',
                is_highlight: true,
                created_at: getTimeAgo(45).toISOString()
            },
            {
                organization_id: org.id,
                activity_type: 'campaign_started',
                title: 'Campaign launched: Insurance Agency VA Outreach',
                description: '1,000 leads added to sequence',
                is_highlight: false,
                created_at: getTimeAgo(120).toISOString()
            },
            {
                organization_id: org.id,
                activity_type: 'icebreaker_generated',
                title: 'AI icebreakers generated for 250 new leads',
                description: 'Personalized openers ready for outreach',
                is_highlight: false,
                created_at: getTimeAgo(180).toISOString()
            },
            {
                organization_id: org.id,
                activity_type: 'lead_scraped',
                title: '500 new leads imported from LinkedIn Sales Navigator',
                description: 'Insurance agency owners in Texas and California',
                is_highlight: false,
                created_at: getTimeAgo(240).toISOString()
            },
            {
                organization_id: org.id,
                activity_type: 'reply',
                title: 'Reply received from Jennifer Patel at Securitas Insurance',
                description: 'Forwarded to procurement team',
                is_highlight: true,
                created_at: getTimeAgo(360).toISOString()
            },
            {
                organization_id: org.id,
                activity_type: 'email_opened',
                title: '47 emails opened in last hour',
                description: 'Insurance Agency VA Outreach campaign',
                is_highlight: false,
                created_at: getTimeAgo(60).toISOString()
            },
            {
                organization_id: org.id,
                activity_type: 'lead_scraped',
                title: '750 new leads imported',
                description: 'Commercial lines agency owners across midwest',
                is_highlight: false,
                created_at: getTimeAgo(480).toISOString()
            }
        ]

        const { error: activityError } = await supabase
            .from('activity_feed')
            .insert(activities)

        if (activityError) {
            console.warn(`   ⚠️ Could not populate activity feed: ${activityError.message}`)
        } else {
            console.log(`   ✓ Added ${activities.length} activity items`)
        }

        // ----------------------------------------------------------------
        // Summary
        // ----------------------------------------------------------------
        console.log('\n' + '='.repeat(60))
        console.log('✅ DEMO DATA SEEDING COMPLETE!')
        console.log('='.repeat(60))
        console.log(`
📊 Summary:
   • Organization: ${DEMO_ORG_NAME} (slug: ${DEMO_SLUG})
   • Organization ID: ${org.id}
   • Leads created: ${totalInserted}
   • Pre-generated icebreakers: ${Math.min(totalInserted, LEADS_WITH_ICEBREAKERS)}
   • Pending icebreakers: ${Math.max(0, totalInserted - LEADS_WITH_ICEBREAKERS)}
   • Campaigns created: 2
     - "Insurance Agency VA Outreach - Q1 2026" (active, with stats)
     - "AI-Powered Agency Tools - Q1 2026" (draft)
   • Activity feed: 8 items

🔐 CUSTOMER PORTAL LOGIN:
   📧 Email: ${DEMO_CUSTOMER_EMAIL}
   🔑 Password: ${DEMO_CUSTOMER_PASSWORD}
   🌐 URL: /portal

🎬 You're ready to record your demo!

🧹 To clean up after recording, run:
   npm run demo:cleanup
`)

    } catch (error) {
        console.error('\n❌ Error seeding demo data:', error)
        process.exit(1)
    }
}

// Run the seeder
seedDemoData()
