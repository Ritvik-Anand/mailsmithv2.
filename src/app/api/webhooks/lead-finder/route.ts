import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchLeadSearchResults } from '@/lib/lead-finder/apify-client'
import { ApifyLeadResult, Lead } from '@/types'

// Use service role for webhook processing
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Robustly find an email address in an Apify result.
 */
function findEmail(r: any): string | null {
    if (!r) return null;
    const standardKeys = ['email', 'personal_email', 'work_email', 'contact_email', 'email_address', 'primary_email'];
    for (const key of standardKeys) {
        if (typeof r[key] === 'string' && r[key].includes('@')) return r[key];
    }
    if (Array.isArray(r.emails) && r.emails.length > 0 && typeof r.emails[0] === 'string') return r.emails[0];
    if (Array.isArray(r.email) && r.email.length > 0 && typeof r.email[0] === 'string') return r.email[0];
    for (const key in r) {
        if (typeof r[key] === 'string' && r[key].length > 5 && r[key].includes('@')) {
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r[key])) return r[key];
        }
    }
    return null;
}

/**
 * Transform Apify results to Lead format
 */
function transformToLeads(
    results: ApifyLeadResult[],
    organizationId: string,
    scrapeJobId: string
): Partial<Lead>[] {
    const leads: Partial<Lead>[] = [];

    for (const r of results) {
        const email = findEmail(r);
        if (!email) continue;

        leads.push({
            organization_id: organizationId,
            first_name: r.first_name || null,
            last_name: r.last_name || null,
            email: email,
            phone: r.mobile_number || null,
            linkedin_url: r.linkedin || null,
            company_name: r.company_name || null,
            company_domain: r.company_domain || null,
            job_title: r.job_title || null,
            industry: r.industry || null,
            company_size: r.company_size || null,
            location: [r.city, r.state, r.country].filter(Boolean).join(', ') || null,
            raw_scraped_data: r as Record<string, unknown>,
            enrichment_data: {
                headline: r.headline,
                functional_level: r.functional_level,
                seniority_level: r.seniority_level,
                personal_email: r.personal_email,
                company_linkedin: r.company_linkedin,
                company_description: r.company_description,
                company_funding: r.company_total_funding,
                company_revenue: r.company_annual_revenue,
                company_founded: r.company_founded_year,
                technologies: r.company_technologies,
            },
            source: 'apify_leads_finder' as any,
            scrape_job_id: scrapeJobId as any,
            icebreaker_status: 'pending' as any,
            campaign_status: 'not_added' as any,
        });
    }

    return leads;
}

export async function POST(request: NextRequest) {
    try {
        const jobId = request.nextUrl.searchParams.get('jobId')

        if (!jobId) {
            return NextResponse.json(
                { error: 'Missing jobId parameter' },
                { status: 400 }
            )
        }

        const body = await request.json()

        // Extract event data from Apify webhook
        const { eventType, resource, eventData } = body

        console.log(`[Lead Finder Webhook] Event: ${eventType}, Job: ${jobId}`)

        // Get the job
        const { data: job, error: jobError } = await supabaseAdmin
            .from('scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            console.error('[Lead Finder Webhook] Job not found:', jobId)
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            )
        }

        // Handle different event types
        if (eventType === 'ACTOR.RUN.SUCCEEDED') {
            const datasetId = resource?.defaultDatasetId || eventData?.defaultDatasetId

            if (!datasetId) {
                // Try to get from the run info
                console.error('[Lead Finder Webhook] No dataset ID in webhook')
                await supabaseAdmin
                    .from('scrape_jobs')
                    .update({
                        status: 'failed',
                        completed_at: new Date().toISOString(),
                        error_message: 'No results dataset found',
                    })
                    .eq('id', jobId)

                return NextResponse.json({ success: false, error: 'No dataset ID' })
            }

            // Fetch all results
            const { items, total } = await fetchLeadSearchResults(datasetId, { limit: 50000 })

            console.log(`[Lead Finder Webhook] Fetched ${items.length} leads (total: ${total})`)

            // Transform to leads
            const leads = transformToLeads(items, job.organization_id, jobId)

            // Deduplicate by email
            const uniqueLeads = leads.reduce((acc, lead) => {
                if (!acc.find(l => l.email === lead.email)) {
                    acc.push(lead)
                }
                return acc
            }, [] as Partial<Lead>[])

            // Insert leads in batches
            let imported = 0
            const batchSize = 100

            for (let i = 0; i < uniqueLeads.length; i += batchSize) {
                const batch = uniqueLeads.slice(i, i + batchSize)

                const { data: insertedLeads, error: insertError } = await supabaseAdmin
                    .from('leads')
                    .upsert(
                        batch.map(l => ({
                            ...l,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })),
                        {
                            onConflict: 'organization_id,email',
                            ignoreDuplicates: false
                        }
                    )
                    .select('id')

                if (insertError) {
                    console.error('[Lead Finder Webhook] Batch insert error:', insertError)
                } else {
                    imported += insertedLeads?.length || 0
                }
            }

            // Update job
            await supabaseAdmin
                .from('scrape_jobs')
                .update({
                    status: 'completed',
                    leads_found: total,
                    leads_imported: imported,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', jobId)

            // Create notification for user
            await supabaseAdmin.from('notifications').insert({
                organization_id: job.organization_id,
                type: 'system',
                title: 'Lead Search Complete',
                message: `Found ${total} leads, imported ${imported} new contacts.`,
                metadata: { jobId, leadsFound: total, leadsImported: imported },
            })

            // Log activity
            await supabaseAdmin.from('activity_logs').insert({
                organization_id: job.organization_id,
                action: 'lead_search_completed',
                resource_type: 'scrape_job',
                resource_id: jobId,
                metadata: { leadsFound: total, leadsImported: imported },
            })

            console.log(`[Lead Finder Webhook] Job ${jobId} completed: ${imported} leads imported`)

            return NextResponse.json({
                success: true,
                leadsFound: total,
                leadsImported: imported
            })

        } else if (eventType === 'ACTOR.RUN.FAILED' || eventType === 'ACTOR.RUN.ABORTED') {
            const errorMessage = eventData?.statusMessage || 'Search failed'

            await supabaseAdmin
                .from('scrape_jobs')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: errorMessage,
                })
                .eq('id', jobId)

            // Create notification
            await supabaseAdmin.from('notifications').insert({
                organization_id: job.organization_id,
                type: 'alert',
                title: 'Lead Search Failed',
                message: `Your lead search could not be completed. ${errorMessage}`,
                metadata: { jobId, error: errorMessage },
            })

            console.log(`[Lead Finder Webhook] Job ${jobId} failed: ${errorMessage}`)

            return NextResponse.json({ success: false, error: errorMessage })
        }

        return NextResponse.json({ success: true, message: 'Event processed' })

    } catch (error) {
        console.error('[Lead Finder Webhook] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Also support GET for health checks
export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'lead-finder-webhook' })
}
