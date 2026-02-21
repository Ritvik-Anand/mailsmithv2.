// Supabase Edge Function: process-icebreakers
// ─────────────────────────────────────────────────────────────────────────────
// Triggered by a Supabase Database Webhook whenever icebreaker_generation_status
// changes to 'queued' on a scrape_jobs row.
//
// Processes leads in concurrent batches of 10. Each invocation runs for up to
// 2 minutes then saves its cursor and triggers the next invocation by updating
// the status back to 'running', which fires the webhook again.
//
// Supports 20K+ lead jobs fully unattended. No browser tab required.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const CONCURRENT_BATCH_SIZE = 10      // DeepSeek calls fired simultaneously
const LEADS_PER_CHUNK = 100           // Leads fetched from DB per iteration
const MAX_RUNTIME_MS = 110_000        // 110s — safely under 150s Edge Function limit

Deno.serve(async (req: Request) => {
    // ── Auth: only allow Supabase webhook calls ────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    const webhookSecret = Deno.env.get('SUPABASE_WEBHOOK_SECRET')
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    // ── Parse webhook payload ──────────────────────────────────────────────────
    let jobId: string
    let configOrgId: string | null = null

    try {
        const payload = await req.json()
        // Supabase DB webhook sends { record: { ... } }
        const record = payload?.record
        if (!record?.id) {
            return new Response('No record in payload', { status: 400 })
        }
        jobId = record.id
        configOrgId = record.icebreaker_config_org_id ?? null
    } catch {
        return new Response('Invalid payload', { status: 400 })
    }

    // ── Supabase Admin Client ──────────────────────────────────────────────────
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── DeepSeek Client ────────────────────────────────────────────────────────
    const deepseek = new OpenAI({
        apiKey: Deno.env.get('DEEPSEEK_API_KEY')!,
        baseURL: 'https://api.deepseek.com',
    })

    // ── Mark job as running ────────────────────────────────────────────────────
    await supabase
        .from('scrape_jobs')
        .update({
            icebreaker_generation_status: 'running',
            icebreaker_generation_started_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .in('icebreaker_generation_status', ['queued', 'running']) // idempotent

    // ── Fetch customer context once (shared across all leads in this job) ──────
    const orgIdToUse = configOrgId ?? (await getJobOrgId(supabase, jobId))
    const customerContext = orgIdToUse
        ? await getCustomerContext(supabase, orgIdToUse)
        : null

    // ── Processing loop ────────────────────────────────────────────────────────
    const startTime = Date.now()
    let totalCompleted = 0
    let totalFailed = 0
    let hasMore = true

    while (hasMore && (Date.now() - startTime) < MAX_RUNTIME_MS) {
        // Fetch next chunk of pending leads for this job
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, first_name, last_name, company_name, job_title, organization_id, raw_scraped_data')
            .eq('scrape_job_id', jobId)
            .eq('icebreaker_status', 'pending')
            .limit(LEADS_PER_CHUNK)

        if (error || !leads || leads.length === 0) {
            hasMore = false
            break
        }

        // Mark this chunk as 'generating' so they aren't picked up by another invocation
        const chunkIds = leads.map((l: any) => l.id)
        await supabase
            .from('leads')
            .update({ icebreaker_status: 'generating' })
            .in('id', chunkIds)

        // Process in sub-batches of CONCURRENT_BATCH_SIZE
        for (let i = 0; i < leads.length; i += CONCURRENT_BATCH_SIZE) {
            if ((Date.now() - startTime) >= MAX_RUNTIME_MS) break

            const subBatch = leads.slice(i, i + CONCURRENT_BATCH_SIZE)

            const results = await Promise.allSettled(
                subBatch.map((lead: any) =>
                    generateAndSave(supabase, deepseek, lead, customerContext)
                )
            )

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    totalCompleted++
                } else {
                    totalFailed++
                }
            }
        }

        // Update progress on the scrape_job row
        await supabase
            .from('scrape_jobs')
            .update({
                icebreaker_generation_progress: {
                    completed: totalCompleted,
                    failed: totalFailed,
                    total: await getPendingCount(supabase, jobId, totalCompleted + totalFailed)
                }
            })
            .eq('id', jobId)

        // Check if any pending leads remain
        const { count } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('scrape_job_id', jobId)
            .eq('icebreaker_status', 'pending')

        if ((count ?? 0) === 0) {
            hasMore = false
        }
    }

    // ── Wrap up: are we done or do we need another invocation? ─────────────────
    const { count: remaining } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('scrape_job_id', jobId)
        .in('icebreaker_status', ['pending', 'generating'])

    if ((remaining ?? 0) === 0) {
        // All done
        await supabase
            .from('scrape_jobs')
            .update({
                icebreaker_generation_status: 'completed',
                icebreaker_generation_completed_at: new Date().toISOString()
            })
            .eq('id', jobId)

        console.log(`[process-icebreakers] Job ${jobId} COMPLETED. ${totalCompleted} succeeded, ${totalFailed} failed.`)
    } else {
        // Time budget exhausted but more leads remain — self-chain via webhook
        // Setting status to 'queued' triggers the database webhook again
        await supabase
            .from('scrape_jobs')
            .update({ icebreaker_generation_status: 'queued' })
            .eq('id', jobId)

        console.log(`[process-icebreakers] Job ${jobId} pausing. ${remaining} leads remain. Re-queuing...`)
    }

    return new Response(
        JSON.stringify({ completed: totalCompleted, failed: totalFailed, remaining }),
        { headers: { 'Content-Type': 'application/json' } }
    )
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function generateAndSave(
    supabase: any,
    deepseek: any,
    lead: any,
    customerContext: any
): Promise<boolean> {
    try {
        const icebreaker = await callDeepSeek(deepseek, lead, customerContext)

        if (icebreaker) {
            await supabase
                .from('leads')
                .update({
                    icebreaker,
                    icebreaker_status: 'completed',
                    icebreaker_generated_at: new Date().toISOString()
                })
                .eq('id', lead.id)
            return true
        } else {
            throw new Error('Empty response from DeepSeek')
        }
    } catch (err) {
        console.error(`[process-icebreakers] Lead ${lead.id} failed:`, err)
        await supabase
            .from('leads')
            .update({ icebreaker_status: 'failed' })
            .eq('id', lead.id)
        return false
    }
}

async function callDeepSeek(deepseek: any, lead: any, customerContext: any): Promise<string | null> {
    const firstName = lead.first_name || ''
    const raw = lead.raw_scraped_data || {}

    const prospectParts = [
        lead.first_name, lead.last_name, lead.company_name, lead.job_title,
        raw.headline, raw.company_description, raw.company_industry,
        raw.company_website, raw.company_total_funding, raw.company_annual_revenue,
        raw.seniority_level, raw.location, raw.city, raw.country,
    ].filter(Boolean)

    if (Array.isArray(raw.company_technologies)) {
        prospectParts.push(raw.company_technologies.join(', '))
    }

    const prospectInfo = prospectParts.join(', ')

    const customerContextText = customerContext?.description
        ? `Here is a bunch of information about me so that you can make these icebreakers more personalised:\n\n${customerContext.description}`
        : ''

    const exampleFormat = customerContext?.example_format
        ?? '{"icebreaker":"Hey {name}, \\n\\n really respect X and love that you\'re doing Y. Wanted to run something by you"}'

    const goodExamples = (customerContext?.good_examples ?? [])
        .map((ex: string, i: number) => `Example ${i + 1}:\n${ex}`).join('\n\n')
    const badExamples = (customerContext?.bad_examples ?? [])
        .map((ex: string, i: number) => `Bad Example ${i + 1}:\n${ex}`).join('\n\n')

    const userMessage = `Your task is to take as input a bunch of personal information about a prospect, and then design a customized, one line icebreaker to begin the conversation and to imply the rest of my communique is personalised.

You'll return this icebreaker in JSON using this format:

${exampleFormat}

${customerContextText}${goodExamples ? `\n\nHere are examples of GOOD icebreakers:\n\n${goodExamples}` : ''}${badExamples ? `\n\nHere are examples of BAD icebreakers:\n\n${badExamples}` : ''}

Rules:
- Write in a spartan, laconic tone of voice
- Weave in context with my personal information wherever possible.
- Keep things very short and follow the provided format.
- Shorten the company name (say, "XYZ" instead of "XYZ Tech") whenever possible.
- Start with "Hey ${firstName},"
- The icebreaker should be 2-3 sentences max
- Return ONLY valid JSON, no other text

Here is the prospect information:

${prospectInfo}`

    const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: 'You are a helpful, intelligent writing assistant.' },
            { role: 'user', content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) return null

    try {
        const match = content.match(/\{[\s\S]*"icebreaker"[\s\S]*\}/)
        if (match) {
            const parsed = JSON.parse(match[0])
            if (parsed.icebreaker) {
                return parsed.icebreaker
                    .replace(/\\n/g, '\n')
                    .replace(/^["']|["']$/g, '')
                    .trim()
            }
        }
    } catch {
        // fall through to raw text
    }
    return content.replace(/^["']|["']$/g, '').trim()
}

async function getCustomerContext(supabase: any, orgId: string): Promise<any> {
    try {
        const { data } = await supabase
            .from('organizations')
            .select('icebreaker_context')
            .eq('id', orgId)
            .single()
        return data?.icebreaker_context ?? null
    } catch {
        return null
    }
}

async function getJobOrgId(supabase: any, jobId: string): Promise<string | null> {
    try {
        const { data } = await supabase
            .from('scrape_jobs')
            .select('organization_id')
            .eq('id', jobId)
            .single()
        return data?.organization_id ?? null
    } catch {
        return null
    }
}

async function getPendingCount(supabase: any, jobId: string, processedSoFar: number): Promise<number> {
    try {
        const { count } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('scrape_job_id', jobId)
        return (count ?? processedSoFar)
    } catch {
        return processedSoFar
    }
}
